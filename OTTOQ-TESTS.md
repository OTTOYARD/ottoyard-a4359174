# OTTOQ Test Scenarios

## Test 1: Vehicle Telemetry & Auto-Charging

**Scenario**: Vehicle reports low SOC, system auto-triggers charging

```bash
# Get a vehicle ID from Nashville
VEHICLE_ID=$(curl -s http://localhost:54321/rest/v1/ottoq_vehicles?select=id&city_id=eq.<nashville_city_id>&limit=1 | jq -r '.[0].id')

# Send low SOC telemetry
curl -X POST http://localhost:54321/functions/v1/ottoq-vehicles-telemetry \
  -H "Content-Type: application/json" \
  -d "{
    \"vehicle_id\": \"$VEHICLE_ID\",
    \"soc\": 0.15,
    \"odometer_km\": 25000,
    \"ts\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
  }"

# Expected: Returns job_triggered with job details
# Verify in DB: SELECT * FROM ottoq_jobs WHERE vehicle_id = '$VEHICLE_ID' ORDER BY created_at DESC LIMIT 1;
```

**Expected Results:**
- Vehicle SOC updated to 0.15
- CHARGE job created in PENDING state
- Job quickly transitions to SCHEDULED with assigned resource
- Event logged: `VEHICLE_TELEMETRY` and `JOB_SCHEDULED`

---

## Test 2: Manual Job Request

**Scenario**: Dashboard manually books maintenance

```bash
# Get a vehicle
VEHICLE_ID=$(curl -s http://localhost:54321/rest/v1/ottoq_vehicles?select=id&limit=1 | jq -r '.[0].id')

# Request maintenance
curl -X POST http://localhost:54321/functions/v1/ottoq-jobs-request \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: test-$(uuidgen)" \
  -d "{
    \"vehicle_id\": \"$VEHICLE_ID\",
    \"job_type\": \"MAINTENANCE\",
    \"metadata\": {
      \"task\": \"tire_rotation\",
      \"notes\": \"Scheduled by fleet manager\"
    }
  }"

# Expected: Returns job with state PENDING/SCHEDULED
```

**Expected Results:**
- Job created with MAINTENANCE type
- Scheduler assigns MAINTENANCE_BAY resource
- Vehicle status changes to ENROUTE_DEPOT
- Idempotency key prevents duplicates on retry

---

## Test 3: Depot Resource Grid

**Scenario**: Dashboard fetches live depot status

```bash
# Get a depot ID
DEPOT_ID=$(curl -s http://localhost:54321/rest/v1/ottoq_depots?select=id&limit=1 | jq -r '.[0].id')

# Fetch resources
curl http://localhost:54321/functions/v1/ottoq-depots-resources/$DEPOT_ID | jq

# Expected: Returns 52 resources (40 charge + 10 detail + 2 maintenance)
# Each has: type, index, status, label with vehicle info
```

**Expected Results:**
- 40 CHARGE_STALL resources (index 1-40)
- 10 CLEAN_DETAIL_STALL resources (index 41-50)
- 2 MAINTENANCE_BAY resources (index 1-2)
- Labels show vehicle IDs and time remaining for BUSY resources
- Branding: "Powered by OTTOQ Technology"

---

## Test 4: Vehicle Status Query

**Scenario**: Get vehicle's current assignment

```bash
# Get a vehicle with active job
VEHICLE_ID=$(curl -s http://localhost:54321/rest/v1/ottoq_jobs?select=vehicle_id&state=eq.ACTIVE&limit=1 | jq -r '.[0].vehicle_id')

# Get status
curl http://localhost:54321/functions/v1/ottoq-vehicles-status/$VEHICLE_ID | jq

# Expected: Returns vehicle info + assignment details
```

**Expected Results:**
- Vehicle data: id, external_ref, soc, odometer, status
- Assignment: depot info, resource (stall/bay), ETA, completion time
- If ACTIVE: shows time remaining
- If SCHEDULED: shows start time

---

## Test 5: Job Cancellation

**Scenario**: Cancel a scheduled job

```bash
# Get a scheduled job
JOB_ID=$(curl -s http://localhost:54321/rest/v1/ottoq_jobs?select=id&state=eq.SCHEDULED&limit=1 | jq -r '.[0].id')

# Cancel it
curl -X POST http://localhost:54321/functions/v1/ottoq-jobs-cancel/$JOB_ID

# Verify resource freed
curl -s http://localhost:54321/rest/v1/ottoq_resources?select=status&current_job_id=eq.$JOB_ID | jq
```

