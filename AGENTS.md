# AGENTS.md

## Purpose

This repository is a hackathon prototype for **Almanac**, an AI-assisted food-bank allocation and disruption-recovery control tower. Every coding agent must preserve the same product story:

> A perishable inventory lot is already inside the food-bank warehouse and is at risk of spoilage. Almanac helps staff use existing inventory and agency history to compare explainable outbound plans, requires human approval, creates packing and delivery instructions from the warehouse, and replans when conditions change.

Do not turn the project into a generic chatbot, pantry locator, case-management system, or full warehouse-management platform.

The authoritative hackathon direction is **warehouse-inventory first**. A new donor offer, donor pickup coordination, Vapi outreach, and driver scheduling are not part of the hero workflow. They may remain isolated experiments only when they do not appear in primary navigation, seed-state calculations, or the judged demo.

> **Product brief:** After reading this file, read `ALMANAC_PRODUCT_SPEC.md` for the complete product north star, hero scenario, MVP workflow, and companion-document guide.

---

## Source-of-truth order

When documents disagree, follow this order:

1. `AGENTS.md`
2. `docs/SCOPE_AND_NON_GOALS.md`
3. `docs/DATA_MODEL.md`
4. `docs/API_AND_STATE_CONTRACTS.md`
5. `docs/AI_AGENT_CONTRACTS.md`
6. `docs/USER_FLOWS.md`
7. `docs/SCREEN_SPECIFICATIONS.md`
8. `docs/DEMO_SCENARIOS.md`
9. `docs/TEST_AND_ACCEPTANCE_PLAN.md`
10. `docs/RESEARCH_INSIGHTS.md`
11. `research/food_bank_hackathon_research_summary.md`

Research explains **why** the product exists. Approved contracts define **how** it behaves.

---

## Product rules

1. **Human approval is mandatory.** Agents may recommend, explain, draft, rank, and simulate. They may not silently approve donations, declare food safe, dispatch vehicles, or contact partners.
2. **Use AI only where it adds value.** Explanation and note normalization may use an LLM. Inventory quantities, capacity, routes, scores, acceptance-history calculations, and metrics must be deterministic and testable.
3. **Never fabricate operational facts.** Unknown data must be marked `unknown`, `needs_confirmation`, or `low_confidence`.
4. **No real recipient data.** Use synthetic or aggregated demand profiles only.
5. **No medical diagnosis.** Dietary matching uses declared categories and staff-approved product tags.
6. **No automated food-safety decision.** The system may flag condition or urgency and request inspection.
7. **Every recommendation must be explainable.** Show contributing factors, assumptions, exclusions, confidence, and alternatives.
8. **Every demo metric must be calculated.** Do not hard-code impressive numbers unless they are clearly part of the seeded scenario and derived from documented assumptions.
9. **The map supports decisions.** It must show more than proximity: warehouse origin, receiving windows, cold capacity, urgency, demand, historical acceptance, and outbound routes.
10. **The hero workflow comes first.** Finish the strawberry scenario before stretch features.
11. **Existing inventory is the starting point.** The hero lot has already been received into `WH-001`; do not add a donor pickup stop or make upstream donation intake a prerequisite.
12. **Agency history is decision evidence, not a verdict.** Show sample size, accepted/refused/short-receipt counts, and uncertainty; current capacity and receiving windows remain hard constraints.

---

## Implemented stack

The repository uses:

- Next.js App Router with strict TypeScript
- React and Tailwind CSS with repository-owned reusable components
- Lucide icons
- Zod for runtime schemas
- React context plus versioned browser `localStorage` for durable demo state
- Local deterministic seed data and domain services
- A bundled schematic map with precomputed route geometry; no live map or routing service is required
- Vitest and Testing Library for unit/component tests
- Playwright for the critical end-to-end demo

Avoid production infrastructure that is unnecessary for the hackathon.

---

## Expected commands

The initialized repository should expose these commands:

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
npm run demo:check
npm run check:contrast
npm run mobile
```

If the actual commands differ, update both `README.md` and this file in the same change.

Hosted web deploy steps live in `docs/DEPLOY.md`. The Expo Go companion under `mobile/` is a WebView shell over that hosted app, not a separate backend.

---

## Implementation standards

### TypeScript

- Use strict mode.
- Avoid `any`; prefer explicit types and Zod-derived types.
- Keep domain types centralized.
- Do not duplicate enum strings across files.
- Validate all agent outputs and API inputs at runtime.

### Components

- Keep screen components thin.
- Put calculations in domain services, not React components.
- Use semantic names such as `PlanComparisonTable`, not `Card3`.
- Include loading, empty, error, and low-confidence states.
- Meet keyboard and screen-reader requirements.

### Data and calculations

- Store weights, capacities, times, and quantities in explicit units.
- Use ISO 8601 timestamps.
- Prefer pounds for food weight in the demo; do not mix pounds and cases without conversion metadata.
- Put score weights and metric assumptions in named configuration objects.
- Preserve an audit event when a human approves, edits, or overrides a recommendation.

### AI integration

- Use structured outputs.
- Validate every response.
- Provide deterministic fallback behavior.
- Record model errors without blocking the full demo.
- Never expose secrets in the browser or repository.
- Keep prompts in versioned source files or constants, not scattered through UI components.

---

## Required test coverage

At minimum, test:

- Inventory-lot schema and missing-data handling
- Capacity constraints
- Destination-score calculations, including historical agency acceptance and refusal signals
- Plan totals and conservation of quantity
- Human-approval state transition
- Partner cancellation replanning
- Impact metric calculations
- Low-confidence and missing-data handling
- Critical keyboard navigation
- Complete primary demo flow

A change is not complete if it breaks the seeded demo.

---

## Change protocol

Before coding:

1. Read the documents relevant to your task.
2. Identify the contract or acceptance criterion being implemented.
3. Reuse existing domain types and status values.
4. Note any ambiguity in `docs/DECISIONS.md` or ask for clarification rather than inventing a conflicting rule.

After coding:

1. Run lint, type checks, relevant tests, and the production build.
2. Run the primary demo flow or the affected segment.
3. Update documentation when contracts or commands change.
4. Report exactly what changed, tests run, known issues, and any assumptions.

---

## Prohibited changes without approval

- Replacing the core Almanac workflow with another product
- Adding real recipient PII or medical information
- Removing human approval
- Letting an LLM compute authoritative quantities, historical acceptance rates, or safety decisions
- Making live external routing or data services mandatory for the demo
- Renaming core statuses or entities without updating all contracts and tests
- Claiming real-world impact from synthetic data
- Expanding into authentication, billing, enterprise integrations, or full CRM functionality during the MVP

---

## Definition of done

A feature is complete when:

- It satisfies the documented acceptance criteria.
- Types and schemas agree across client, server, and agent layers.
- Loading, empty, error, and low-confidence states are handled.
- Relevant unit and integration tests pass.
- The production build succeeds.
- The seeded primary demo remains runnable.
- Metrics shown are traceable to data and formulas.
- Human approval and audit behavior remain intact.

---

## Handoff format

Use this structure when reporting work:

```text
Implemented:
- ...

Files changed:
- ...

Contracts followed:
- ...

Validation performed:
- npm run ...

Known limitations:
- ...

Recommended next task:
- ...
```
