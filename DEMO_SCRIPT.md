# ChoiceGrid Demo Script

## Purpose and timing

This is the full three-to-five-minute walkthrough. A 90-second cut is included at the end for a short judging slot.

The demo uses synthetic organizations, people, demand, capacities, coordinates, and timestamps. Quantities, capacity checks, route distances, scores, state transitions, and impact metrics are deterministic calculations over that seeded scenario. Donation extraction uses a validated deterministic fallback; the application is not connected to a live food bank, routing service, map service, database, or LLM.

## Before presenting

1. From the repository root, run:

   ```bash
   npm install
   npm run demo:reset
   npm run dev
   ```

2. Open `http://localhost:3000/dashboard`.
3. Select **Reset scenario** in the application. The terminal reset command verifies immutable fixture readiness; the in-app control clears browser demo state.
4. Keep these direct routes ready in separate notes:

   ```text
   /dashboard
   /donations/DON-104
   /plans/PLN-104
   /packing/PKG-104
   /missions/MSN-104
   /simulate?mission=MSN-104
   /packing/PKG-105
   /missions/MSN-105
   /impact
   ```

## Full walkthrough

### 0:00–0:30 — Open on operational stress

Open `/dashboard`.

Say:

> “A grocery store has offered 1,200 pounds of strawberries. Pickup is due before 1:00 PM, the cold chain matters, and the warehouse has only 420 pounds of long-term refrigerated-storage headroom.”

Point to the urgent alert, expiration-risk pounds, and refrigerated-capacity indicator. Open the donation.

Truth note: the offer, deadline, and capacities are synthetic scenario inputs.

### 0:30–0:55 — Structure the offer

On `/donations/DON-104`, show the original donor message beside the extracted product, quantity, deadline, temperature requirement, confidence, and condition note.

Say:

> “ChoiceGrid keeps the source message visible, marks confidence field by field, and does not make a food-safety decision. This demo is using the validated deterministic extraction fallback.”

Select **Generate plans**.

### 0:55–1:45 — Compare explainable alternatives

On `/plans/PLN-104`, show all three alternatives.

- Select **Warehouse First** and point out that it is blocked: 1,200 lb cannot fit into 420 lb of long-term storage headroom, so it exceeds that pool by 780 lb.
- Explain that the separate 500 lb staging pool is for short-dwell packing work and cannot be substituted for long-term storage.
- Return to **Mixed Plan** and show 420 lb to Harbor Light Pantry, 320 lb to Eastside Community Pantry, 400 lb to Community Kitchen staging, and 60 lb in supervisor inspection hold.
- Point to assumptions, exclusions, cold-storage utilization, staging utilization, and the equity indicator.

Say:

> “The system compares complete alternatives, but it will not let a human approve an infeasible one. Mixed Plan accounts for every pound and keeps operational tradeoffs visible.”

Select **Review & approve**, identify `demo_user`, confirm the checkbox, and approve.

### 1:45–2:15 — Turn approval into execution

On `/packing/PKG-104`, point out that quantities match the approved option. Select **Start packing**, then mark Community Kitchen batch `BAT-003` complete.

Say:

> “Each batch has its own pending or complete status. That progress survives navigation, while completion controls cannot change approved pounds.”

Open mission `MSN-104`. Show the assigned refrigerated vehicle, driver, ordered stops, windows, route, and human-approval event.

### 2:15–3:10 — Recover from a partner cancellation

Select **Trigger disruption**. On `/simulate?mission=MSN-104`, run the named **Eastside Community Pantry canceled** fixture.

Point out:

- Partner B and the affected original stop become `canceled`.
- 320 lb are affected.
- 260 lb move to Northside Family Resource Center.
- Community Kitchen staging increases from 400 lb to 460 lb, within 500 lb of partner capacity, confirmed 460 lb demand, and 500 lb of refrigerated staging.
- The original 60 lb inspection hold remains in long-term storage.

Say:

> “ChoiceGrid preserves only unchanged completed work, generates replacement packing instructions and a route, recalculates the constraints, and still requires a second human approval.”

Approve recovery, briefly open `/packing/PKG-105`, and show non-colliding `BAT-101`-series IDs: the 400 lb already packed for Community Kitchen is complete in a `-C` row, while the added 60 lb is a pending `-R` row. Open `PKG-104` only to show that it is now read-only, then open `MSN-105`.

### 3:10–3:45 — Show supersession and impact

On the replacement mission, show the changed route. Open `/impact`.

Point to:

- 1,200 lb offered.
- 1,140 lb assigned in time.
- 60 lb inspection hold or modeled loss.
- 380 estimated households supported using the seeded 3 lb-per-household assumption.
- 94% modeled spoilage avoidance.
- 11-second modeled replanning interval.
- The audit events linking original mission `MSN-104` as `superseded` to replacement `MSN-105`.

Close with:

> “These are calculated results from a synthetic scenario, not observed food-bank impact. The product claim is the closed, human-approved workflow: intake, comparison, execution, disruption recovery, and audit.”

## Backup path by interaction

| Interaction | Backup path |
|---|---|
| Dashboard alert does not open | Navigate directly to `/donations/DON-104`. |
| Donation generation action is missed | Navigate to `/plans/PLN-104`; reset first if the expected stage is unclear. |
| Approval dialog is interrupted | Close it, keep Mixed Plan selected, and reopen **Review & approve**. |
| Packing state is unexpected | Use **Reset scenario**, approve Mixed Plan again, then return to `/packing/PKG-104`. |
| Mission link is missed | Navigate to `/missions/MSN-104`. |
| Disruption screen is missed | Navigate to `/simulate?mission=MSN-104` after approval. |
| Recovery approval is interrupted | Remain on the simulator and select **Approve recovery** again; the action is idempotent once recovered. |
| Recovery packing link is missed | Navigate to `/packing/PKG-105` after recovery approval; before approval it intentionally shows that the plan has not been created. |
| Replacement mission link is missed | Navigate to `/missions/MSN-105` after recovery approval. |
| Impact link is missed | Navigate to `/impact`; it derives the current approved demo state. |
| Browser state becomes unclear | Select **Reset scenario** in the app. Do not rely on `npm run demo:reset` to clear browser storage. |

## Ninety-second cut

- **0–15 seconds:** Dashboard: 1,200 lb, 1:00 PM deadline, refrigeration constraint.
- **15–30 seconds:** Donation details: source message, structured fields, confidence, deterministic fallback.
- **30–50 seconds:** Decision Room: Warehouse First blocked by 780 lb; approve Mixed Plan.
- **50–65 seconds:** Packing and mission: per-batch status, vehicle, route, human approval.
- **65–80 seconds:** Cancel Eastside Community Pantry, show the 320 lb recovery, approve replacement.
- **80–90 seconds:** Impact and audit: 1,140 lb assigned in time, 380 modeled households, 94% modeled spoilage avoidance, and original mission superseded.
