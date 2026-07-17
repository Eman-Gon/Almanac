# Backup Demo Video Plan

## Target

- Length: two to four minutes.
- Format: screen recording with narration; no actual video file is created by this plan.
- Data statement: all organizations, people, capacities, routes, and outcomes shown are synthetic scenario data.

## Recording preparation

1. Run `npm run demo:reset` to verify immutable fixture readiness.
2. Run `npm run dev` and open `/dashboard`.
3. Select **Reset scenario** in the app to clear browser demo state.
4. Set the browser to a common laptop viewport and close developer tools.
5. Record each shot separately in the order below so a failed interaction can be replaced without re-recording the full walkthrough.

## Recording order and shot list

| Shot | Product state and action | Narration |
|---|---|---|
| 1. Operational stress | Freshly reset `/dashboard`; hold on the at-risk inventory alert and KPIs. | “The food bank already has 1,200 pounds of strawberries at WH-001. They need to move before the seeded risk deadline.” |
| 2. Existing lot | Open `/inventory/LOT-104`; show available pounds, risk deadline, location, refrigeration, condition status, and missing-data guardrails; select **Generate outbound plans**. | “ChoiceGrid starts after receiving. It uses validated lot facts and never makes a food-safety decision.” |
| 3. Alternatives | On `/plans/PLN-104`, select Hold for Later, show the blocking 780 lb capacity conflict, then select Balanced Release and agency-history evidence. | “Three alternatives expose the tradeoffs. History is shown with sample size, while current capacity and receiving windows remain hard constraints.” |
| 4. Human approval | Open the approval dialog and approve Balanced Release as `demo_user`. | “A human reviews the recommendation and remains responsible for approval.” |
| 5. Packing | On `/packing/PKG-104`, start packing and complete Community Kitchen batch `BAT-003`. | “The approved allocation becomes warehouse instructions. Per-batch progress persists, but completion cannot change pounds.” |
| 6. Mission | Open `/missions/MSN-104`; pan across warehouse origin, vehicle context, route, stops, and windows. | “The route begins at the warehouse and contains no donor pickup; ChoiceGrid is not a scheduling product.” |
| 7. Disruption | Open `/simulate?mission=MSN-104`; trigger Eastside Community Pantry cancellation and pause on the before/after allocation. | “The cancellation affects 320 pounds. The partner and original stop become canceled, while unaffected work is preserved.” |
| 8. Recovery approval | Show 260 lb to Northside and Community Kitchen increasing from 400 lb to 460 lb; approve recovery. | “The replacement stays within partner demand, partner capacity, staging, vehicle, temperature, window, and conservation constraints—and still requires human approval.” |
| 9. Replacement and impact | On `/packing/PKG-105`, show the completed 400 lb `-C` row and pending 60 lb `-R` delta; then open `/missions/MSN-105` and `/impact`. | “Recovery separates already-packed work from the new delta and keeps the original packing plan read-only. The replacement mission and impact remain fully auditable.” |

## Editing notes

- Keep the stressed dashboard as the first frame; do not open on a title slide.
- Use hard cuts between shots rather than speeding through loading or clicks.
- Preserve visible labels for synthetic, calculated, modeled, and seeded values.
- Do not show disabled disruption previews as working features.
- If a shot fails, reset in the app and re-record from the earliest state-dependent shot.
- End on the audit trail, not on an unsupported impact claim.

## Contingency cut

For a two-minute version, keep shots 1, 2, 3, 4, 7, 8, and 9. Mention packing and mission in narration over the transition from approval to disruption.
