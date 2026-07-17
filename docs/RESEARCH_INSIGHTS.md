# Research Insights

## Purpose

This file gives implementation agents the research findings that should influence product behavior. It is intentionally shorter than the full research appendix.

---

## Research coverage

| Component | Coverage |
|---|---:|
| Relevant subreddits included in broader review | 12 |
| Newly reviewed public Reddit threads | 30 |
| Approximate comments and replies viewed in those threads | ~230 |
| Complete Reddit thread exports supplied by the user | 2 |
| Items exactly parsed from those exports | 269 |
| Approximate comments in exact parsed subset | ~267 |
| Total Reddit thread pages considered | 32 |
| Approximate combined comments and replies considered | ~497 |
| Formal non-Reddit sources summarized | 20 |
| Existing products reviewed | 6 |

### Evidence warning

Only the **269-item exported subset** was systematically parsed and coded. Counts from that subset are exact within the coding method. The broader 30-thread review was qualitative; it must not be represented as an exact Reddit-wide scrape.

---

## Exact coded frequencies

Categories overlap because one item can mention several problems.

| Theme | Mentions | Share of 269 items |
|---|---:|---:|
| Repetitive, unbalanced, or insufficiently varied food | 59 | 21.9% |
| Storage, warehouse, funding, labor, or volunteer constraints | 42 | 15.6% |
| Fresh-food quality, spoilage, mold, or expiration | 42 | 15.6% |
| Shame, stigma, or eligibility confusion | 30 | 11.2% |
| Recipes, cooking knowledge, spices, or cultural fit | 27 | 10.0% |
| Client choice versus prepacked boxes | 23 | 8.6% |
| Allergies, dietary restrictions, or medical-food needs | 19 | 7.1% |
| Missing ingredients needed to make a complete meal | 16 | 5.9% |
| Toiletries, period products, clothing, or other assistance | 15 | 5.6% |
| Limited hours, transportation, delivery, or location access | 9 | 3.3% |
| Lack of cooking equipment or home storage capacity | 9 | 3.3% |

Do not add these percentages together.

---

## High-confidence qualitative findings

### Food quantity is not the same as food usability

Food can be unusable because of:

- Allergies or declared dietary restrictions
- Lack of refrigeration or freezer space
- Lack of a stove, oven, microwave, or can opener
- Missing milk, butter, oil, protein, or other meal components
- Cultural unfamiliarity
- Dental or preparation limitations
- Product condition or short remaining life

**Implementation implication:** destination and packing decisions should consider aggregate usability tags, not only pounds and proximity.

### Spoilage is a multi-stage supply-chain problem

Shelf life is consumed across the full chain. Almanac's authoritative MVP boundary begins after receiving and staff condition review, at storage, allocation, packing, outbound transportation, and agency receiving; upstream donor holding and pickup remain outside the hero.

**Implementation implication:** every perishable lot needs a risk window, storage requirement, current location, and movement priority.

### Choice improves fit, but unrestricted choice can reduce throughput

Recipients often prefer selecting or declining items, while workers face facility, labor, queue, and fairness constraints.

**Implementation implication:** model constrained choice and substitutions rather than a full online grocery store.

### Worker constraints explain many recipient complaints

Recurring constraints include:

- Cold-storage limits
- Volunteer shortages
- Sorting labor
- Funding
- Unpredictable donations
- Narrow receiving windows
- Limited visibility across departments

**Implementation implication:** do not frame the product as correcting uncaring workers. Frame it as helping teams act earlier with better information.

### Access is more than distance

Relevant variables include:

- Opening hours
- Receiving hours
- Public transport
- Travel time
- Work schedule
- Delivery availability
- Rural distance
- Mobility or illness

**Implementation implication:** map and ranking logic must not use distance alone.

### Fairness must be explicit

An efficiency-only system can repeatedly favor easy, close, and well-staffed destinations.

**Implementation implication:** show service-gap and equity indicators separately from travel efficiency.

---

## Formal research conclusions that affect implementation

1. Food insecurity is widespread and exists in every U.S. county.
2. Rural access and benefit ineligibility are significant issues.
3. In-kind donations are volatile and disruption-prone.
4. Storage capacity changes both efficiency and fairness.
5. Geographic optimization can worsen inequality when fairness is omitted.
6. Pantry information may be incomplete or outdated.
7. Nutrition classification requires staff time and can be uncertain.
8. AI can successfully convert unstructured volunteer notes into follow-up tasks.
9. Image analysis may support inspection priority but is not reliable enough for autonomous safety decisions.
10. Cold storage and volunteer labor are major operational capacity variables.

---

## Competitor findings

| Product category | Existing coverage | Build implication |
|---|---|---|
| Pantry discovery and reservations | Plentiful, Vivery | Do not build only a public pantry map |
| Donation posting, matching, pickup coordination, and records | MealConnect, Food Rescue Hero, Careit | Do not rebuild the marketplace; focus on the reviewed decision and recovery workflow |
| Client records and program administration | Link2Feed | Do not rebuild case management |
| Pantry inventory and online ordering | PantrySoft | Focus on multi-location allocation and recovery |
| Humanitarian scenario optimization | WFP Optimus | Borrow plan comparison and transparent tradeoffs |

Based on the reviewed public pages and authoritative hackathon-operator direction, Almanac's **product wedge** is the closed loop from at-risk inventory already in the warehouse to explainable outbound plans informed by current constraints and agency acceptance history, human approval, packing, warehouse-origin delivery, disruption recovery, and audit. The integration and demand case still require broader operator validation; this is not proof that existing products lack private or upcoming capabilities.

---

## Non-negotiable product implications

- Use synthetic or aggregate need profiles.
- Require human approval.
- Label uncertain pantry information.
- Keep food-safety decisions with staff.
- Explain why a destination was recommended or excluded.
- Calculate quantities and metrics deterministically.
- Include capacity, receiving windows, urgency, service gap, and refusal risk.
- Avoid claiming that the research is representative of every food bank or recipient.

For the complete evidence base, see `../research/food_bank_hackathon_research_summary.md`.
