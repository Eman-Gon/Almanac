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
7. The decision room displays three valid alternatives.
8. User inspects metrics, assumptions, exclusions, and map.
9. User approves one plan or edits quantities.
10. System validates quantities and capacities.
11. System creates a draft mission and packing plan.
12. User opens the mission map.
13. User reviews route stops and receiving windows.
14. User opens impact after the mission or simulated completion.

### Success state

- Donation status is `approved` or `in_execution`.
- Approved allocations conserve quantity.
- Mission and packing plan reference the same allocations.
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

- **Warehouse First:** receive all product at the warehouse.
- **Direct Distribution:** cross-dock or pick up and deliver directly to agencies.
- **Mixed Plan:** split product among direct delivery, warehouse packing, and inspection hold.

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

1. User changes a destination quantity.
2. System recalculates capacity, vehicle load, and conservation.
3. Invalid values show inline errors.
4. System suggests where unassigned quantity can move.
5. User enters an edit reason.
6. User approves the edited plan.
7. Audit event stores original and final quantities.

### Invalid examples

- Negative quantity
- Destination exceeds cold capacity
- Vehicle exceeds payload
- Delivery after risk deadline without warning and explicit override
- Total assigned exceeds accepted quantity

---

## Flow 5 — Partner cancellation

1. User opens an approved mission.
2. User triggers **Partner canceled**.
3. System marks the stop canceled.
4. Recovery Agent identifies affected quantity and windows.
5. Deterministic planner produces replacement options.
6. User reviews changes.
7. User approves the replacement.
8. Map, packing instructions, metrics, and audit history update.

### Success state

- No quantity remains assigned to the canceled partner.
- Replacement destinations stay within capacity.
- Route and impact metrics are recalculated.

---

## Flow 6 — Truck breakdown

1. User marks the assigned vehicle unavailable.
2. System checks other vehicles and loads.
3. If a feasible replacement exists, route is regenerated.
4. If no vehicle is feasible, system suggests quantity reduction, delayed movement, or partner pickup.
5. Human approval is required.

---

## Flow 7 — Low-confidence or failed AI call

1. AI request fails or output schema is invalid.
2. System shows a non-blocking status.
3. Deterministic seeded extraction or explanation is loaded.
4. User can continue the demo.
5. Agent run is logged as `fallback_used`.

The application must never become unusable because an external model is unavailable.

---

## Flow 8 — Partner profile inspection

From a map marker or plan row:

1. User opens partner profile.
2. Screen shows receiving window, storage, demand, product preferences, recent allocations, refusal notes, and service-gap indicator.
3. User returns to the decision room without losing plan state.

---

## Flow 9 — Demo reset

1. Presenter opens a hidden or clearly labeled demo-control menu.
2. Presenter selects **Reset scenario**.
3. Application restores original seed state.
4. All temporary approvals, disruptions, and audit events are cleared.
5. Dashboard opens at the starting alert.

Reset must be idempotent and available only in demo mode.
