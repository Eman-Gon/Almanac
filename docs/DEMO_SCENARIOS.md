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
- Main warehouse refrigerated capacity available: 420 lb
- Vehicle 1 refrigerated capacity: 1,400 lb
- Two high-demand pantries can receive today
- One pantry has high need but limited cold capacity
- One meal-kit program can use 400 lb tomorrow
- 60 lb is reserved for inspection hold or expected handling loss

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
- Exceeds currently available refrigerated capacity unless overflow or immediate outbound movement is arranged
- Lowest coordination complexity
- Highest modeled spoilage risk

This option may be marked warning or partially infeasible.

### Option B — Direct Distribution

- Send product directly to three partners
- Low warehouse utilization
- Higher route miles
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
2. Show destination quantities and route.
3. State that all major operational actions remain human-approved.

### 65–80 seconds

1. Trigger **Pantry canceled**.
2. Show affected quantity.
3. Approve recovery option.
4. Show changed route.

### 80–90 seconds

1. Open impact.
2. State scenario outcomes.
3. Clarify that values are calculated from simulated data.

---

## Primary disruption: Pantry cancellation

### Event

Partner B cancels after plan approval because receiving staff are unavailable.

### Expected system behavior

1. Mark Partner B unavailable.
2. Identify 320 affected pounds.
3. Preserve all completed or unaffected work.
4. Generate replacement options.
5. Recommend distributing 260 lb to an alternate partner and adding 60 lb to meal-kit staging or inspection hold, depending on seeded capacity.
6. Recalculate route, miles, households, and spoilage risk.
7. Require human approval.
8. Record audit events.

### Success criteria

- No remaining allocation to canceled partner
- No capacity violation
- Total quantity still conserved
- New route visible
- Replanning timer displayed

---

## Backup disruption: Truck breakdown

### Event

Assigned refrigerated vehicle becomes unavailable before pickup.

### Expected options

- Reassign to another refrigerated vehicle
- Split load across compatible vehicles
- Ask partner for direct pickup, if seeded
- Reduce accepted quantity or redirect externally when no capacity exists

The first option should be deterministic and feasible in demo mode.

---

## Additional preview scenarios

These may be shown as disabled or preview buttons unless fully implemented:

### Freezer or cold-capacity loss

Warehouse loses 200 lb of available refrigerated capacity.

### Donation quantity doubled

Donor confirms actual quantity is 2,400 lb.

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

Before presenting:

```bash
npm run demo:reset
```

Or use the in-app reset control.

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

### Map tiles unavailable

Render markers and route on a bundled fallback background or show synchronized location list with route summary.

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
