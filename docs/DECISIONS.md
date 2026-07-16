# Decisions

This file records important project decisions so coding agents do not repeatedly reopen settled questions. Add new entries using the same structure.

---

## D-001 — Focus on one urgent perishable-donation workflow

**Status:** Accepted  
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
**Decision:** The map shows donors, warehouse, partners, routes, receiving windows, capacity, and demand-related status.  
**Reason:** Distance alone is insufficient; the map should explain the plan.  
**Consequence:** A synchronized list is required for accessibility and fallback.

---

## D-008 — Avoid mandatory live routing dependencies

**Status:** Accepted  
**Decision:** The demo uses precomputed route geometry and distances or a deterministic local heuristic.  
**Reason:** A live route API creates unnecessary presentation risk.  
**Consequence:** Production routing integration is explicitly out of MVP scope.

---

## D-009 — Use Next.js and TypeScript as the provisional stack

**Status:** Accepted unless repository initialization chooses an approved alternative  
**Decision:** Use Next.js App Router, TypeScript, Tailwind, React Leaflet, Zod, and lightweight local state.  
**Reason:** This stack supports multiple screens, routing, maps, schemas, and fast hackathon development.  
**Consequence:** If changed, update `AGENTS.md`, `README.md`, and contracts together.

---

## D-010 — Use local seed data rather than a production database

**Status:** Accepted  
**Decision:** The MVP uses an in-memory or local JSON repository with idempotent reset.  
**Reason:** The demo needs repeatability more than persistence or scale.  
**Consequence:** Authentication, migrations, and multi-user concurrency are non-goals.

---

## D-011 — Three plan options are the core interaction

**Status:** Accepted  
**Decision:** Present Warehouse First, Direct Distribution, and Mixed Plan where feasible.  
**Reason:** Scenario comparison makes tradeoffs visible and demonstrates more than a chatbot answer.  
**Consequence:** Each option must be complete, calculated, and explainable.

---

## D-012 — Primary disruption is pantry cancellation

**Status:** Accepted  
**Decision:** Pantry cancellation is the first fully implemented recovery event. Truck breakdown is the backup.  
**Reason:** It visibly changes both allocation and route while remaining straightforward to seed.  
**Consequence:** Other disruption buttons may be previews until the primary path is reliable.

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

## New decision template

```md
## D-XXX — Decision title

**Status:** Proposed / Accepted / Superseded  
**Decision:** ...  
**Reason:** ...  
**Alternatives considered:** ...  
**Consequence:** ...
```
