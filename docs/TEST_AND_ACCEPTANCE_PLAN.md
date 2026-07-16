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
```

No known critical or high-severity defect may remain in the primary scenario.

---

## Unit tests

### Schemas

- Valid donation extraction passes.
- Missing required fields produce `needs_confirmation`.
- Invalid units or negative quantities fail.
- Agent output with extra unsafe fields is rejected or stripped according to schema policy.

### Capacity

- Refrigerated product cannot use ambient-only capacity.
- Partner capacity cannot be exceeded.
- Vehicle payload cannot be exceeded.
- Unavailable partner or vehicle cannot be assigned.

### Scoring

- Score weights are versioned.
- Increasing need raises the positive component.
- Increasing refusal risk raises the penalty.
- Distance alone cannot dominate when documented score weights say otherwise.
- Final score remains within display range.

### Planning

- Three options are generated when feasible.
- Offered quantity is fully accounted for.
- Accepted quantity equals allocations plus hold and expected loss.
- No duplicate allocation IDs.
- Plan metrics match allocations.

### Metrics

- Households estimate uses scenario conversion factor.
- Spoilage-avoidance percentage handles zero baseline.
- Miles equal route-leg total.
- Capacity percentages are correct.
- Rounding is consistent.

### State transitions

- Draft plan cannot create mission.
- Approved plan creates packing plan and mission.
- Completed mission cannot return to draft.
- Disrupted mission enters replanning.
- Replacement mission supersedes original after approval.

---

## Integration tests

### Donation to plan

- Parse donor message.
- Confirm fields.
- Generate plan set.
- Verify agent runs and audit events.

### Plan approval

- Select plan.
- Edit valid quantity.
- Recalculate metrics.
- Approve.
- Verify mission and packing plan share allocation values.

### Partner cancellation

- Create disruption.
- Verify affected quantity.
- Generate replacement.
- Approve recovery.
- Verify no allocation remains at canceled partner.

### Model fallback

- Simulate failed LLM response.
- Verify fallback extraction.
- Verify UI remains usable.
- Verify agent run status is `fallback_used`.

---

## Component tests

### Dashboard

- Urgent alert visible
- KPI cards show derived values
- Alert navigation works

### Donation details

- Original message visible
- Confidence labels visible
- Missing fields disable planning

### Decision room

- All plan metrics render
- Selected plan is keyboard accessible
- Excluded destinations show reason
- Approval modal validates

### Map

- Marker list matches map locations
- Route layer toggles
- Partner popup opens details
- Color is not the only status indicator

### Impact

- Simulated labels visible
- Metrics update after replan
- Audit events ordered

---

## End-to-end tests

### E2E-001 — Primary strawberry flow

1. Reset demo.
2. Open dashboard.
3. Open `DON-104`.
4. Generate plans.
5. Approve Mixed Plan.
6. Open mission.
7. Trigger partner cancellation.
8. Approve recovery.
9. Open impact.
10. Verify target metrics and audit events.

### E2E-002 — Missing information

1. Enter incomplete donor message.
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
- No screen should require a production network API beyond optional map tiles.
- The application should recover gracefully from agent or tile failure.

---

## Screen acceptance checklist

### Dashboard

- [ ] Urgent donation visible
- [ ] KPIs calculated
- [ ] Navigation works

### Donation

- [ ] Original and extracted data visible
- [ ] Confidence visible
- [ ] Missing information handled

### Plans

- [ ] Three options displayed
- [ ] Quantity conservation passes
- [ ] Metrics and assumptions visible
- [ ] Human approval recorded

### Packing

- [ ] Batches match approved allocations
- [ ] Handling instructions visible

### Mission and map

- [ ] Stops and route visible
- [ ] Receiving windows visible
- [ ] Vehicle capacity valid

### Disruption

- [ ] Affected quantity identified
- [ ] Replacement plan valid
- [ ] Approval required

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
