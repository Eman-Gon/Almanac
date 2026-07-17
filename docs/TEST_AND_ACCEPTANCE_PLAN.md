# Test and Acceptance Plan

## Test strategy

Testing focuses on the parts most likely to undermine trust or break the live demonstration:

1. Structured data contracts
2. Quantity conservation
3. Capacity and time-window feasibility
4. Human approval and audit behavior
5. Disruption recovery
6. Metric calculations
7. Critical screen navigation
8. Accessibility

---

## Required command gate

Before a release or presentation build:

```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
npm run demo:reset
```

`npm run demo:reset` verifies immutable fixture readiness. Use the in-app **Reset scenario** control when a test or rehearsal must clear browser demo state.

No known critical or high-severity defect may remain in the primary scenario.

---

## Unit tests

### Schemas

- Valid existing-inventory lot passes.
- Missing available quantity, risk deadline, temperature, location, or condition status produces `needs_confirmation`.
- Invalid units or negative quantities fail.
- Agent output with extra unsafe fields is rejected or stripped according to schema policy.

### Capacity

- Refrigerated product cannot use ambient-only capacity.
- Long-term refrigerated storage and short-dwell refrigerated staging are validated as separate pools.
- The primary 400 lb staging allocation uses 80% of the 500 lb staging pool; recovery uses 460 lb, or 92%.
- The 60 lb inspection hold consumes long-term refrigerated-storage headroom.
- Partner capacity cannot be exceeded.
- Vehicle payload cannot be exceeded.
- Unavailable partner or vehicle cannot be assigned.

### Scoring

- Score weights are versioned.
- Increasing need raises the positive component.
- Increasing refusal risk raises the penalty.
- Stronger category-specific acceptance history raises its positive component when sample size is sufficient.
- Sparse or missing history is labeled low-confidence and cannot become a fabricated positive signal.
- Accepted/refused/short-receipt counts reconcile to the displayed sample size and rate.
- Distance alone cannot dominate when documented score weights say otherwise.
- Final score remains within display range.

### Planning

- Three options are generated when feasible.
- Available inventory is fully accounted for.
- Available inventory equals outbound allocations plus retained, inspection-hold, external-transfer, and unallocated physical buckets. Expected spoilage is a non-exclusive risk metric and is not added again.
- No duplicate allocation IDs.
- Plan metrics match allocations.
- Plan edits accept quantity changes only and rebuild identities and allocation metadata from the canonical option.
- Submitted metric values cannot override canonical strategy estimates.

### Metrics

- Households estimate uses scenario conversion factor.
- Spoilage-avoidance percentage handles zero baseline.
- Miles equal route-leg total.
- Hold for Later is blocked with 0 outbound miles; Fastest Agency Release and Balanced Release total 45.7 and 24.8 miles respectively.
- Capacity percentages are correct.
- Rounding is consistent.
- Quantity edits recalculate distributed pounds, households, storage, and staging; spoilage, labor, need-match, equity, refusal risk, and route miles remain labeled seeded strategy estimates.

### State transitions

- Draft plan cannot create mission.
- Approved plan creates packing plan and mission.
- Completed mission cannot return to draft.
- Disrupted mission enters replanning.
- Replacement mission supersedes original after approval.
- Recovery approval adds `PKG-105` to `packingPlans`, retains `PKG-104`, and makes `activePackingPlanId` equal `PKG-105`.
- Mission stops reject out-of-order completion and become `delivered` only after every non-canceled stop completes.
- Recovery uses non-colliding `BAT-101`-series IDs and splits completed quantity from a pending recovery-only delta when a destination/staging batch grows.
- `PKG-104` is read-only after recovery; only active `PKG-105` may change.

---

## Integration tests

### Inventory lot to plan

- Load `LOT-104` already at `WH-001`.
- Confirm required operational facts.
- Generate plan set.
- Verify agent runs and audit events.
- Verify the map and mission contain no donor pickup.

### Plan approval

- Select plan.
- Edit valid quantity.
- Recalculate metrics.
- Verify tampered identities and submitted metrics do not become authoritative.
- Approve.
- Verify mission and packing plan share allocation values.

### Partner cancellation

- Create disruption.
- Verify affected quantity.
- Generate replacement.
- Approve recovery.
- Verify no allocation remains at canceled partner.
- Verify Partner B and its original route stop are `canceled`.
- Verify recovery creates `PKG-105`, retains read-only `PKG-104`, uses non-colliding batch IDs, and splits already-packed quantity from any recovery-only delta.
- Verify original mission is `superseded` and the replacement audit event references it.

### Packing completion

- Start the packing plan.
- Complete and reopen an individual batch.
- Verify batch status persists across navigation.
- Verify completion never changes approved allocation quantities.
- Verify recovered browser state refuses start or completion mutations against historical `PKG-104`.

### API state prerequisites

- Verify packing, mission, and impact GETs return `409 STATE_REQUIRED` without `preview=true` and return a response labeled `seed_preview_not_persisted` with it.
- Verify map GET returns a response labeled `seed_preview_not_persisted`.
- Verify packing start accepts `PKG-104` and `PKG-105` only from `ready`; every other status returns `409 INVALID_STATE_TRANSITION`.
- Verify packing completion requires an already-started plan, and repeating the current batch state returns `changed: false` with no audit event.
- Verify mission events require the complete current mission, matching route and event type, `assigned | in_transit` status, and the first pending stop; `warehouse_load_complete` targets `WH-001`, and out-of-order completion returns `409`.
- Verify partner cancellation requires the current approved plan and eligible current `MSN-104` mission.
- Verify recovery approval requires the linked current original plan, `PKG-104`, replanning `MSN-104` with its affected stop canceled, and matching disruption quantity; verify the response includes `PKG-105` and `MSN-105`.
- Verify recovery creation begins at `11:18:00`, approval/replacements occur at `11:18:11`, and later recovery packing/mission actions use later timestamps.

