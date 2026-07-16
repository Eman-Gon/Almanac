# User Flows

## Primary users

### Operations manager
Reviews urgent issues, compares plans, approves allocations, and monitors impact.

### Donation coordinator
Receives and structures donation offers, confirms missing information, and communicates with donors.

### Warehouse lead
Reviews cold capacity, packing, cross-dock, staging, and handling instructions.

### Dispatcher
Reviews vehicles, routes, receiving windows, and disruption recovery.

### Partner-agency coordinator
Maintains agency capacity, demand, receiving hours, and refusal notes.

The MVP may use one signed-in `demo_user` representing these roles while preserving role labels in the interface.

---

## Navigation model

```text
Dashboard
  ├── Donation Details
  │     └── Decision Room
  │           ├── Partner Profile
  │           ├── Demand Map
  │           └── Approve Plan
  │                 ├── Packing Plan
  │                 └── Mission Map
  │                       ├── Disruption Simulator
  │                       └── Impact and Audit
  └── Existing Mission
        └── Impact and Audit
```

---

## Flow 1 — Primary urgent-donation workflow

### Starting state

- The dashboard contains alert `DON-104`.
- The donor offers 1,200 lb of strawberries.
- Pickup deadline is two hours away.
- The warehouse is near refrigerated capacity.

### Steps

1. User opens the dashboard.
2. User selects the urgent-donation alert.
3. Donation details show original message and extracted fields.
4. User confirms or corrects missing fields.
5. User selects **Generate plans**.
6. Capacity, need, planning, and routing services run.
7. The decision room displays three complete alternatives; infeasible alternatives are visibly blocked.
8. User inspects metrics, assumptions, exclusions, and map.
9. User approves one plan or edits quantities.
10. System validates quantities and capacities.
11. System creates approved packing plan `PKG-104` and assigned mission `MSN-104`.
12. User opens the mission map.
13. User reviews route stops and receiving windows.
14. User opens impact after the mission or simulated completion.

### Success state

- Donation status is `approved` or `in_execution`.
- Approved allocations conserve quantity.
- Mission `MSN-104` and packing plan `PKG-104` reference the same allocations.
- An approval audit event exists.

---

## Flow 2 — Missing or uncertain donation information

1. User pastes donor message.
2. Intake Agent extracts known fields.
3. A required field such as exact pickup address is missing.
4. Screen shows `needs_confirmation` instead of inventing a value.
5. User enters the missing value or chooses seeded fallback data.
6. Plan generation becomes available.

### Required behavior

- Do not silently fill required operational fields.
- Preserve confidence per extracted field.
- Keep original text visible.

---

## Flow 3 — Compare plan options

Each option must be complete enough to execute.

### Example options

- **Warehouse First:** receive all product at the warehouse; seeded route template 18.4 miles.
- **Direct Distribution:** cross-dock or pick up and deliver directly to agencies; seeded route template 45.7 miles.
- **Mixed Plan:** split product among direct delivery, warehouse packing, and inspection hold; seeded route template 24.8 miles.

### User actions

- Compare pounds delivered in time
- Compare miles and labor
- Compare cold-capacity use
- Compare need match and equity indicators
- Inspect excluded agencies
- Open partner profile
- Adjust score weights in an advanced drawer if implemented
- Approve or edit an option

---

## Flow 4 — Edit allocation before approval

1. User changes a destination quantity; plan and allocation identities cannot be edited.
2. System rebuilds the option from its canonical rows, recalculates distributed pounds, households, storage and staging utilization, and validates conservation, partner, vehicle, temperature, and windows.
3. Invalid values show inline errors.
4. System suggests where unassigned quantity can move.
5. User enters an edit reason.
6. User approves the edited plan.
7. Audit event stores original and final quantities.

Expected spoilage, staff minutes, need-match, equity, refusal risk, and route miles remain labeled seeded strategy estimates; they are not presented as dynamically recalculated from quantity edits.

### Invalid examples

- Negative quantity
- Destination exceeds cold capacity
- Vehicle exceeds payload
- Delivery after risk deadline without warning and explicit override
- Total assigned exceeds accepted quantity

---

## Flow 5 — Packing-batch completion

1. User opens `PKG-104` after plan approval or `PKG-105` after recovery approval.
2. User starts packing.
3. Every primary batch begins `pending`; a recovery plan may begin `in_progress` when it contains preserved completed work.
4. User marks individual batches `complete` or reopens them.
5. Batch and plan progress persist across navigation in the same browser.

### Required behavior

- Completion controls never change approved quantities.
- The packing plan becomes `complete` only when all batches are complete.
- A supported packing route opened before its prerequisite approval shows an intentional not-created state rather than synthetic executable instructions.
- `PKG-105` uses `BAT-101`-series IDs. If a completed destination/staging batch grows during recovery, it splits into an already-packed `-C` batch and a pending recovery-only `-R` delta.
- After recovery, `PKG-104` remains visible as read-only history and only active `PKG-105` can change.

## Flow 5A — Mission-stop completion

1. User opens the active mission.
2. Only the first pending route stop is enabled for completion.
3. Pickup and delivery event types must match the stop's action.
4. Completing the final non-canceled stop marks the mission `delivered`.

Out-of-order completion is rejected and creates no audit event.

---

## Flow 6 — Partner cancellation

1. User opens an approved mission.
2. User triggers the named **Eastside Community Pantry canceled** fixture.
3. System marks Partner B and its affected route stop `canceled`.
4. Recovery Agent identifies affected quantity and windows.
5. Deterministic planner sends 260 lb to Northside Family Resource Center and increases Community Kitchen staging from 400 lb to 460 lb.
6. User reviews changes.
7. User approves the replacement.
8. System creates replacement packing plan `PKG-105` with non-colliding batch IDs. Already-packed quantity is retained; any added recovery-only quantity is a separate pending batch.
9. The original mission becomes `superseded`, replacement mission `MSN-105` becomes assigned, and the route, metrics, and audit history update.

### Success state

- No quantity remains assigned to the canceled partner.
- Replacement destinations stay within capacity.
- Route and impact metrics are recalculated.
- `PKG-104` remains read-only history, `PKG-105` is active, and recovery packing quantities match the approved replacement.
- The Missions navigation and `/missions` redirect resolve to `MSN-105` after recovery.
- Audit history links the superseded and replacement missions.

---

## Flow 7 — Additional disruption previews

Truck breakdown, cold-capacity loss, driver unavailability, and a shortened pickup deadline appear as disabled preview controls. They are not executable fixtures and must not be presented as implemented recovery paths.

---

## Flow 8 — Low-confidence or failed AI call

1. AI request fails or output schema is invalid.
2. System shows a non-blocking status.
3. Deterministic seeded extraction or explanation is loaded.
4. User can continue the demo.
5. Agent run is logged as `fallback_used`.

The application must never become unusable because an external model is unavailable.

---

## Flow 9 — Partner profile inspection

From a map marker or plan row:

1. User opens partner profile.
2. Screen shows receiving window, storage, demand, product preferences, recent allocations, refusal notes, and service-gap indicator.
3. User returns to the decision room without losing plan state.

---

## Flow 10 — Demo reset

1. Presenter opens a hidden or clearly labeled demo-control menu.
2. Presenter selects **Reset scenario**.
3. Application restores original seed state.
4. All temporary approvals, disruptions, and audit events are cleared.
5. Dashboard opens at the starting alert.

Reset must be idempotent and available only in demo mode. The in-app action clears the browser's versioned `localStorage`; `npm run demo:reset` can verify immutable fixture readiness but cannot clear browser state.
