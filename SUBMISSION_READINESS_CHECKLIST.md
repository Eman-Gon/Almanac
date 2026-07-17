# ChoiceGrid Submission Readiness Checklist

## Honest scorecard

| Criterion | Current status | Evidence | What still changes the score |
|---|---|---|---|
| Challenge fit | **Pass** | The official scope includes donation acceptance, warehousing, allocation, packing, distribution and delivery | Keep the pitch centered on the Strawberry Rescue workflow |
| Locally documented problem | **Pass** | Alameda County materials request routing by access windows and product urgency plus rapid replanning after truck or agency disruption | Cite the source documents on the evidence slide |
| Meaningful AI use | **Pass** | Risk and plan explanations assist staff; inventory, history calculations and operational truth remain deterministic | Demonstrate fallback and human review clearly |
| Working end-to-end prototype | **Pass** | Inventory review through planning, approval, packing, warehouse-origin mission, cancellation recovery, impact and audit | Run the command gate and rehearse the 90-second path |
| Human control and safety | **Pass** | Approval is mandatory; AI cannot declare food safe or silently dispatch | Avoid autonomous language in the pitch |
| Quantified prototype value | **Pass with qualification** | Scenario metrics are calculated from seeded data | Always say `calculated synthetic scenario`, not observed impact |
| Category demand | **Strong** | California identifies matching/inventory software as a capacity need; comparable platforms operate at scale | Position ChoiceGrid as an allocation and recovery layer, not another donation marketplace |
| ChoiceGrid-specific user validation | **Open** | The official build requests closely match the product | Complete real interviews and usability sessions |
| Historical replay readiness | **Open** | A replay protocol now exists | Build a configurable de-identified case path |
| Live operational pilot | **Open** | A safe shadow-pilot boundary is documented | Obtain a sponsor, data agreement, operational owner and manual fallback |
| Production readiness | **Out of hackathon scope** | The MVP deliberately uses local fixtures and browser state | Requires durable shared data, identity, monitoring, security and integrations |

## Required before presenting

- [ ] Run `npm run lint`.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm run test`.
- [ ] Run `npm run test:e2e`.
- [ ] Run `npm run build`.
- [ ] Run `npm run demo:reset`, then use **Reset scenario** in the browser.
- [ ] Rehearse the 90-second and full demo paths.
- [ ] Put a source footer on every external evidence slide.
- [ ] Label the Strawberry Rescue inputs and outcomes as synthetic.
- [ ] Explain that human approval is required twice: initial plan and recovery.
- [ ] Explain that MealConnect/Careit validate digital coordination demand and are not claimed to lack private features.
- [ ] End with one concrete ask: operator usability sessions and a supervised pilot partner.

## Evidence slide facts

Use only with their qualification:

| Fact | Safe use | Qualification |
|---|---|---|
| Alameda County challenge materials describe approximately 20 inbound trucks a day, 60 million pounds a year and hundreds of agencies | Establishes operational scale | Challenge context, not live ChoiceGrid data |
| The same materials request routing by access windows and urgency and rebuilding the day after truck or agency disruption | Establishes direct problem-feature fit | Does not prove ChoiceGrid adoption |
| StopWaste reported 14.39 million pounds recovered in Alameda County in 2024 | Establishes local recovery scale | External network result, not ChoiceGrid impact |
| StopWaste reported 65 of 84 identified recovery organizations were ACCFB member agencies active in its Food Recovery Program and reporting through MealConnect | Establishes a digitally coordinated local ecosystem | Also demonstrates an incumbent and integration consideration |
| Feeding America reported MealConnect passed seven billion pounds of facilitated food recovery in 2026 | Establishes category adoption | Owner-reported platform total, not ChoiceGrid demand |

Primary references are maintained in [`docs/SOURCE_INDEX.md`](docs/SOURCE_INDEX.md).

## Claims to use

> ChoiceGrid is a human-approved allocation and disruption-recovery control tower for at-risk food already inside the warehouse.

> Alameda County's own challenge materials ask for routing by access windows and product urgency and rapid replanning after a truck or agency disruption.

> The prototype calculates results from a synthetic scenario. The next proof is operator usability validation followed by a de-identified historical replay.

> ChoiceGrid can complement inventory and donation platforms by handling the explainable decision between an at-risk warehouse lot and an approved, recoverable outbound plan.

## Claims to avoid

- “Food banks have validated ChoiceGrid.”
- “ChoiceGrid is pilot proven.”
- “ChoiceGrid saved 1,140 pounds or served 380 households.”
- “The AI knows whether food is safe.”
- “ChoiceGrid autonomously dispatches vehicles or contacts partners.”
- “No competitor supports these capabilities.”
- “ChoiceGrid is production ready or compliant with every food-bank requirement.”

## Fastest path to close the open criteria

1. Recruit five to eight operators using [`FOOD_BANK_INTERVIEW.md`](FOOD_BANK_INTERVIEW.md).
2. Run the seven critical tasks in [`PILOT_VALIDATION_PLAN.md`](PILOT_VALIDATION_PLAN.md).
3. Log corrections and approved quotes; do not count praise without task evidence as validation.
4. Ask one organization to sponsor a configurable historical replay.
5. Obtain a written pilot scope before describing a pilot as committed.

Production work should begin only after operator validation changes or confirms the workflow.
