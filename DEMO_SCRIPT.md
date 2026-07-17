# ChoiceGrid Demo Script

## Purpose and timing

This is the full three-to-five-minute walkthrough, followed by a 90-second cut.

All organizations, people, inventory, agency histories, capacities, coordinates, timestamps, and outcomes are synthetic. Quantity, capacity, score, route, state, and impact calculations are deterministic. An optional model may explain validated facts, but the hero does not require a live LLM, routing service, map service, communications provider, or production database.

## Before presenting

1. Run `npm install`, `npm run demo:reset`, and `npm run dev`.
2. Open `http://localhost:3000/dashboard` and select **Reset scenario**.
3. Keep these routes ready:

   ```text
   /dashboard
   /inventory/LOT-104
   /plans/PLN-104
   /packing/PKG-104
   /missions/MSN-104
   /simulate?mission=MSN-104
   /packing/PKG-105
   /missions/MSN-105
   /impact
   ```

## Full walkthrough

### 0:00–0:30 — Open on inventory that is not moving

Open `/dashboard`.

Say:

> “The food bank already has 1,200 pounds of strawberries in refrigerated inventory. The hard part is using rough agency data to move them somewhere useful before they spoil. ChoiceGrid starts here—after receiving—not with donor pickup scheduling.”

Point to the at-risk inventory alert, risk-deadline pounds, and cold capacity. Open `LOT-104`.

Truth note: the lot, times, quantities, agency histories, and capacities are synthetic scenario inputs. The warehouse-inventory-first framing follows authoritative hackathon-operator direction; it is not a claim of broad adoption or observed impact.

### 0:30–0:55 — Review the existing lot

On `/inventory/LOT-104`, show:

- 1,200 lb already at `WH-001`
- Received time and seeded risk deadline
- Refrigeration requirement
- Staff-entered condition status and the 60 lb inspection hold
- Missing-data guardrails

Say:

> “ChoiceGrid uses the facts the warehouse already has. Unknowns stay unknown, and the system never makes a food-safety decision.”

Select **Generate outbound plans**.

### 0:55–1:45 — Compare explainable alternatives

On `/plans/PLN-104`:

- Select **Hold for Later** and show why it is blocked: 1,200 lb cannot fit into 420 lb of long-term cold headroom. It has no outbound mission.
- Select **Fastest Agency Release** and show its same-day route and receiving-window tradeoff.
- Return to **Balanced Release**: 420 lb to Harbor Light Pantry, 320 lb to Eastside Community Pantry, 400 lb to Community Kitchen staging, and 60 lb in inspection hold.
- Show category-specific accepted, refused, and short-receipt counts with sample size. Make clear that history informs the ranking but current capacity and receiving windows remain hard constraints.

Say:

> “Balanced Release accounts for every physical pound, uses agency history as evidence rather than a guarantee, and keeps the constraints visible.”

Approve as `demo_user`.

### 1:45–2:15 — Turn approval into warehouse work

On `/packing/PKG-104`, start packing and complete Community Kitchen batch `BAT-003`.

Say:

> “The approved allocation becomes warehouse instructions. Completion can update progress, but it cannot change approved pounds.”

Open `MSN-104`. Show the route beginning at `WH-001`, partner drop-offs, receiving windows, and approval audit. There is no donor pickup and ChoiceGrid is not scheduling the driver.

### 2:15–3:10 — Recover from agency cancellation

On `/simulate?mission=MSN-104`, trigger **Eastside Community Pantry canceled**.

Show:

- 320 affected lb
- 260 lb moved to Northside Family Resource Center
- Community Kitchen increasing from 400 lb to 460 lb within confirmed demand and capacity
- The original 60 lb inspection hold unchanged

Say:

> “ChoiceGrid preserves unchanged completed work, recalculates the recovery, and still requires a second human approval.”

Approve recovery. Show `PKG-105` with the completed 400 lb `-C` row and pending 60 lb `-R` delta, then open `MSN-105`.

### 3:10–3:45 — Show traceable impact

Open `/impact` and point to:

- 1,200 lb existing inventory available
- 1,140 lb planned outbound before the seeded risk deadline
- 60 lb inspection hold treated as modeled loss, counted physically once
- 380 modeled household-equivalents using the seeded 3 lb assumption
- 94% modeled spoilage avoidance
- 11-second seeded event interval, not compute time or observed staff time
- `MSN-104` superseded by `MSN-105`

Close with:

> “These are calculated results from a synthetic scenario. The product claim is the human-approved loop for moving at-risk warehouse inventory: explainable allocation, packing, outbound execution, cancellation recovery, and audit.”

## Backup path

| Interaction | Backup path |
|---|---|
| Dashboard alert does not open | Navigate to `/inventory/LOT-104`. |
| Plan generation action is missed | Navigate to `/plans/PLN-104`; reset first if state is unclear. |
| Approval is interrupted | Keep Balanced Release selected and reopen **Review & approve**. |
| Packing state is unexpected | Reset, approve Balanced Release again, then open `/packing/PKG-104`. |
| Mission link is missed | Navigate to `/missions/MSN-104`. |
| Simulator is missed | Navigate to `/simulate?mission=MSN-104` after approval. |
| Recovery is interrupted | Select **Approve recovery** again; the action is idempotent after recovery. |
| Replacement links are missed | Open `/packing/PKG-105` or `/missions/MSN-105` after recovery. |
| Browser state is unclear | Use the in-app **Reset scenario** action. |

## Ninety-second cut

- **0–15 seconds:** Existing `LOT-104` at `WH-001`: 1,200 lb at risk, no donor pickup story.
- **15–30 seconds:** Inventory facts and missing-data/safety guardrails.
- **30–48 seconds:** Hold for Later blocked; acceptance history and current agency constraints visible; approve Balanced Release.
- **48–62 seconds:** Packing and warehouse-origin mission.
- **62–78 seconds:** Cancel Eastside, replan 320 lb, approve recovery.
- **78–90 seconds:** Calculated synthetic impact and supersession audit.
