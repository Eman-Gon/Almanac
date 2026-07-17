# API and State Contracts

## API style

The implemented MVP uses Next.js route handlers plus a versioned browser demo-state store. The endpoint list below describes routes that exist in the repository; future production endpoints are out of scope.

All API responses use a consistent envelope:

```ts
interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  meta: {
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

## Inventory endpoints

### `GET /api/inventory/:id`

Returns the existing warehouse `ProductLot`, its risk facts, current location, required confirmations, related agent runs, and audit events. The hero ID is `LOT-104`; it is already at `WH-001` and has no donor-pickup dependency.

### `PATCH /api/inventory/:id` (browser-state equivalent in the local MVP)

Only staff-confirmable operational fields may change: available quantity, risk deadline, temperature class, condition status, and notes. The action records an audit event. It must not let a model certify safety.

The legacy extraction route may remain for an isolated upstream experiment:

### `POST /api/donations/parse` (non-hero compatibility route)

```json
{
  "sourceText": "We have 80 cases of strawberries...",
  "donorId": "DNR-001"
}
```

This route is not called by the judged workflow and may not create the hero inventory lot or add a donor pickup to its route. Any model output remains schema-validated and non-authoritative.

### `GET /api/donations/:id` (non-hero compatibility route)

Returns full donation, extraction fields, related agent runs, and audit events.

---

## Planning endpoints

### `POST /api/plans/generate`

Input:

```json
{
  "inventoryLotId": "LOT-104",
  "scoreConfigVersion": "score-v1"
}
```

Output: a `PlanSet` with three complete options. An infeasible option remains in the comparison with blocking risks and cannot be approved.

### `GET /api/plans/:id`

Returns the seeded plan set and its three calculated options.

Quantity edits are implemented in the versioned local demo store rather than a separate HTTP endpoint. Only `Allocation.quantityLb` may change. The browser rebuilds the option from its canonical seeded identity and allocation rows, persists the edited quantities and reason, and writes an audit event before approval.

### `POST /api/plans/:planSetId/approve`

Input:

```json
{
  "optionId": "OPT-003",
  "option": "optional current edited PlanOption",
  "approverId": "demo_user",
  "reason": "Best balance of urgency and cold capacity"
}
```

When `option` is supplied, it must match `optionId` and belong to the route's plan set. Allocation IDs, destinations, types, product lots, handling, arrival times, strategy, inspection hold, and unallocated quantity must match the canonical option; only row quantities are accepted. The handler rebuilds authoritative fields, recalculates planned outbound pounds, modeled household-equivalents, long-term storage use, and staging use, then reruns conservation, partner, vehicle, temperature, and window validation.

Submitted metrics are not authoritative. Planned outbound pounds, modeled household-equivalents, storage, and staging are recalculated from approved quantities. Expected spoilage, staff minutes, need-match, equity, refusal risk, and route miles remain labeled seeded strategy-level scenario estimates because no quantity-sensitive formula is implemented for them. Hold for Later is blocked and has 0 outbound miles; the seeded executable route templates total 45.7 miles for Fastest Agency Release and 24.8 miles for Balanced Release.

Output:

- Approved plan option
- Packing plan
- Assigned mission
- Audit event

The browser demo-state approval action also records draft, approval, and assignment lifecycle events and is idempotent for an already approved state.

---

## Partner and map endpoints

### `GET /api/partners`

Returns the complete synthetic partner list. Query filters are not implemented in the MVP.

### `GET /api/partners/:id`

Returns profile, demand, capacity, windows, service gap, category-specific acceptance history, refusal and short-receipt counts, sample sizes, and notes.

### `GET /api/map/network`

Returns the synthetic warehouse origin, partners, vehicle context, and precomputed outbound route. The hero response contains no donor marker or pickup stop. It is always labeled `projection: "seed_preview_not_persisted"`; this route does not read the browser's evolving approval or recovery state.

---

## Packing endpoints

### `GET /api/packing/:id`

Supports `PKG-104` and recovery plan `PKG-105` only as explicit seed previews:

```text
GET /api/packing/PKG-104?preview=true
GET /api/packing/PKG-105?preview=true
```

Without `preview=true`, the endpoint returns `409 STATE_REQUIRED` because an HTTP GET cannot read the browser's approved state. A preview response is labeled `projection: "seed_preview_not_persisted"`; it is not proof that approval or recovery occurred. The browser workflow creates and persists `PKG-104` after plan approval and `PKG-105` after recovery approval.

### `POST /api/packing/:id/start`

The HTTP action accepts `PKG-104` or `PKG-105`. It requires the current, already-created `PackingPlan` in the request body, verifies that its ID matches the route, and starts only a `ready` plan. Any other status returns `409 INVALID_STATE_TRANSITION`. The endpoint never synthesizes a missing resource.

```json
{
  "packingPlan": {"id": "PKG-104", "status": "ready", "batches": []}
}
```

The abbreviated object above shows the required resource shape conceptually; callers must submit the complete schema-valid packing plan. The browser UI performs the same transition against the validated plan stored in `DemoState`.

### `POST /api/packing/:id/complete`

Updates one batch without changing allocation quantities.

```json
{
  "batchId": "BAT-001",
  "complete": true,
  "packingPlan": "full current PackingPlan resource"
}
```

The HTTP action accepts `PKG-104` or `PKG-105` and requires the current schema-valid packing plan. The route ID must match the plan, `batchId` must exist, and packing must already be `in_progress` or `complete`; a `ready` plan returns `409 INVALID_STATE_TRANSITION`. `complete: false` reopens the batch. Repeating the current batch state returns `changed: false` without an audit event. The plan becomes `complete` only when every batch is complete.

---

## Mission endpoints

### `GET /api/missions/:id`

`MSN-104` and `MSN-105` are available only as explicit non-persisted seed projections through `?preview=true`. Without that flag, the endpoint returns `409 STATE_REQUIRED`; a mission must be created by plan or recovery approval. Preview responses carry `projection: "seed_preview_not_persisted"`. The browser demo state owns the real evolving mission, timeline, completion, and disruption state. The route begins at `WH-001`, contains no donor pickup, and uses the approved executable strategy total: 45.7 miles for Fastest Agency Release or 24.8 miles for Balanced Release.

### `POST /api/missions/:id/events`

Examples:

```json
{"type": "warehouse_load_complete", "stopId": "STP-001", "mission": "current Mission resource"}
```

```json
{"type": "delivery_complete", "stopId": "STP-003", "mission": "current Mission resource"}
```

The action requires the full current mission resource, a matching route ID, an existing stop, and mission status `assigned` or `in_transit`. Only the first pending stop may complete; out-of-order requests return `409 INVALID_STATE_TRANSITION`. `warehouse_load_complete` must target the warehouse origin and `delivery_complete` a partner drop-off.

### `POST /api/missions/:id/disruptions`

Input:

```json
{
  "type": "partner_canceled",
  "affectedEntityId": "PAR-002",
  "details": {"reason": "Receiving staff unavailable"},
  "approvedPlan": "current approved PlanOption resource",
  "mission": "current assigned or in-transit Mission resource"
}
```

The action validates the current approved plan, matching mission, eligible non-complete stop, and all plan constraints. Output contains the disruption, Partner B with `canceled` status, the original mission in `replanning` with its affected stop `canceled`, and the validated replacement option.

### `POST /api/disruptions/:id/approve-recovery`

Requires the current approved original plan, original packing plan `PKG-104`, original mission already in `replanning`, and matching recorded disruption with its affected quantity. The plan, packing plan, and mission must link to the same approved option; the affected mission stop must already be `canceled`. On success it approves the replacement plan, marks the original mission `superseded`, and creates `MSN-105` plus `PKG-105`.

Recovery batch IDs start at `BAT-101`, avoiding collisions with `PKG-104`'s `BAT-001` series. Completed work is matched by destination and staging location. When recovery increases a completed quantity, `PKG-105` splits it into an already-packed `-C` batch and a pending recovery-only `-R` delta; for example, 400 lb already packed for Community Kitchen plus a new 60 lb recovery delta. In browser state, `PKG-104` becomes read-only history after recovery.

```json
{
  "originalPlan": "current approved PlanOption resource",
  "originalPackingPlan": "current PKG-104 resource",
  "originalMission": "current MSN-104 resource in replanning with the affected stop canceled",
  "disruption": {
    "id": "DSP-001",
    "missionId": "MSN-104",
    "partnerId": "PAR-002",
    "affectedQuantityLb": 320
  }
}
```

---

## Impact endpoints

### `GET /api/impact/:missionId`

Returns calculated seed-preview metrics for supported mission `MSN-104` or `MSN-105` only when `preview=true`. Without that flag it returns `409 STATE_REQUIRED`; impact requires an approved mission. Preview responses are labeled `projection: "seed_preview_not_persisted"`. The browser impact screen instead composes the current approved plan, mission, and evolving audit history from validated local demo state.

The shared deterministic domain calculations—not rendered UI components or an LLM—are the canonical source of impact values. The browser and route projection both compose those calculations from their respective validated inputs.

---

## Communication endpoints (isolated experiment, not hero scope)

### `POST /api/communications/test`

These routes may remain for development evaluation but are excluded from primary navigation, seed-state transitions, and the judged workflow. They never schedule a donor, partner, vehicle, or driver. A test request still requires an E.164 test number, an approved message, and `confirmed: true`.

Voice requests use the configured Vapi assistant and phone number, enable Vapi voicemail detection, and provide the approved `voicemailMessage`. SMS requests use Vapi's outbound SMS transport with the exact approved message.

Live requests are intentionally gated by all of the following server-only environment variables:

- `VAPI_API_KEY`
- `VAPI_ASSISTANT_ID`
- `VAPI_PHONE_NUMBER_ID`
- `VAPI_TEST_TO_NUMBER`
- `VAPI_TEST_CALLS_ENABLED=true`

When the live gate is not complete, the endpoint returns a labeled `preview` result and makes no external request. When enabled, only the exact configured test number is accepted. The endpoint never changes inventory, plan, mission, partner, or food-safety state.

### `GET /api/communications/status/:id`

Returns the current Vapi status for a live voice test request. It returns a preview status without contacting Vapi while live test calls are disabled. The browser may poll this endpoint after a live request; no call status is persisted in the browser's operational demo state.

---

## Demo endpoints

### `POST /api/demo/reset`

- Returns the starting scenario, inventory lot, and dashboard summary.
- Is idempotent.
- Does not mutate a browser's local state. The in-app reset control clears the versioned browser demo state; `npm run demo:reset` reports immutable seed readiness from the terminal.

---

## Client state

The implemented state is one Zod-validated `DemoState` persisted under the versioned browser key `choicegrid-demo-v2`:

```ts
interface DemoState {
  version: 2;
  stage: "initial" | "plans_generated" | "approved" | "disrupted" | "recovered";
  selectedPlanId: string;
  planOverrides: Record<string, PlanOption>;
  allocationEditReason: string;
  approvedPlan: PlanOption | null;
  approvalReason: string;
  packingPlans: Record<string, PackingPlan>;
  activePackingPlanId: string | null;
  missions: Record<string, Mission>;
  partnerStatusOverrides: Record<string, "available" | "limited" | "unavailable" | "canceled">;
  disruption: DemoDisruption | null;
  auditEvents: AuditEvent[];
  fallbackUsed: boolean;
  resetCount: number;
}
```

The seeded hero resource is `LOT-104`; all plan, mission, impact, and audit relationships use `inventoryLotId`. `fallbackUsed` is retained only for optional explanation/model fallbacks and is not an intake prerequisite.

The provider validates persisted state before rendering the application shell; until hydration finishes it shows one loading state, so actions cannot mutate the seed state before browser storage is read. Edited allocations, both packing plans, mission progress, disruption, supersession, and audit history then survive navigation and reload until reset. Recovery activates `PKG-105`, keeps `PKG-104` read-only, and makes `/missions`, sidebar, dashboard, and map mission links resolve to active replacement `MSN-105`. Server routes remain stateless transition functions and seed projections; callers must pass current prerequisite resources explicitly.

### Seeded recovery chronology

- Disruption creation: `2026-07-15T11:18:00-07:00`
- Replanning event: `2026-07-15T11:18:01-07:00`
- Recovery approval and replacement creation: `2026-07-15T11:18:11-07:00`
- `PKG-105` start and batch actions: `11:19:00` and `11:19:30`
- `MSN-105` stop completion: `11:20:00`

---

## Status transitions

### Inventory lot

```text
available
→ partially_allocated / allocated / inspection_hold
→ distributed / disposed
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
→ superseded
```

The human-approved replacement mission then follows `draft → approved → assigned`. The audit record stores `replacementMissionId` on the original mission event and `supersedesMissionId` on the replacement event.

Invalid transitions must return `409 CONFLICT` or equivalent domain error.

---

## Error codes

| Code | Meaning |
|---|---|
| `VALIDATION_ERROR` | Input or output schema failed |
| `MISSING_REQUIRED_DATA` | Planning cannot proceed |
| `QUANTITY_MISMATCH` | Conservation failed |
| `CAPACITY_EXCEEDED` | Warehouse, partner, or vehicle capacity exceeded |
| `WINDOW_INFEASIBLE` | Warehouse departure, risk deadline, or agency receiving window cannot be met |
| `TEMPERATURE_INCOMPATIBLE` | Product and storage/vehicle mismatch |
| `PLAN_NOT_APPROVABLE` | Plan contains unresolved blocking warnings |
| `STATE_REQUIRED` | Stateful resource must be created by approval; GET preview requires `preview=true` |
| `INVALID_STATE_TRANSITION` | Entity state does not permit action |
| `AGENT_UNAVAILABLE` | LLM call failed; fallback may be used |
| `DEMO_MODE_REQUIRED` | Demo-only endpoint used outside demo mode |

---

## Concurrency and idempotency

- Demo approval and recovery actions return the current state when already complete.
- Persisted state has an explicit version and fails closed to the seed state when validation fails.
- A second disruption cannot silently overwrite an unresolved first disruption.
- Reset is idempotent.
- Completed mission stops are immutable except through a documented correction flow, which is out of MVP scope.
