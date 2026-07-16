# API and State Contracts

## API style

The proposed implementation uses Next.js route handlers or server actions. The contracts below are stable regardless of transport.

All API responses use a consistent envelope:

```ts
interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  meta?: {
    requestId: string;
    generatedAt: string;
    demoMode: boolean;
  };
}

interface ApiError {
  code: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
  retryable: boolean;
}
```

---

## Donation endpoints

### `GET /api/donations`

Returns donation summaries, optionally filtered by status.

```text
Query: status, urgency, donorId
```

### `POST /api/donations`

Create a structured donation draft.

### `POST /api/donations/parse`

Input:

```json
{
  "sourceText": "We have 80 cases of strawberries...",
  "donorId": "DNR-001"
}
```

Output: validated `IntakeOutput` plus created or updated `DonationOffer`.

### `GET /api/donations/:id`

Returns full donation, extraction fields, related agent runs, and audit events.

### `PATCH /api/donations/:id`

Allows confirmed field edits. Requires an edit reason for fields originally populated by an agent when the value changes materially.

---

## Planning endpoints

### `POST /api/plans/generate`

Input:

```json
{
  "donationId": "DON-104",
  "scoreConfigVersion": "score-v1"
}
```

Output: `PlanSet` with three options or an explicit infeasibility response.

### `GET /api/plans/:id`

Returns plan set, options, score details, and map references.

### `PATCH /api/plans/:planSetId/options/:optionId`

Allows quantity edits before approval.

Input:

```json
{
  "allocations": [
    {"allocationId": "ALL-001", "quantityLb": 520}
  ],
  "reason": "Adjusted for updated pantry capacity"
}
```

The server recalculates all metrics and validates conservation.

### `POST /api/plans/:planSetId/approve`

Input:

```json
{
  "optionId": "OPT-003",
  "approverId": "demo_user",
  "reason": "Best balance of urgency and cold capacity"
}
```

Output:

- Approved plan option
- Packing plan
- Draft mission
- Audit event

Approval must be idempotent.

---

## Partner and map endpoints

### `GET /api/partners`

Filters:

- product category
- status
- minimum capacity
- receiving time
- usability tag

### `GET /api/partners/:id`

Returns profile, demand, capacity, windows, service gap, and notes.

### `GET /api/map/network`

Returns normalized locations, statuses, and optional route layers.

### `GET /api/map/routes/:missionId`

Returns route legs and polylines.

---

## Packing endpoints

### `GET /api/packing/:id`

Returns batches derived from the approved plan.

### `POST /api/packing/:id/start`

Moves status from `ready` to `in_progress` and records audit event.

### `POST /api/packing/:id/complete`

Marks batches complete without changing allocation quantities.

---

## Mission endpoints

### `GET /api/missions/:id`

Returns mission, stops, route, event timeline, and current disruptions.

### `POST /api/missions/:id/events`

Examples:

```json
{"type": "pickup_complete", "stopId": "STP-001"}
```

```json
{"type": "delivery_complete", "stopId": "STP-003"}
```

### `POST /api/missions/:id/disruptions`

Input:

```json
{
  "type": "partner_canceled",
  "affectedEntityId": "PAR-003",
  "details": {"reason": "Receiving staff unavailable"}
}
```

Output: disruption record and replacement plan options.

### `POST /api/disruptions/:id/approve-recovery`

Approves a replacement plan and creates a superseding mission.

---

## Impact endpoints

### `GET /api/impact/:missionId`

Returns calculated metrics, baseline assumptions, and audit history.

The server—not the client—should be the canonical source of impact calculations.

---

## Demo endpoints

### `POST /api/demo/reset`

- Available only when demo mode is enabled
- Restores fixture state
- Returns starting donation and dashboard summary
- Idempotent

### `POST /api/demo/advance`

Optional helper for presentation mode. It must call the same domain services as manual actions rather than replacing them with hard-coded UI state.

---

## Client state

Suggested state slices:

```ts
interface AppState {
  demo: DemoState;
  donations: DonationState;
  plans: PlanState;
  map: MapState;
  missions: MissionState;
  ui: UiState;
}
```

### Demo state

```ts
interface DemoState {
  enabled: boolean;
  scenarioId: string;
  lastResetAt?: string;
}
```

### Plan state

```ts
interface PlanState {
  activePlanSetId?: string;
  selectedOptionId?: string;
  editedAllocations: Record<string, number>;
  isGenerating: boolean;
  validationErrors: string[];
}
```

### Map state

```ts
interface MapState {
  selectedLocationId?: string;
  selectedMissionId?: string;
  visibleLayers: {
    demand: boolean;
    capacity: boolean;
    routes: boolean;
    vehicles: boolean;
  };
}
```

---

## Status transitions

### Donation

```text
draft
→ needs_confirmation
→ ready_for_planning
→ plans_generated
→ awaiting_approval
→ approved / partially_accepted / declined / redirected
→ in_execution
→ closed
```

### Mission

```text
draft
→ approved
→ assigned
→ in_transit
→ delivered
→ closed
```

Disruption branch:

```text
assigned / in_transit
→ disrupted
→ replanning
→ superseded by replacement mission
```

Invalid transitions must return `409 CONFLICT` or equivalent domain error.

---

## Error codes

| Code | Meaning |
|---|---|
| `VALIDATION_ERROR` | Input or output schema failed |
| `MISSING_REQUIRED_DATA` | Planning cannot proceed |
| `QUANTITY_MISMATCH` | Conservation failed |
| `CAPACITY_EXCEEDED` | Warehouse, partner, or vehicle capacity exceeded |
| `WINDOW_INFEASIBLE` | Pickup or receiving time cannot be met |
| `TEMPERATURE_INCOMPATIBLE` | Product and storage/vehicle mismatch |
| `PLAN_NOT_APPROVABLE` | Plan contains unresolved blocking warnings |
| `INVALID_STATE_TRANSITION` | Entity state does not permit action |
| `AGENT_UNAVAILABLE` | LLM call failed; fallback may be used |
| `DEMO_MODE_REQUIRED` | Demo-only endpoint used outside demo mode |

---

## Concurrency and idempotency

- Plan approval must use an idempotency key or current-version check.
- Quantity edits should include the plan version.
- A second disruption cannot silently overwrite an unresolved first disruption.
- Reset is idempotent.
- Completed mission stops are immutable except through a documented correction flow, which is out of MVP scope.
