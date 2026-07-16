# Demo Scenarios

## Demo objective

Show a coherent, understandable story in approximately 90 seconds:

> An urgent perishable donation arrives, ChoiceGrid compares several plans, a human approves one, the route appears on a map, a disruption occurs, and the system creates an updated plan with calculated impact.

---

## Primary scenario: Strawberry Rescue

### Scenario ID

```text
SCN-STRAWBERRY-001
```

### Starting facts

- Donor: Market Street Grocery
- Offer: 1,200 lb strawberries
- Temperature: refrigerated
- Pickup deadline: 1:00 PM
- Modeled risk deadline: 36 hours after offer
- Main warehouse long-term refrigerated-storage headroom: 420 lb
- Separate short-dwell refrigerated staging available: 500 lb
- Vehicle 1 refrigerated capacity: 1,400 lb
- Two high-demand pantries can receive today
- One pantry has high need but limited cold capacity
- Community Kitchen has 500 lb compatible capacity and confirmed demand for up to 460 lb; the primary plan stages 400 lb
- 60 lb is reserved for supervisor inspection hold in long-term refrigerated storage and modeled as expected loss for impact calculations

All values are synthetic.

### Starting dashboard

Expected cards:

- Urgent offers: 1
- Pounds at high expiration risk: 1,200
- Refrigerated capacity used: seeded percentage
- Open missions: seeded background count

### Donation message

```text
Hi, Market Street Grocery has about 80 cases of strawberries available today, roughly 1,200 pounds. They need to be picked up before 1 PM and kept refrigerated. Please confirm quickly.
```

### Expected extraction

- Product: strawberries
- Quantity: 1,200 lb
- Pickup window end: 1:00 PM
- Refrigerated: yes
- Urgency: high
- Confidence: high for product, quantity, deadline, temperature
- Exact street address may be loaded from donor profile

---

## Primary plan options

### Option A — Warehouse First

- Receive 1,200 lb at warehouse
- Exceeds the 420 lb long-term refrigerated-storage headroom by 780 lb
- Seeded route template: 18.4 miles
- Lowest coordination complexity
- Highest modeled spoilage risk

This option is visibly infeasible and cannot be approved. The separate short-dwell staging pool does not make a `store` allocation feasible.

### Option B — Direct Distribution

- Send product directly to three partners
- Low warehouse utilization
- Higher route miles
- Seeded route template: 45.7 miles
- Strong immediate access
- Greater receiving-window sensitivity

### Option C — Mixed Plan

Recommended seeded result:

- 420 lb to Partner A
- 320 lb to Partner B
- 400 lb to meal-kit program through refrigerated staging
- 60 lb inspection hold

Totals:

```text
420 + 320 + 400 + 60 = 1,200 lb
```

Option C should be recommended because it balances urgency, cold capacity, demand, and operating feasibility.

Its seeded route template totals 24.8 miles.

---

## Presenter click path

### 0–15 seconds

1. Open `/dashboard`.
2. Point to urgent strawberry alert.
3. Say: “A grocery store has offered 1,200 pounds of strawberries, but pickup must happen within two hours.”
4. Open donation.

### 15–30 seconds

1. Show original donor message and structured extraction.
2. Point to refrigeration and deadline.
3. Select **Generate plans**.

### 30–50 seconds

1. Open decision room.
2. Compare the three options.
3. Point to warehouse cold-capacity warning.
4. Show map and destination fit.
5. Approve Mixed Plan.

### 50–65 seconds

1. Open packing plan or mission.
2. On `PKG-104`, start packing and complete Community Kitchen batch `BAT-003`; then show destination quantities and route.
3. State that all major operational actions remain human-approved.

### 65–80 seconds

1. Trigger **Eastside Community Pantry canceled**.
2. Show affected quantity.
3. Approve recovery option.
4. Show replacement packing plan `PKG-105` and the changed route.

### 80–90 seconds

1. Open impact.
2. State scenario outcomes.
3. Clarify that values are calculated from simulated data.

