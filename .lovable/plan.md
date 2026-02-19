

# Strengthen OttoCommand as a Dual-Mode Agentic Assistant

## Problem Summary

OttoCommand currently serves as a single-mode AI assistant primarily focused on **AV fleet operations**. It has no awareness of the **OrchestraEV subscriber context** (vehicle details, amenity bookings, service scheduling, depot queue status). The same generic quick actions and system prompt are used regardless of which interface the user is on. Additionally, the edge function uses an older Claude model and lacks EV-specific tools.

## What Changes

### 1. Detect AV vs EV Mode and Pass Context Accordingly

**Files:** `src/pages/OrchestraEV.tsx`, `src/pages/Index.tsx`, `src/components/AIAgentPopup.tsx`

- Add a new `mode` prop to `AIAgentPopup`: `"av"` (default) or `"ev"`
- When opened from OrchestraEV, pass `mode="ev"` along with the subscriber/vehicle/amenity mock data as a new `evContext` prop
- When opened from Index (AV page), pass `mode="av"` with existing fleet context (no changes)
- The `AIAgentPopup` sends `mode` and `evContext` to the edge function alongside the existing `fleetContext`

### 2. EV-Specific Quick Actions

**File:** `src/components/OttoCommand/QuickActions.tsx`

- Add a new `evQuickActions` array with EV-relevant actions:
  - "Vehicle Status" -- SOC, health, current stall, charging ETA
  - "Book Amenity" -- reserve sim golf, cowork table, privacy pod
  - "Schedule Service" -- detailing, tire rotation, maintenance
  - "Depot Queue" -- current stall position, wait times, service stages
  - "Tow Request" -- request OTTOW pickup from home
  - "Billing Summary" -- recent charges, membership tier info
- `QuickActionsGrid` accepts a `mode` prop and renders the appropriate action set

### 3. New EV Tools in the Edge Function

**File:** `supabase/functions/ottocommand-ai-chat/function-executor.ts`

Add 5 new tool execution functions that operate on the EV context passed from the client:

| Tool | Purpose | Data Source |
|------|---------|-------------|
| `ev_vehicle_status` | Return subscriber's vehicle SOC, health, stall, charging ETA, range | `evContext.vehicle` |
| `ev_book_amenity` | Reserve sim golf / cowork / privacy pod at a time slot | `evContext.amenityAvailability` |
| `ev_schedule_service` | Schedule detailing, tire rotation, maintenance at a depot | `evContext.serviceRecords` + mock availability |
| `ev_depot_queue_status` | Show current depot stages, wait times, stall assignment | `evContext.depotStages` |
| `ev_account_summary` | Membership tier, billing, upcoming reservations | `evContext.subscriber` + `evContext.amenityReservations` |

These tools use the mock data passed from the client (same data that powers the UI today). This keeps the implementation self-contained without requiring new DB tables.

### 4. EV System Prompt in the Edge Function

**File:** `supabase/functions/ottocommand-ai-chat/index.ts`

- When `mode === "ev"`, use a dedicated EV system prompt that:
  - Identifies the agent as "OttoCommand for OrchestraEV" -- a personal EV concierge
  - Knows the subscriber by name, membership tier, vehicle details
  - Can schedule services, book amenities, check depot queue status
  - Provides proactive recommendations (e.g., "Your brake wear is at 72%, consider scheduling inspection")
  - Answers general EV knowledge questions (charging best practices, battery care, etc.)
- Register the 5 EV tools as Claude tool definitions alongside the existing AV tools (so the model can choose)
- When `mode === "av"`, use the existing enhanced AV system prompt (no changes)

### 5. Upgrade Claude Model

**File:** `supabase/functions/ottocommand-ai-chat/index.ts`

- Update `claudeModel` from `claude-3-5-sonnet-20241022` to `claude-sonnet-4-20250514` for stronger agentic tool-use and reasoning

### 6. Multi-Turn Tool Loops (Agentic Behavior)

**File:** `supabase/functions/ottocommand-ai-chat/index.ts`

Currently the edge function does at most one tool-use round-trip (call Claude, execute tools, call Claude again with results). For true agentic behavior:

- Implement a loop (max 3 iterations) that continues calling Claude as long as the response contains `tool_use` blocks
- This allows chained actions like: "Book me a sim golf slot and schedule a detailing for tomorrow" -- the agent calls `ev_book_amenity`, then `ev_schedule_service`, then summarizes both results

### 7. End-to-End Testing

After building, test the following scenarios in the browser:

**EV Mode (on /orchestra-ev):**
- "What's my vehicle status?" -- should return SOC, health, stall info from mock data
- "Book a sim golf session for this afternoon" -- should return confirmation
- "Schedule a detailing for next week" -- should create a service booking
- "What amenities are available right now?" -- should list availability
- "What's my membership tier?" -- should return subscriber info

**AV Mode (on / index page):**
- "Fleet status" -- should return real OTTOQ vehicle data
- "Which vehicles need charging?" -- should use predictive tool
- "Dispatch OTTOW to Nashville" -- existing flow, verify still works

---

## Technical Details

### AIAgentPopup Props Update

```typescript
interface AIAgentPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "av" | "ev";           // NEW
  evContext?: {                   // NEW
    subscriber: Subscriber;
    vehicle: SubscriberVehicle;
    serviceRecords: ServiceRecord[];
    amenityAvailability: AmenityAvailability;
    amenityReservations: AmenityReservation[];
    depotStages: DepotServiceStages;
  };
  currentCity?: { name: string; coordinates: [number, number]; country: string };
  vehicles?: any[];
  depots?: any[];
}
```

### Edge Function Payload Addition

```typescript
// Added to request body
{
  mode: "ev" | "av",
  evContext: { subscriber, vehicle, serviceRecords, amenityAvailability, amenityReservations, depotStages } | null
}
```

### Tool Loop Pattern

```typescript
let messages = [...initialMessages];
for (let i = 0; i < 3; i++) {
  const response = await callClaude(messages);
  const toolUseBlocks = response.content.filter(b => b.type === "tool_use");
  if (toolUseBlocks.length === 0) break; // done
  const toolResults = await executeAll(toolUseBlocks);
  messages.push({ role: "assistant", content: response.content });
  messages.push({ role: "user", content: toolResults });
}
```

## Files Modified

1. `src/components/AIAgentPopup.tsx` -- add mode/evContext props, pass to edge function
2. `src/components/OttoCommand/QuickActions.tsx` -- add EV quick actions, mode-aware rendering
3. `src/pages/OrchestraEV.tsx` -- pass mode="ev" and EV context to AIAgentPopup
4. `src/pages/Index.tsx` -- pass mode="av" explicitly (optional, already default)
5. `supabase/functions/ottocommand-ai-chat/index.ts` -- EV system prompt, EV tool definitions, model upgrade, multi-turn loop
6. `supabase/functions/ottocommand-ai-chat/function-executor.ts` -- 5 new EV tool functions

## New Tools Needed

No external tools or API keys are needed. The existing `ANTHROPIC_API_KEY` secret is already configured. The EV tools operate on client-provided mock data, keeping everything in a closed loop. For future production use, these tools would be backed by real Supabase tables, but the architecture is ready for that swap.