**Expected Results:**
- Job state changes to CANCELLED
- Resource status changes to AVAILABLE
- current_job_id cleared
- Vehicle status returns to IDLE
- Event logged: `JOB_CANCELLED`

---

## Test 6: Scheduler State Transitions

**Scenario**: Verify automatic SCHEDULED → ACTIVE → COMPLETED transitions

```bash
# Manually trigger scheduler
curl -X POST http://localhost:54321/functions/v1/ottoq-scheduler \
  -H "Content-Type: application/json" \
  -d '{"process_transitions": true}'

# Check state changes
curl -s http://localhost:54321/rest/v1/ottoq_jobs?select=id,state,job_type&state=neq.PENDING&order=updated_at.desc&limit=10 | jq
```

**Expected Results:**
- Jobs past scheduled_start_at move to ACTIVE
- Resources change from RESERVED to BUSY
- Jobs past ETA move to COMPLETED
- Resources freed (AVAILABLE)
- Vehicles return to IDLE

---

## Test 7: Simulator Reset

**Scenario**: Test simulator world reset

```bash
# Check current state
curl http://localhost:54321/functions/v1/ottoq-simulator | jq

# Trigger reset
curl -X POST http://localhost:54321/functions/v1/ottoq-simulator \
  -H "Content-Type: application/json" \
  -d '{"action": "reset"}'

# Verify reset
curl -s http://localhost:54321/rest/v1/ottoq_jobs?select=count | jq
curl -s http://localhost:54321/rest/v1/ottoq_resources?select=status | jq -r 'group_by(.status) | map({status: .[0].status, count: length})'
```

**Expected Results:**
- All jobs cancelled
- All resources AVAILABLE (except OUT_OF_SERVICE)
- Vehicle SOCs randomized
- Event logged: `SIMULATOR_RESET`
- last_reset_at updated

---

## Test 8: Concurrent Reservation Handling

**Scenario**: Test row-locking prevents double-booking

```bash
# Get depot with 1 available resource
DEPOT_ID=$(curl -s http://localhost:54321/rest/v1/ottoq_depots?select=id&limit=1 | jq -r '.[0].id')

# Get 5 vehicles
VEHICLES=$(curl -s "http://localhost:54321/rest/v1/ottoq_vehicles?select=id&city_id=eq.<city_id>&limit=5" | jq -r '.[].id')

# Rapidly create 5 jobs (simulates concurrent requests)
for VID in $VEHICLES; do
  curl -X POST http://localhost:54321/functions/v1/ottoq-jobs-request \
    -H "Content-Type: application/json" \
    -d "{\"vehicle_id\": \"$VID\", \"job_type\": \"CHARGE\"}" &
done
wait

# Check: Only 1 job should get each resource
curl -s http://localhost:54321/rest/v1/ottoq_resources?select=id,current_job_id&current_job_id=not.is.null | jq
```

**Expected Results:**
- No resource has multiple jobs
- Some jobs remain PENDING (no resource available)
- Row-locking prevented conflicts
- No duplicate current_job_id values

---

## Test 9: Periodic Maintenance Schedule

**Scenario**: Create odometer-based maintenance rule

```bash
VEHICLE_ID=$(curl -s http://localhost:54321/rest/v1/ottoq_vehicles?select=id&limit=1 | jq -r '.[0].id')

# Create schedule: tire rotation every 5000 km
curl -X POST http://localhost:54321/functions/v1/ottoq-schedules-upsert \
  -H "Content-Type: application/json" \
  -d "{
    \"vehicle_id\": \"$VEHICLE_ID\",
    \"rule_type\": \"odometer_interval\",
    \"rule_jsonb\": {
      \"interval_km\": 5000,
      \"job_type\": \"MAINTENANCE\",
      \"task\": \"tire_rotation\"
    },
    \"next_due_at\": \"$(date -u -d '+30 days' +%Y-%m-%dT%H:%M:%SZ)\"
  }"

# Verify created
curl -s "http://localhost:54321/rest/v1/ottoq_schedules?select=*&vehicle_id=eq.$VEHICLE_ID" | jq
```

**Expected Results:**
- Schedule created/updated
- next_due_at set to 30 days from now
- Event logged: `SCHEDULE_CREATED`
- Upsert: calling again updates existing rule

---

## Test 10: System Configuration

**Scenario**: Fetch system config and branding

```bash
curl http://localhost:54321/functions/v1/ottoq-config | jq
```

