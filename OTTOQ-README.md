# OTTO-Q - Vehicle-to-Depot Queuing & Reservation System

**Powered by OTTO-Q Technology**

OTTO-Q is a production-ready backend system for managing electric vehicle charging, maintenance, and detailing reservations across multi-city depot networks.

## 🏗️ Architecture

### Database Schema
- **9 Core Tables**: cities, depots, resources, vehicles, jobs, schedules, events, webhooks, simulator_state
- **900 Mock Vehicles**: 300 per city (Nashville, Austin, LA)
- **312 Resources per city**: 40 DCFC charging stalls, 10 cleaning/detail stalls, 2 maintenance bays per depot
- **Real-time Updates**: Supabase Realtime channels for live status

### State Machines

**Job States:**
```
PENDING → SCHEDULED → ACTIVE → COMPLETED (or CANCELLED/EXPIRED)
```

**Resource States:**
```
AVAILABLE ↔ RESERVED ↔ BUSY (+ OUT_OF_SERVICE)
```

**Vehicle States:**
```
IDLE/ON_TRIP → ENROUTE_DEPOT → AT_DEPOT → IN_SERVICE → IDLE
```

## 🚀 Edge Functions

### Core APIs

| Function | Method | Description |
|----------|--------|-------------|
| `ottoq-vehicles-telemetry` | POST | Ingest vehicle telemetry, auto-trigger charging |
| `ottoq-jobs-request` | POST | Create reservation request |
| `ottoq-depots-resources` | GET | Get depot resource grid (50 cells + 2 bays) |
| `ottoq-vehicles-status` | GET | Get vehicle status & assignment |
| `ottoq-jobs-cancel` | POST | Cancel job & free resource |
| `ottoq-schedules-upsert` | POST | Define periodic maintenance rules |
| `ottoq-config` | GET | System configuration & branding |

### System Functions

| Function | Description |
|----------|-------------|
| `ottoq-scheduler` | Core scheduling with row-locking, state transitions |
| `ottoq-simulator` | Mock simulation with auto-reset every 5-10 min |

## 📡 Realtime Channels

Subscribe to these channels for live updates:

- `realtime:ottoq` - Global ticks, job completions
- `realtime:depots:{depot_id}` - Resource grid updates
- `realtime:vehicles:{vehicle_id}` - Vehicle reservations

## 🔧 Local Development

### Prerequisites
- Supabase CLI installed
- Deno runtime (for edge functions)

### Setup

1. **Start Supabase locally:**
```bash
supabase start
```

2. **Database is auto-seeded with:**
   - 3 cities (Nashville, Austin, LA)
   - 6 depots (2 per city)
   - 312 resources per city
   - 900 vehicles

3. **Environment variables** (auto-configured):
```env
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

### Testing Locally

```bash
# Test telemetry ingestion
curl -X POST http://localhost:54321/functions/v1/ottoq-vehicles-telemetry \
  -H "Content-Type: application/json" \
  -d '{"vehicle_id":"<uuid>","soc":0.18,"odometer_km":15000}'

# Create a charging reservation
curl -X POST http://localhost:54321/functions/v1/ottoq-jobs-request \
  -H "Content-Type: application/json" \
  -d '{"vehicle_id":"<uuid>","job_type":"CHARGE"}'

# Get depot resources
curl http://localhost:54321/functions/v1/ottoq-depots-resources/<depot_id>

# Get vehicle status
curl http://localhost:54321/functions/v1/ottoq-vehicles-status/<vehicle_id>

# Get system config
curl http://localhost:54321/functions/v1/ottoq-config
```

## 🎮 Simulator

The simulator runs continuously with:
- **New reservation every 30-60s**
- **Random job completions**
- **Auto-reset every 5-10 minutes**

### Simulator Controls

```bash
# Start simulator
curl -X POST http://localhost:54321/functions/v1/ottoq-simulator \
  -H "Content-Type: application/json" \
  -d '{"action":"start"}'

# Stop simulator
curl -X POST http://localhost:54321/functions/v1/ottoq-simulator \
  -H "Content-Type: application/json" \
  -d '{"action":"stop"}'

# Manual reset
curl -X POST http://localhost:54321/functions/v1/ottoq-simulator \
  -H "Content-Type: application/json" \
  -d '{"action":"reset"}'

# Single tick (testing)
curl -X POST http://localhost:54321/functions/v1/ottoq-simulator \
  -H "Content-Type: application/json" \
  -d '{"action":"tick"}'

# Check if reset needed
curl -X POST http://localhost:54321/functions/v1/ottoq-simulator \
  -H "Content-Type: application/json" \
  -d '{"action":"check_reset"}'
