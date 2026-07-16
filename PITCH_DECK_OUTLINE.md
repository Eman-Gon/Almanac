# ChoiceGrid Pitch Deck Outline

Every operational example and metric in this outline comes from the synthetic Strawberry Rescue scenario. Do not imply that a food bank has adopted the product, that an interview has occurred, or that modeled outcomes are observed impact.

## Slide 1 — Every usable pound needs a feasible path

**Main message:** Urgent donations can fail when time, cold capacity, partner demand, receiving windows, packing, and transportation are decided in separate steps.

**Recommended visual:** A simple flow from urgent offer to partner delivery, with constraint icons at each handoff.

**Points:**

- A 1,200 lb refrigerated donation arrives with a 1:00 PM pickup deadline.
- Long-term cold storage, staging, receiving windows, and route feasibility differ.
- A plan can look efficient and still be operationally impossible.

**Speaker note:** Introduce this as a synthetic but operationally grounded scenario, not a claim about a specific food bank.

## Slide 2 — ChoiceGrid closes the decision loop

**Main message:** ChoiceGrid connects intake, plan comparison, approval, packing, delivery, recovery, and audit in one human-controlled workflow.

**Recommended visual:** The product flow: offer → alternatives → approval → packing/mission → disruption → replacement → impact.

**Points:**

- Structures an urgent offer and exposes missing or uncertain data.
- Compares complete alternatives using deterministic constraints.
- Preserves history when conditions change.

**Speaker note:** Emphasize that the product is an allocation and recovery control tower, not a chatbot, pantry locator, CRM, or full WMS.

## Slide 3 — AI assists; deterministic services decide operational truth

**Main message:** Language interpretation can be assisted, but pounds, capacity, routes, scores, metrics, and state transitions remain testable code.

**Recommended visual:** Two-column diagram: “Interpret and explain” versus “Calculate and validate.”

**Points:**

- Current demo parsing uses a validated deterministic fallback.
- Zod schemas validate shared data and API contracts.
- Human approval is mandatory before plans and replacements become executable.

**Speaker note:** Do not claim a live LLM integration. Explain that no model certifies food safety, dispatches a vehicle, or contacts a partner.

## Slide 4 — Three alternatives make tradeoffs visible

**Main message:** The recommendation is credible because users can compare it with complete alternatives and see why one is blocked.

**Recommended visual:** Screenshot of the three plan cards plus the capacity warning.

**Points:**

- Warehouse First exceeds 420 lb of long-term storage headroom by 780 lb.
- Mixed Plan uses a separate 500 lb short-dwell staging pool.
- Quantity conservation, capacity, temperature, windows, and vehicle load are hard constraints.

**Speaker note:** Explain that an infeasible option remains visible for comparison but cannot be approved.

## Slide 5 — Approval becomes actionable work

**Main message:** ChoiceGrid translates the reviewed allocation into packing batches and an assigned mission without changing approved quantities.

**Recommended visual:** Side-by-side packing-batch table and mission route.

**Points:**

- Each batch carries destination, quantity, staging, instruction, and completion status.
- The mission carries vehicle, driver, stops, quantities, and windows.
- Edits and approvals persist in a versioned local demo state and audit history.

**Speaker note:** Point out that `pending | complete` is execution progress, not permission to alter allocation.

## Slide 6 — Recovery preserves work and history

**Main message:** When Eastside Community Pantry cancels, ChoiceGrid replans only the affected 320 lb and requires another approval.

**Recommended visual:** Before-and-after route with the canceled stop crossed out and the replacement route highlighted.

**Points:**

- 260 lb move to Northside Family Resource Center.
- Community Kitchen staging increases from 400 lb to 460 lb within confirmed demand and capacity.
- `PKG-105` separates already-packed quantity from the pending recovery delta; `PKG-104` stays read-only and `MSN-104` links to `MSN-105`.

**Speaker note:** The truck, cold-capacity, driver, and deadline controls are disabled previews, not additional implemented fixtures.

## Slide 7 — Impact is calculated and labeled

**Main message:** ChoiceGrid shows traceable scenario outcomes without presenting synthetic data as real-world impact.

**Recommended visual:** Impact cards with a visible “synthetic scenario” label and an audit timeline.

**Points:**

- 1,140 lb assigned in time; 60 lb in inspection hold or modeled loss.
- 380 estimated households use a seeded 3 lb-per-household assumption.
- 94% modeled spoilage avoidance and 11 seconds are scenario calculations, not observed results.

**Speaker note:** Avoid “food saved,” “households served,” or “time saved” unless the statement remains explicitly modeled.

## Slide 8 — What the prototype proves

**Main message:** The MVP proves a coherent human-approved control loop and identifies what would require real operational validation next.

**Recommended visual:** Two columns: “Works in prototype” and “Requires partner validation or future integration.”

**Points:**

- Works: deterministic constraints, approval, packing, mission, one recovery, impact, audit, and reset.
- Not claimed: production persistence, live routing, live AI, authentication, dispatch, or food-safety automation.
- Next validation: interview food-bank operators about capacity semantics, approval roles, disruption frequency, and metric credibility.

**Speaker note:** State plainly that no food-bank interview is documented in the repository yet.
