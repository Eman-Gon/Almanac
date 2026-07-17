# Decisions

This file records important project decisions so coding agents do not repeatedly reopen settled questions. Add new entries using the same structure.

---

## D-001 — Focus on one urgent perishable-donation workflow

**Status:** Superseded by D-017
**Decision:** The MVP centers on a 1,200 lb strawberry donation, plan comparison, approval, route, disruption, and impact.
**Reason:** A coherent end-to-end story is stronger and more buildable than a broad collection of shallow features.
**Consequence:** Features unrelated to this workflow are stretch scope.

---

## D-002 — Keep humans in control

**Status:** Accepted
**Decision:** Human approval is required before donation disposition, plan approval, mission replacement, or communication.
**Reason:** The challenge asks for tools that improve workers' effectiveness rather than replace them.
**Consequence:** Agent recommendations must remain reviewable and auditable.

---

## D-003 — Use deterministic calculations for operational truth

**Status:** Accepted
**Decision:** Quantities, capacity, scores, routes, state transitions, and metrics are calculated by code. LLMs interpret language and explain results.
**Reason:** Deterministic behavior is testable and trustworthy during a live demo.
**Consequence:** No LLM output may directly become an authoritative quantity or route without validation.

---

## D-004 — Use synthetic and aggregate data

**Status:** Accepted
**Decision:** The prototype contains no real recipient records and uses synthetic donors, partners, staff, and demand.
**Reason:** The product does not require sensitive personal data to demonstrate value.
**Consequence:** All displayed impact values are scenario estimates.

---

## D-005 — Do not automate food-safety decisions

**Status:** Accepted
**Decision:** The system may flag urgency or request inspection but cannot declare food safe or unsafe.
**Reason:** Visual or date-based inference is insufficient for a safety determination.
**Consequence:** Condition uncertainty produces `needs_inspection`.

---

## D-006 — Separate efficiency and fairness

**Status:** Accepted
**Decision:** Plan comparison shows operational efficiency, need, and equity-related indicators separately.
**Reason:** A single opaque score can hide policy tradeoffs and repeatedly favor easy destinations.
**Consequence:** Score components and weights remain inspectable.

---

## D-007 — Use a map as decision context, not decoration

**Status:** Accepted
**Decision:** The hero map shows the warehouse origin, partners, routes, receiving windows, capacity, demand, and historical acceptance context. It contains no donor pickup.
**Reason:** Distance alone is insufficient; the map should explain the plan.
**Consequence:** A synchronized list is required for accessibility and fallback.

---

## D-008 — Avoid mandatory live routing dependencies

**Status:** Accepted
**Decision:** The demo uses precomputed route geometry and distances or a deterministic local heuristic.
**Reason:** A live route API creates unnecessary presentation risk.
**Consequence:** Production routing integration is explicitly out of MVP scope.

---

## D-009 — Use the implemented lightweight Next.js stack

**Status:** Accepted
**Decision:** Use Next.js App Router, strict TypeScript, React, Tailwind, repository-owned components, Lucide, Zod, React context with versioned browser `localStorage`, deterministic local fixtures, and a bundled schematic map with precomputed route geometry.
**Reason:** This implementation supports the complete local demo without mandatory map, routing, database, or LLM services.
**Consequence:** If changed, update `AGENTS.md`, `README.md`, and contracts together.

---

## D-010 — Use local seed data rather than a production database

**Status:** Accepted
**Decision:** The MVP uses immutable TypeScript seed fixtures and Zod-validated browser `localStorage` for versioned demo state. The in-app reset action clears that browser state idempotently.
**Reason:** The demo needs repeatability more than persistence or scale.
**Consequence:** Authentication, migrations, and multi-user concurrency are non-goals.

---

## D-011 — Three plan options are the core interaction

**Status:** Accepted
**Decision:** Present Hold for Later, Fastest Agency Release, and Balanced Release. Hold for Later remains visible but blocked; Balanced Release is the seeded recommendation.
**Reason:** Scenario comparison makes the warehouse-release tradeoffs visible and demonstrates more than a chatbot answer.
**Consequence:** Each option must be complete, calculated, and explainable.

---

## D-012 — Primary disruption is partner cancellation

**Status:** Accepted
**Decision:** Eastside Community Pantry cancellation is the one fully implemented recovery event. Truck breakdown and the other disruption controls remain disabled previews.
**Reason:** It visibly changes both allocation and route while remaining straightforward to seed.
**Consequence:** The internal event is `partner_canceled`; the affected partner and route stop become `canceled`; other disruption buttons must not be presented as executable fixtures.

---

## D-013 — Metric values must be traceable

**Status:** Accepted
**Decision:** Every KPI and impact value comes from source data, formulas, or documented scenario assumptions.
**Reason:** Hard-coded “impact theater” damages credibility.
**Consequence:** Tests reproduce the primary scenario targets.

---

## D-014 — Existing products shape differentiation

**Status:** Accepted
**Decision:** ChoiceGrid will not be positioned as only a pantry locator, reservation system, donation marketplace, volunteer pickup app, client CRM, or inventory dashboard.
**Reason:** Reviewed products already cover those categories.
**Consequence:** The pitch emphasizes closed-loop allocation, packing, route, recovery, and impact.

