# Almanac Pitch Deck Outline

Every operational value and product metric comes from the synthetic Strawberry Rescue scenario. Authoritative hackathon-operator feedback sets the product direction—existing warehouse inventory first—but it is not evidence of broad market demand, adoption, a pilot commitment, or observed impact. Do not identify or quote the person without separate permission.

## Slide 1 — Start where the food bank is already stuck

**Main message:** The food is already in the warehouse. Staff are sitting on excess inventory, trying to determine which agencies can actually take it before it spoils.

**Recommended visual:** `at-risk warehouse lot → explainable agency plans → approved outbound work → cancellation recovery`.

**Points:**

- The authoritative hackathon direction explicitly removes donor pickup scheduling from the hero.
- Official challenge materials ask teams to use agency access windows and product urgency and to rebuild the day after an agency cancels.
- Almanac focuses on the hard internal release decision after receiving and staff condition review.

**Evidence note:** Describe this as challenge/product direction. Do not turn one authoritative scope decision into a prevalence statistic or customer-demand claim.

## Slide 2 — Rough agency data becomes a reviewed decision

**Main message:** Current demand and capacity are necessary, but past acceptance, refusals, and short receipts help staff judge where a lot is likely to move.

**Recommended visual:** One agency row showing current receiving window, cold capacity, need, accepted/refused/short-receipt counts, and sample size.

**Points:**

- Historical acceptance is product-category specific and visibly tied to sample size.
- Sparse history is labeled low-confidence.
- Current capacity, temperature compatibility, availability, and receiving windows remain hard constraints.
- History supports staff judgment; it never guarantees a future outcome.

## Slide 3 — One human-controlled loop

**Main message:** Almanac connects lot review, plan comparison, approval, packing, warehouse-origin delivery, recovery, and audit.

**Recommended visual:** Workflow above “explain” and “calculate” responsibility columns.

**Points:**

- Optional AI explains validated lot facts and calculated plan differences.
- Quantities, acceptance rates, constraints, routes, scores, metrics, and transitions remain deterministic.
- Human approval is mandatory before both initial and replacement plans become executable.
- No model certifies food safety, dispatches a vehicle, or contacts a partner.

## Slide 4 — Three alternatives expose tradeoffs

**Main message:** The recommendation is credible because a human can compare complete alternatives and see why one is blocked.

**Recommended visual:** Three plan cards plus the storage conflict and agency-history evidence.

**Points:**

- **Hold for Later** is blocked: 1,200 lb cannot fit in 420 lb of long-term cold headroom; it creates no outbound mission.
- **Fastest Agency Release** emphasizes same-day movement but has a 45.7-mile seeded route and greater window sensitivity.
- **Balanced Release** uses partner deliveries, 400 lb of short-dwell staging, and a 60 lb inspection hold on a 24.8-mile seeded route.

## Slide 5 — Approval becomes warehouse action

**Main message:** Balanced Release becomes packing batches and a warehouse-origin mission without changing approved pounds.

**Points:**

- Each batch carries lot, destination, quantity, staging, instruction, and completion status.
- The mission begins at `WH-001` and contains partner drop-offs—no donor pickup.
- The seeded vehicle and driver are execution context, not a scheduling product.
- Approvals and edits persist in versioned demo state and audit history.

## Slide 6 — Recovery preserves work and history

**Main message:** When Eastside Community Pantry cancels, Almanac replans only the affected 320 lb and requires another approval.

**Points:**

- 260 lb move to Northside Family Resource Center.
- Community Kitchen staging increases from 400 lb to 460 lb within confirmed demand and capacity.
- `PKG-105` separates already-packed work from the pending delta.
- `PKG-104` remains read-only and `MSN-104` links to `MSN-105`.

## Slide 7 — Results are traceable and synthetic

**Main message:** Almanac shows calculated scenario outcomes without presenting them as real-world impact.

**Points:**

- 1,200 lb existing inventory is available; 1,140 lb is planned outbound before the seeded risk deadline.
- The 60 lb inspection hold is treated as modeled loss and counted physically once.
- 380 modeled household-equivalents equal `1,140 lb ÷ 3 lb` using a seeded assumption.
- 94% modeled spoilage avoidance uses the documented synthetic baseline.
- The displayed 11 seconds is a seeded event-time interval, not compute time or observed staff time.

Avoid “food saved,” “households served,” “time saved,” or “distributed” when the prototype proves only planned assignment.

## Slide 8 — What is proven and what comes next

**Main message:** The prototype proves a coherent warehouse-inventory release and recovery loop. Real operational effectiveness still requires validation.

**Points:**

- Proven in prototype: deterministic constraints and history calculations, human approval, packing, warehouse-origin mission, cancellation recovery, calculated impact, audit, and reset.
- Ready next: observed operator walkthroughs of the revised inventory-first flow.
- Then: configurable de-identified historical-lot replay and a non-authoritative shadow evaluation.
- Still missing: broad user-demand evidence, a named pilot sponsor, production data boundaries, and observed outcomes.

End with a concrete ask for operations or warehouse staff willing to test the revised flow. Do not call the current build production ready.

## Presentation source registry

- `AISCO Hackathon Deck 2026 - SHARE.pdf`, pp. 4, 7 and 11.
- `Alameda County Food Bank - Hackathon Challenge Themes.docx`, pp. 1–2.
- `Alameda County Food Bank - The Build List.docx`, pp. 1–2.
- The de-identified hackathon-operator direction supplied July 16, 2026; scope authority only, not public-quote or demand evidence.
- [StopWaste — Edible Food Recovery Capacity Planning Report for Alameda County](https://www.stopwaste.org/sites/default/files/2026-03/2024%20EFR%20Capacity%20Results%20Summary-7-Updated%20%281-16-26%29.pdf), September 2025.
- [Feeding America — What is MealConnect?](https://www.feedingamerica.org/hunger-blog/what-mealconnect-learn-about-feeding-americas-food-rescue-platform), April 14, 2026.
- [CalRecycle — Capacity Planning for Food Recovery](https://calrecycle.ca.gov/organics/slcp/foodrecovery/capacityplanning/), accessed July 16, 2026.
- [`PILOT_VALIDATION_PLAN.md`](PILOT_VALIDATION_PLAN.md).
