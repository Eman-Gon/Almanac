# Metrics and Evidence

## Purpose

This file defines every metric displayed in the prototype and the evidence language allowed in the pitch. All demo values must be traceable to seeded data, formulas, or documented assumptions.

---

## Evidence categories

| Category | Use |
|---|---|
| Official challenge fact | Context from supplied hackathon documents |
| Exact coded research | Count from the 269-item Reddit subset |
| Qualitative research | Directional finding from the broader review |
| Formal external research | Finding tied to a named source |
| Simulated input | Synthetic donor, inventory, agency, vehicle, or demand data |
| Calculated demo metric | Formula applied to simulated input |
| Team assumption | Explicit modeling choice requiring disclosure |

Each metric tooltip or detail panel should identify whether it is simulated, calculated, or sourced.

---

## Core operational metrics

### Decision time

```text
decision_time_seconds = plan_approved_at - donation_created_at
```

For demo mode, the timer may represent elapsed application time or a seeded comparison baseline. Label the baseline.

### Replanning time

```text
replanning_time_seconds = replacement_plan_created_at - disruption_created_at
```

### Miles traveled

```text
total_route_miles = sum(route_leg_miles)
```

If precomputed route geometry is used, store an explicit seeded distance for each leg.

### Vehicle utilization

```text
vehicle_utilization_pct = assigned_weight_lb / vehicle_capacity_lb * 100
```

Do not exceed 100%.

### Cold-capacity utilization

```text
cold_capacity_utilization_pct = occupied_cold_weight_lb / cold_capacity_lb * 100
```

Report warehouse and partner capacity separately when appropriate.

### Staff time saved

This is an estimate, not observed impact.

```text
estimated_staff_minutes_saved = baseline_manual_minutes - measured_or_seeded_workflow_minutes
```

The baseline must be documented in the scenario fixture.

---

## Food-impact metrics

### Pounds offered

```text
pounds_offered = donation_offer.quantity_lb
```

### Pounds accepted

```text
pounds_accepted = sum(approved_allocations.quantity_lb) + approved_hold_quantity_lb
```

### Pounds assigned

```text
pounds_assigned = sum(mission_allocations.quantity_lb)
```

### Quantity conservation

```text
pounds_offered = accepted + declined + redirected_externally + unresolved
```

and

```text
pounds_accepted = assigned + inspection_hold + expected_handling_loss
```

Every plan must pass conservation checks within a documented rounding tolerance.

### Pounds distributed before risk deadline

```text
pounds_distributed_in_time = sum(
  allocation.quantity_lb
  where planned_delivery_at <= lot.risk_deadline
)
```

### Estimated spoilage avoided

This is a scenario model, not measured waste prevention.

```text
estimated_spoilage_avoided_lb =
  baseline_expected_spoilage_lb - approved_plan_expected_spoilage_lb
```

Expected spoilage should come from documented scenario assumptions, not an LLM.

### Estimated spoilage-avoidance percentage

```text
spoilage_avoidance_pct =
  estimated_spoilage_avoided_lb / baseline_expected_spoilage_lb * 100
```

Do not display when the baseline is zero.

### Refusals avoided

```text
estimated_refusals_avoided =
  baseline_high_risk_allocations - approved_high_risk_allocations
```

Label as modeled.

---

## Community-impact metrics

### Households supported

Use a scenario conversion factor:

```text
estimated_households_supported =
  distributed_weight_lb / scenario_lb_per_household
```

The primary scenario may use a documented factor chosen for the demo. Never imply that this is an observed household count.

### Need-match score

Recommended normalized components:

```text
need_match_score =
  0.30 * documented_need
+ 0.20 * usability_match
+ 0.15 * receiving_window_fit
+ 0.15 * available_capacity
+ 0.10 * recent_service_gap
+ 0.10 * equity_priority
- travel_penalty
- spoilage_penalty
- refusal_risk_penalty
```

All components should be normalized to a known range. Clamp the final display value to 0–100.

### Equity indicator

Do not call this objective fairness. A possible demo indicator is:

```text
equity_indicator = weighted_average(
  recent_service_gap,
  access_burden,
  high_need_priority,
  historical_allocation_balance
)
```

Display contributing factors.

### Usability-match percentage

```text
usability_match_pct =
  quantity_matching_destination_tags_lb / assigned_quantity_lb * 100
```

---

## Agent and trust metrics

### Extraction confidence

Field-level confidence may be:

- `high`: directly stated and unambiguous
- `medium`: inferred from clear context
- `low`: ambiguous or incomplete
- `unknown`: absent

### Recommendation approval rate

```text
approval_rate = approved_agent_recommendations / reviewed_recommendations
```

Only meaningful across multiple events; optional in the single-scenario demo.

### Human overrides

Count and display overrides with reasons. An override is not automatically an error; it demonstrates human control.

---

## Primary demo target values

The seeded strawberry scenario may be configured to produce approximately:

- 1,200 lb offered
- 1,140 lb assigned or distributed in time
- 60 lb inspection hold or expected handling loss
- 380 estimated households supported
- 94% modeled spoilage avoidance
- 11-second replanning time

These are **scenario values**, not validated real-world outcomes. The exact fixture and formulas must reproduce them.

---

## Prohibited metric behavior

- No randomly generated impact values.
- No untraceable counters.
- No use of “saved” when only “assigned” is known.
- No claim of households served without a documented conversion.
- No claim of carbon or financial savings unless a formula and assumption are provided.
- No mixing real research statistics with simulated product results without clear labels.
- No LLM-generated quantity, distance, or score treated as authoritative.

---

## Metric acceptance checklist

- [ ] Every displayed metric has a formula or source.
- [ ] Units are visible.
- [ ] Simulated values are labeled.
- [ ] Quantity conservation passes.
- [ ] Percent denominators are nonzero and documented.
- [ ] Rounding is consistent.
- [ ] Score components are inspectable.
- [ ] Baseline assumptions are visible in a detail panel or scenario file.