**Expected Results:**
```json
{
  "branding": "Powered by OTTOQ Technology",
  "cities": [
    {
      "id": "...",
      "name": "Nashville",
      "tz": "America/Chicago",
      "depots": [
        {
          "id": "...",
          "name": "OTTOYARD Mini - Nashville",
          "charge_threshold_soc": 0.20
        }
      ]
    }
  ],
  "simulator": {
    "is_running": false,
    "mode": "auto",
    "config": { ... }
  },
  "version": "1.0.0",
  "features": {
    "auto_charging": true,
    "maintenance_scheduling": true,
    "detailing": true,
    "realtime_updates": true
  }
}
```

---

## Test 11: Idempotency

**Scenario**: Verify idempotent job creation

```bash
VEHICLE_ID=$(curl -s http://localhost:54321/rest/v1/ottoq_vehicles?select=id&limit=1 | jq -r '.[0].id')
IDEM_KEY="test-idempotency-$(uuidgen)"

# Create job with idempotency key
curl -X POST http://localhost:54321/functions/v1/ottoq-jobs-request \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $IDEM_KEY" \
  -d "{\"vehicle_id\": \"$VEHICLE_ID\", \"job_type\": \"CHARGE\"}" | jq '.job.id' > /tmp/job1.txt

# Retry with same key
curl -X POST http://localhost:54321/functions/v1/ottoq-jobs-request \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $IDEM_KEY" \
  -d "{\"vehicle_id\": \"$VEHICLE_ID\", \"job_type\": \"CHARGE\"}" | jq '.job.id' > /tmp/job2.txt

# Compare IDs (should be identical)
diff /tmp/job1.txt /tmp/job2.txt
```

**Expected Results:**
- Same job_id returned both times
- Second response includes `"idempotent": true`
- No duplicate job created

---

## Test 12: Realtime Updates

**Scenario**: Subscribe to resource updates

```typescript
// In browser console or Node script
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'http://localhost:54321',
  '<anon-key>'
);

const DEPOT_ID = '<depot-id>';

const channel = supabase
  .channel(`depot:${DEPOT_ID}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'ottoq_resources',
    filter: `depot_id=eq.${DEPOT_ID}`,
  }, (payload) => {
    console.log('Resource updated:', payload.new);
  })
  .subscribe();

// Now create a job and watch for resource status changes
```

**Expected Results:**
- Real-time events received when resources change state
- Payload includes resource id, status, current_job_id
- Zero polling required

---

## Performance Benchmarks

### Target Metrics
- **API Response Time**: < 200ms (p95)
- **Scheduler Throughput**: > 100 jobs/min
- **Concurrent Bookings**: No conflicts under 50 req/s
- **Utilization Target**: ~50% (configurable)
- **Reset Time**: < 5 seconds for 900 vehicles

### Load Test
```bash
# Install siege or similar
siege -c 50 -r 10 -H "Content-Type: application/json" \
  http://localhost:54321/functions/v1/ottoq-jobs-request \
  POST < job-payload.json
```

---

## Debugging

### Check Scheduler Logs
```bash
supabase functions logs ottoq-scheduler --tail
```

### Query Active Jobs
```sql
SELECT 
  j.id,
  j.job_type,
  j.state,
  v.external_ref as vehicle,
  r.resource_type,
  r.index as resource_index,
  EXTRACT(EPOCH FROM (now() - j.scheduled_start_at)) as elapsed_seconds,
  j.eta_seconds
FROM ottoq_jobs j
JOIN ottoq_vehicles v ON j.vehicle_id = v.id
LEFT JOIN ottoq_resources r ON j.resource_id = r.id
WHERE j.state IN ('SCHEDULED', 'ACTIVE')
ORDER BY j.scheduled_start_at;
```

### Check Resource Utilization
```sql
SELECT 
  d.name as depot,
  r.resource_type,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE r.status = 'AVAILABLE') as available,
  COUNT(*) FILTER (WHERE r.status = 'RESERVED') as reserved,
  COUNT(*) FILTER (WHERE r.status = 'BUSY') as busy
FROM ottoq_resources r
JOIN ottoq_depots d ON r.depot_id = d.id
GROUP BY d.name, r.resource_type
ORDER BY d.name, r.resource_type;
```

---

## Continuous Integration

Add to CI pipeline:
```yaml
test:
  script:
    - supabase start
    - npm run test:ottoq
    - supabase stop
```

Create `test:ottoq` script that runs all above scenarios and validates responses.
