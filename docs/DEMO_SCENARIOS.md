# Demo Scenarios

## Demo objective

Show one coherent 90-second story:

> A perishable lot is already sitting in the food-bank warehouse. ChoiceGrid combines current constraints with agency acceptance history, compares outbound plans, requires human approval, creates warehouse-origin instructions, and recovers when an agency cancels.

---

## Primary scenario: Strawberry Rescue

**Scenario ID:** `SCN-STRAWBERRY-001`

### Starting facts

- `LOT-104`: 1,200 lb strawberries already received at `WH-001`
- Temperature: refrigerated
- Condition: staff-cleared for planning, with 60 lb reserved for supervisor inspection hold
- Modeled risk deadline: 36 hours after the seeded inventory alert
- Long-term refrigerated-storage headroom: 420 lb
- Separate short-dwell refrigerated staging: 500 lb
- Seeded refrigerated vehicle payload: 1,400 lb; this is execution context, not driver scheduling
- Two high-demand agencies can receive today
- One high-need agency has limited cold capacity
- Community Kitchen has 500 lb compatible capacity and confirmed demand up to 460 lb
- Every candidate agency has synthetic category-specific accepted, refused, and short-receipt counts with a visible sample size

All values and organizations are synthetic. No donor pickup is part of the scenario.

### Starting dashboard

- At-risk lots: 1
- Pounds approaching risk deadline: 1,200
- Refrigerated capacity used: seeded percentage
- Open outbound missions: seeded background count

### Inventory alert

```text
LOT-104 · Strawberries · 1,200 lb available at WH-001
Refrigerated · high modeled spoilage risk
Review agency fit and release before the seeded risk deadline.
```

---

## Primary plan options

### Option A — Hold for Later

- Attempts to keep all 1,200 lb in long-term storage
- Exceeds 420 lb headroom by 780 lb
- Has 0 planned outbound pounds and 0 outbound miles
- Remains visible but cannot be approved

Short-dwell staging cannot substitute for long-term storage.

### Option B — Fastest Agency Release

- Emphasizes same-day outbound allocation
- Uses little long-term storage
- Has greater route and receiving-window sensitivity
- Uses the seeded 45.7-mile warehouse-origin route

### Option C — Balanced Release

Recommended seeded result:

| Destination or handling path | Quantity |
|---|---:|
| Harbor Light Pantry | 420 lb |
| Eastside Community Pantry | 320 lb |
| Community Kitchen refrigerated staging | 400 lb |
| Supervisor inspection hold | 60 lb |
| **Total** | **1,200 lb** |

Balanced Release uses the seeded 24.8-mile warehouse-origin route and is recommended from current need, capacity, receiving windows, service gap, and historical acceptance/refusal evidence. History is explanatory and never overrides a hard current constraint.

`expectedSpoilageLb` is a risk estimate, not an additional quantity bucket. The 60 lb inspection hold is treated as modeled loss for impact and counted physically once.

---

## Presenter click path

### 0–15 seconds

Open `/dashboard`, point to `LOT-104`, and say: “The food bank already has 1,200 pounds of strawberries. The problem is moving existing inventory before it spoils.” Open `/inventory/LOT-104`.

### 15–30 seconds

Show on-hand pounds, risk deadline, warehouse location, refrigeration, staff condition status, and missing-data guardrails. Generate outbound plans.

### 30–50 seconds

Compare Hold for Later, Fastest Agency Release, and Balanced Release. Show the blocked 780 lb storage conflict, current agency constraints, historical acceptance sample sizes, and warehouse-origin map. Approve Balanced Release.

### 50–65 seconds

Open `PKG-104`, start packing, complete Community Kitchen batch `BAT-003`, and show `MSN-104` beginning at `WH-001` with no donor pickup.

### 65–80 seconds

Trigger **Eastside Community Pantry canceled**, review the affected 320 lb, and approve recovery.

### 80–90 seconds

Show `PKG-105`, `MSN-105`, calculated impact, and linked audit history.

---

## Primary disruption: Partner cancellation

After approval, Eastside Community Pantry cancels because receiving staff are unavailable.

Required behavior:

1. Mark the partner and affected stop `canceled`.
2. Identify 320 affected lb and preserve unaffected/completed work.
3. Move 260 lb to Northside Family Resource Center.
4. Increase Community Kitchen staging from 400 lb to 460 lb within confirmed demand and capacity.
5. Keep the original 60 lb inspection hold.
6. Require recovery approval.
7. Create `PKG-105` with non-colliding batches and `MSN-105`; preserve `PKG-104` read-only and mark `MSN-104` `superseded`.

---

## Disabled previews

- Vehicle breakdown
- Cold-capacity loss
- Driver unavailable
- Agency receiving window shortened

These are not executable. Donor scheduling, donor pickup, driver scheduling, and Vapi outreach are not demo steps.

---

## Target scenario metrics

| Metric | Target |
|---|---:|
| Existing inventory available | 1,200 lb |
| Planned outbound before the seeded risk deadline | 1,140 lb |
| Inspection hold treated as modeled loss | 60 lb |
| Modeled household-equivalents | 380 |
| Modeled spoilage avoidance | 94% |
| Seeded disruption-to-recovery event interval | 11 seconds |

These are calculated or seeded synthetic scenario values, not observed impact.

---

## Demo reset and contingency

`npm run demo:reset` verifies immutable fixtures. The in-app **Reset scenario** clears browser state and restores `LOT-104`, original capacities, agency histories and statuses, no approval, no disruption, and baseline audit events.

If an optional model explanation fails, use the deterministic lot-risk explanation. If the map fails, use the synchronized route list. If browser state is unclear, use the in-app reset.

Avoid claims that the AI knows food is safe, that modeled households are real, that the prototype is connected to live systems, or that historical acceptance guarantees a future agency outcome.