```

## 📊 Scheduling Algorithm

### Resource Selection
1. Find available resources by type (CHARGE_STALL, CLEAN_DETAIL_STALL, MAINTENANCE_BAY)
2. Use row-level locking (`FOR UPDATE SKIP LOCKED`) to prevent double-booking
3. Reserve resource and create SCHEDULED job
4. Calculate ETA based on job type:
   - CHARGE: 40 min ± 10 min
   - DETAILING: 90 min ± 30 min
   - MAINTENANCE: 3 hr ± 1 hr

### State Transitions
- **SCHEDULED → ACTIVE**: When scheduled time arrives
- **ACTIVE → COMPLETED**: When ETA elapsed
- Resources automatically freed on completion

### Auto-Charging
Vehicles with SOC ≤ threshold (default 20%) automatically trigger CHARGE jobs

## 🔒 Security & Reliability

### Concurrency
- Row-level locking prevents double-booking
- Optimistic locking on resource updates
- Transaction-based state changes

### Idempotency
- Accept `Idempotency-Key` header on job creation
- Prevents duplicate reservations

### Monitoring
- All events logged to `ottoq_events` table
- Append-only audit trail
- Queryable by entity type and ID

## 📦 Production Deployment

### Environment Setup
Set these secrets in Supabase dashboard:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

### Deploy Functions
```bash
supabase functions deploy ottoq-vehicles-telemetry
supabase functions deploy ottoq-jobs-request
supabase functions deploy ottoq-depots-resources
supabase functions deploy ottoq-vehicles-status
supabase functions deploy ottoq-jobs-cancel
supabase functions deploy ottoq-schedules-upsert
supabase functions deploy ottoq-config
supabase functions deploy ottoq-scheduler
supabase functions deploy ottoq-simulator
```

### Run Migrations
```bash
supabase db push
```

### Scheduler Worker
For production, run scheduler as a cron job:
```sql
SELECT cron.schedule(
  'ottoq-scheduler-tick',
  '* * * * *', -- every minute
  $$
  SELECT net.http_post(
    url:='https://your-project.supabase.co/functions/v1/ottoq-scheduler',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body:='{"process_transitions": true}'::jsonb
  ) as request_id;
  $$
);
```

### Simulator Cron
```sql
SELECT cron.schedule(
  'ottoq-simulator-tick',
  '*/1 * * * *', -- every 45s (adjust as needed)
  $$
  SELECT net.http_post(
    url:='https://your-project.supabase.co/functions/v1/ottoq-simulator',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body:='{"action": "tick"}'::jsonb
  ) as request_id;
  $$
);
```

## 🧪 Testing

### Manual Tests
See `OTTOQ-TESTS.md` for comprehensive test scenarios

### Example Flow
1. Vehicle reports low SOC (18%) via telemetry
2. Auto-triggers CHARGE job
3. Scheduler finds available stall
4. Resource reserved (RESERVED)
5. Job scheduled with ETA
6. Vehicle arrives → Job goes ACTIVE
7. Resource marked BUSY
8. Job completes → Resource freed (AVAILABLE)

## 📈 Metrics & Monitoring

Query utilization:
```sql
SELECT 
  depot_id,
  COUNT(*) FILTER (WHERE status = 'BUSY') as busy_count,
  COUNT(*) FILTER (WHERE status = 'AVAILABLE') as available_count,
  ROUND(COUNT(*) FILTER (WHERE status = 'BUSY')::numeric / COUNT(*) * 100, 2) as utilization_pct
FROM ottoq_resources
GROUP BY depot_id;
```

Active jobs by type:
```sql
SELECT 
  job_type,
  state,
  COUNT(*) as count
FROM ottoq_jobs
WHERE state IN ('PENDING', 'SCHEDULED', 'ACTIVE')
GROUP BY job_type, state;
```

## 🎯 Dashboard Integration

### Depot Grid Display
```typescript
// Fetch depot resources
const response = await fetch(`/functions/v1/ottoq-depots-resources/${depotId}`);
const { resources, branding } = await response.json();

// Render 50-cell grid
resources
  .filter(r => r.type === 'CHARGE_STALL')
  .map(r => ({
    index: r.index,
    status: r.status,
    label: r.label // e.g., "Vehicle Nashville-00042 — Charging — 20m left"
  }));

// Show branding
console.log(branding); // "Powered by OTTO-Q Technology"
```

### Vehicle Card
```typescript
const response = await fetch(`/functions/v1/ottoq-vehicles-status/${vehicleId}`);
const { vehicle, assignment } = await response.json();

// Display: Current location, SOC, assigned stall/bay, ETA
```

### Realtime Updates
```typescript
const channel = supabase
  .channel(`depots:${depotId}`)
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public', 
    table: 'ottoq_resources',
    filter: `depot_id=eq.${depotId}`
  }, (payload) => {
    // Update grid cell
    updateResourceCell(payload.new);
  })
  .subscribe();
```

## 🚨 Troubleshooting

### No resources available
- Check depot resource count
- Verify utilization isn't at 100%
- Check for OUT_OF_SERVICE resources

### Jobs stuck in PENDING
- Manually trigger scheduler: `POST /ottoq-scheduler`
- Check for resource conflicts in logs
- Verify depot has correct resource types

### Double-booking
- Should never happen due to row-locking
- If occurs, check Postgres isolation level
- Review scheduler transaction logs

## 📚 API Reference

See inline JSDoc in each Edge Function for detailed parameters and response schemas.

## 🤝 Contributing

OTTO-Q is designed for easy OEM integration:
1. Replace mock telemetry with real vehicle data streams
2. Swap simulator with actual vehicle events
3. No schema changes required

## 📄 License

Proprietary - OTTO Fleet Technologies

---

**Built with** ⚡ Supabase Edge Functions | 🗄️ PostgreSQL | 🔄 Realtime Channels