---

## Primary disruption: Partner cancellation

### Event

Partner B cancels after plan approval because receiving staff are unavailable.

### Expected system behavior

1. Mark Partner B and its affected route stop `canceled`.
2. Identify 320 affected pounds.
3. Preserve all completed or unaffected work.
4. Generate the deterministic replacement option.
5. Send 260 lb to Northside Family Resource Center and increase Community Kitchen staging from 400 lb to 460 lb. The original 60 lb inspection hold remains unchanged.
6. Recalculate route, miles, households, and spoilage risk.
7. Require human approval.
8. Create `PKG-105` with `BAT-101`-series IDs. Split the already-packed Community Kitchen 400 lb into a completed `-C` row and its additional 60 lb recovery delta into a pending `-R` row.
9. Mark original mission `MSN-104` `superseded`, assign replacement mission `MSN-105`, and record linked audit events.

### Success criteria

- No remaining allocation to canceled partner
- No capacity violation
- Community Kitchen remains within 500 lb compatible capacity, confirmed 460 lb demand, and 500 lb refrigerated staging capacity
- Total quantity still conserved
- New route visible
- Replanning timer displayed
- Original mission retained as `superseded`
- Original `PKG-104` retained read-only, replacement `PKG-105` active, and recovery packing quantities match the approved replacement
- Disruption, approval, recovery packing, and replacement mission events advance from `11:18:00` through `11:20:00` without backdated actions

---

## Disabled preview: Truck breakdown

### Event

Assigned refrigerated vehicle becomes unavailable before pickup.

### Conceptual options

- Reassign to another refrigerated vehicle
- Split load across compatible vehicles
- Ask partner for direct pickup, if seeded
- Reduce accepted quantity or redirect externally when no capacity exists

This control is disabled in the current MVP. These conceptual options must not be presented as an executable or tested fixture.

---

## Additional preview scenarios

These are shown only as disabled preview buttons:

### Cold-capacity loss

Warehouse loses 200 lb of available refrigerated capacity.

### Pickup deadline shortened

Pickup closes 45 minutes earlier than expected.

### Driver unavailable

Assigned driver cannot complete the mission.

---

## Target scenario metrics

The fixture should reproduce approximately:

| Metric | Target |
|---|---:|
| Pounds offered | 1,200 lb |
| Pounds assigned or distributed in time | 1,140 lb |
| Inspection hold or modeled loss | 60 lb |
| Estimated households supported | 380 |
| Modeled spoilage avoidance | 94% |
| Replanning time | 11 seconds |

These are simulated estimates. If formulas or assumptions change, update this file and tests together.

---

## Demo reset

Before presenting, verify the immutable fixture:

```bash
npm run demo:reset
```

Then use **Reset scenario** in the app to clear browser `localStorage` and return to `/dashboard`. The terminal command reports fixture readiness but cannot clear browser state.

Reset must restore:

- Donation `DON-104`
- Original partner statuses
- Original capacity
- No approved plan
- No disruption
- Baseline audit events only
- Primary dashboard alert

---

## Failure contingency

### LLM unavailable

Use seeded extraction and show a small “Demo fallback” notice. Continue normally.

### Map rendering problem

Use the synchronized location list and route summary. The MVP has no live tile dependency.

### Route calculation fails

Load precomputed route geometry and distances.

### Animation fails

Use static before-and-after route views.

### Presenter loses state

Use reset, then a “Jump to Decision Room” demo control if implemented.

---

## Statements to avoid during the pitch

- “The AI knows the food is safe.”
- “These are real households served.”
- “This is connected to Alameda County's live systems.”
- “No existing product does any of this.”
- “Our fairness score is objective.”

Preferred language:

- “The prototype estimates urgency and requests staff review.”
- “These scenario metrics are calculated from simulated data.”
- “The reviewed public products cover pieces of the workflow; ChoiceGrid demonstrates a closed operational loop.”