---

## D-015 — Separate refrigerated storage from short-dwell staging

**Status:** Accepted
**Decision:** Model long-term refrigerated storage and short-dwell refrigerated staging as separate capacity pools. The hero warehouse has 420 lb of long-term storage headroom and 500 lb of refrigerated staging. The 60 lb supervisor inspection hold consumes storage; Community Kitchen's packing allocation consumes staging.
**Reason:** Cross-dock and meal-kit staging do not represent the same operational constraint as holding product in long-term warehouse storage. Keeping the pools explicit makes Hold for Later correctly infeasible while Balanced Release and recovery remain deterministically feasible.
**Alternatives considered:** Treat all refrigerated space as one pool; increase a single warehouse-capacity number; send the recovery's additional 60 lb to inspection hold.
**Consequence:** Capacity services, schemas, fixtures, plan metrics, UI labels, and tests must validate the pools separately. The primary plan stages 400 lb; recovery stages 460 lb within 500 lb of staging and Community Kitchen's 500 lb capacity and confirmed 460 lb demand.

---

## D-016 — Separate operator validation from an operational pilot

**Status:** Accepted
**Decision:** The seeded application may be used for facilitated operator discovery and usability testing. It must not be described as capable of historical case replay or a live shadow pilot until a configurable de-identified case path, partner-approved data boundary, named operational owner, success measures, and stop conditions exist.
**Reason:** The current plan-generation and browser-state workflow are intentionally tied to the synthetic Strawberry Rescue scenario. Better documentation or a cosmetic pilot-mode label does not create operational readiness.
**Alternatives considered:** Call the current synthetic walkthrough a pilot; add a cosmetic pilot toggle; introduce real operational data directly into demo state.
**Consequence:** Validation claims must follow `PILOT_VALIDATION_PLAN.md` and `research/validation/EVIDENCE_REGISTER.md`. Current staff procedures remain authoritative in any future shadow evaluation, and no interview, pilot interest, commitment, or result may be fabricated.

---

## D-017 — Start with existing at-risk warehouse inventory

**Status:** Accepted
**Decision:** The hero begins with `LOT-104`, 1,200 lb of strawberries already received at `WH-001`. ChoiceGrid combines current agency constraints with category-specific acceptance/refusal/short-receipt history, compares outbound plans, requires human approval, creates packing and warehouse-origin delivery instructions, and replans after a partner cancellation. Donor intake, donor pickup, Vapi outreach, and driver scheduling are not hero features.
**Reason:** Authoritative hackathon-operator product direction says upstream donor collection introduces too many scheduling, quality-review, and handling steps; the higher-value problem is deciding where existing over-inventory should go before it spoils.
**Evidence boundary:** This is authoritative challenge/product direction, not consent to publish a person's identity or raw transcript, not proof of broad user demand, and not a pilot commitment.
**Alternatives considered:** Preserve the donor-first story; add existing inventory as a secondary tab; broaden into a logistics scheduler.
**Consequence:** The primary route is `/inventory/LOT-104`; missions start at `WH-001` and contain no donor pickup. Agency history must show sample size and cannot override current hard constraints. D-001's donor-first framing is superseded; the strawberry quantities, human approval, deterministic calculations, cancellation recovery, and synthetic evidence labels remain.

---

## D-018 — Ship the Cold Chain palette and a real typeface

**Status:** Accepted
**Decision:** The design layer in `app/globals.css` is the "Cold Chain" system. The palette encodes temperature: the workspace is cool by default, every neutral is a teal-shifted slate, and the primary action is an instrument cyan (`--blue-600` `#0d6e8c`) rather than a generic UI blue. Saturation is reserved for signal; warmth means at-risk — amber for a constraint under pressure, red for a break in the chain. No warm hue may be introduced for a non-urgent purpose. Type is Instrument Sans (`--type-ui`) and Martian Mono (`--type-mono`), loaded through `next/font` in `app/layout.tsx`; Martian Mono is restricted to figures, unit labels, eyebrows, and identifiers and is never used for body copy.
**Reason:** The product's governing variable is whether perishable inventory stays cold, so the palette should carry that meaning rather than decorate. Warmth is the one contrast the interface relies on to say "look here", and spending it on ornament makes at-risk states unreadable. The application previously specified no typeface at all and fell back to the system stack, which gave figures no tabular, instrument-grade treatment and left the shell looking untuned.
**Alternatives considered:** Keep the earlier generic navy/blue palette and only adjust contrast; use a single typeface for both UI and figures; leave typography on the system stack.
**Consequence:** `scripts/check-contrast.mjs` enforces the palette across 28 pairs at WCAG AA and exits non-zero on regression; run `npm run check:contrast` after any token change. This supersedes the palette section of `DESIGN_SYSTEM.md`, which now documents the shipped tokens as authoritative rather than suggested. Per D-009, a token or type change must move the CSS and the docs together.

---

## New decision template

```md
## D-XXX — Decision title

**Status:** Proposed / Accepted / Superseded
**Decision:** ...
**Reason:** ...
**Alternatives considered:** ...
**Consequence:** ...
```