### Optional explanation fallback

- Simulate primary success and verify the primary model is recorded.
- Simulate primary timeout, provider failure, invalid JSON, and missing required facts; verify the backup model is attempted.
- Simulate both model attempts failing and verify deterministic lot-risk explanation.
- Verify UI remains usable.
- Verify agent run status is `fallback_used`.
- Verify the response and UI distinguish primary, backup, and deterministic sources without exposing the API key.

---

## Component tests

### Dashboard

- Urgent alert visible
- KPI cards show derived values
- Alert navigation works

### Inventory details

- Existing lot, warehouse, risk deadline, available pounds, and condition status visible
- Unknown or low-confidence labels visible
- Missing required facts disable planning

### Decision room

- All plan metrics render
- Selected plan is keyboard accessible
- Excluded destinations show reason
- Approval modal validates

### Map

- Marker list matches map locations
- Current route markers show full names and stop order; nearby context labels appear only after selection
- No detail panel is open until a marker or synchronized row is selected
- Route rows distinguish planned mission quantity from requested demand
- Zoom in, zoom out, reset, keyboard pan, and drag pan change presentation only and preserve route geometry and metrics
- Route, demand, capacity, and vehicle layer toggles update the map and visible legend/list
- Partner popup opens details
- Color is not the only status indicator

### Impact

- Simulated labels visible
- Metrics update after replan
- Audit events ordered

### Routes and links

- Direct navigation works for every documented primary route.
- `/partners/PAR-001` renders the correct synthetic partner profile.
- Unknown inventory-lot, plan, packing, mission, and partner IDs render the intentional not-found state; unknown API IDs return `404 NOT_FOUND`.
- `/packing/PKG-104` and `/packing/PKG-105` show an intentional prerequisite state until their respective approvals create them.
- The global hydration gate renders no action controls before saved browser state is validated.
- Missions navigation and `/missions` resolve to `MSN-105` after recovery.
- Warehouse labels do not link to `/partners/*`.

---

## End-to-end tests

### E2E-001 — Primary strawberry flow

1. Reset demo.
2. Open dashboard.
3. Open `LOT-104` from `/inventory`.
4. Generate plans.
5. Verify acceptance-history evidence and approve Balanced Release.
6. Open mission.
7. Trigger partner cancellation.
8. Approve recovery.
9. Open `PKG-105` and verify recovery packing state.
10. Open impact.
11. Verify target metrics and audit events.

### E2E-002 — Missing inventory information

1. Load an inventory lot missing a required operational fact.
2. Confirm plan generation disabled.
3. Fill required field.
4. Generate plans.

### E2E-003 — Invalid allocation edit

1. Open plan.
2. Exceed partner capacity.
3. Verify inline error.
4. Verify approval blocked.

### E2E-004 — LLM failure

1. Force agent failure.
2. Verify fallback notice.
3. Complete primary path.

---

## Accessibility tests

- Keyboard traversal through plan cards
- Visible focus
- Dialog focus trap and return
- Form labels and errors
- Table headers
- Screen-reader text for icons
- Synchronized non-map location list
- Reduced-motion behavior
- Contrast checks

Use automated tooling plus manual keyboard review.

---

## Performance and reliability

For the seeded demo on a typical laptop:

- Initial dashboard should become usable quickly.
- Plan generation with deterministic fixtures should complete in less than two seconds.
- Replan should complete in less than two seconds when not intentionally showing a timer animation.
- No screen should require a production network API; the map and route use bundled local rendering.
- The application should remain usable with a deterministic lot-risk explanation and the synchronized non-map location list.

---

## Screen acceptance checklist

### Dashboard

- [ ] At-risk inventory visible
- [ ] KPIs calculated
- [ ] Navigation works

### Inventory

- [ ] Inventory list distinguishes the single active lot from display-only synthetic history
- [ ] Existing lot and warehouse risk facts visible
- [ ] Missing or low-confidence facts visible
- [ ] Missing information handled

### Plans

- [ ] Three options displayed
- [ ] Quantity conservation passes
- [ ] Metrics and assumptions visible
- [ ] Human approval recorded
- [ ] Historical acceptance/refusal evidence shows counts and sample size

### Packing

- [ ] Batches match approved allocations
- [ ] Handling instructions visible
- [ ] Per-batch status persists and does not change quantities

### Mission and map

- [ ] Stops and route visible
- [ ] Receiving windows visible
- [ ] Vehicle capacity valid
- [ ] Route begins at `WH-001` and contains no donor pickup

### Disruption

- [ ] Affected quantity identified
- [ ] Replacement plan valid
- [ ] Approval required
- [ ] Partner and affected stop canceled
- [ ] Original mission superseded after approval

### Impact

- [ ] Metrics calculated
- [ ] Simulated labels visible
- [ ] Audit history complete

---

## Bug severity

| Severity | Definition |
|---|---|
| Critical | Demo cannot proceed, data is corrupted, or unsafe claim is shown |
| High | Core plan, approval, route, replan, or metric is wrong |
| Medium | Important state or accessibility issue with workaround |
| Low | Cosmetic or non-blocking polish issue |

Presentation build requires zero critical and zero known high defects in the primary flow.

---

## Final signoff

The project is presentation-ready when:

- [ ] All required commands pass.
- [ ] Primary E2E test passes twice from clean reset.
- [ ] A non-developer completes the flow using the presenter script.
- [ ] Simulated data is labeled.
- [ ] Human approval is visible.
- [ ] Metric formulas match documentation.
- [ ] Fallback behavior has been tested.
- [ ] The final production build runs locally without developer intervention.
