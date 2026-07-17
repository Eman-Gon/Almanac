# Architecture

Short overview of how ChoiceGrid is structured in this repository. Detailed contracts remain authoritative; when this file and a contract disagree, follow the source-of-truth order in [`AGENTS.md`](../AGENTS.md).

---

## Intent

ChoiceGrid is a **hackathon control-tower prototype**, not a production platform. The architecture optimizes for:

1. A runnable strawberry donation → plan → approve → pack → disrupt → recover → impact demo
2. Deterministic, testable operational math
3. Mandatory human approval before consequential action
4. Zero dependency on live databases, map tiles, routing APIs, or LLM calls

---

## System shape

```text
┌─────────────────────────────────────────────────────────────┐
│  Next.js App Router (React UI)                              │
│  app/* screens · components/* · state/demo-state.tsx        │
│  DemoState in localStorage (choicegrid-demo-v2)             │
└───────────────────────────┬─────────────────────────────────┘
                            │ fetch / mutate
┌───────────────────────────▼─────────────────────────────────┐
│  Route handlers (stateless)                                 │
│  app/api/* — seed projections + transition functions        │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│  Domain services (authoritative calculations)               │
│  domain/{schemas,scoring,planning,execution,recovery,…}     │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│  Seed fixtures                                              │
│  data/seed/scenario.ts                                      │
└─────────────────────────────────────────────────────────────┘
```

There is no server-side session store and no database. HTTP routes are **stateless**: they validate inputs, apply deterministic domain logic, and return envelopes. Durable demo progress lives in the browser.

---

## Layers

| Layer | Location | Responsibility |
|---|---|---|
| Screens | `app/` | Thin route pages for the hero workflow |
| UI | `components/` | Domain-named React components; loading/empty/error states |
| Client state | `state/demo-state.tsx` | Zod-validated `DemoState`; hydration gate; approval/recovery mutations; audit trail |
| API | `app/api/` | Consistent `ApiResponse` envelope; seed previews vs stateful transitions |
| Domain | `domain/` | Schemas, scoring, planning, packing/mission execution, recovery, metrics |
| Seed data | `data/seed/` | Synthetic donors, partners, plans, routes, disruption fixtures |
| Tests | `tests/unit`, `tests/e2e` | Domain unit tests + Playwright primary demo |

### Domain modules

| Module | Role |
|---|---|
| `schemas` | Zod contracts shared by UI, API, and agents |
| `scoring` | Destination scores from named weight config |
| `planning` | Plan set generation, quantity conservation, constraints |
| `execution` | Packing and mission transitions |
| `recovery` | Partner-cancellation replanning and supersession |
| `metrics` | Impact calculations from approved plan/mission data |
| `demo` | Seed wiring and demo helpers |
| `api` | Response helpers and shared API types |
| `dashboard` | Control-tower projections |

Put calculations in domain services, not React components.

---

## Runtime data flow

### Authoritative client state

The browser owns the evolving scenario under `choicegrid-demo-v2`:

```text
stage: initial → plans_generated → approved → disrupted → recovered
```

`DemoState` holds selected/edited plans, approved option, packing plans, missions, partner overrides, disruption, and audit events. The provider fails closed to seed state when persisted JSON fails validation.

### Server routes

Two patterns:

1. **Seed projection** — e.g. `GET /api/map/network`, or packing/mission/impact with `?preview=true`. Always labeled `projection: "seed_preview_not_persisted"`. Does not read browser state.
2. **Transition function** — e.g. approve plan, start packing, complete batch, approve recovery. Caller must pass the current resource body; the handler validates and returns the next state. Idempotent where documented.

In-app **Reset scenario** clears browser state. `npm run demo:check` validates immutable seed readiness from the terminal.

---

## Agent architecture

“Agent” means a **narrow contract**, not autonomous software. Each agent has structured I/O, runtime validation, explicit failure/fallback behavior, and human review where consequences matter.

| Agent | Computation style | May do | Must not do |
|---|---|---|---|
| Intake | LLM-shaped + deterministic validation | Extract stated fields; flag ambiguity; draft questions | Invent addresses/quantities; accept donation; certify safety |
| Capacity | Deterministic | Warehouse/partner/vehicle/window checks | Override human judgment |
| Need-matching | Deterministic | Rank destinations with explainable factors | Hide exclusions or assumptions |
| Planning | Deterministic | Build three complete plans; conserve quantity | Silently approve a plan |
| Routing | Deterministic seeded geometry | Stop sequence from fixtures | Call live routing APIs |
| Recovery | Deterministic | Preserve unaffected work; propose replacement | Dispatch or supersede without approval |
| Communication | Draft-only | Draft donor/partner/driver notices | Send messages |

**Split of authority**

- LLMs (when present): natural-language extraction and explanation
- Code: quantities, capacity, scores, routes, metrics, status transitions

The MVP demo uses a **validated deterministic intake fallback**; no live LLM call is required. Full contracts: [`AI_AGENT_CONTRACTS.md`](AI_AGENT_CONTRACTS.md).

---

## Hero workflow mapping

```text
Donation parse     →  POST /api/donations/parse (+ review UI)
Plan compare       →  POST /api/plans/generate · /plans/[id]
Human approval     →  DemoState + POST /api/plans/:id/approve
Packing            →  PKG-104 in DemoState · packing APIs for transitions
Mission / map      →  MSN-104 · bundled schematic map + precomputed legs
Disruption         →  /simulate partner cancel → recovery plans
Recovery approval  →  PKG-105 / MSN-105 supersede prior mission
Impact             →  calculated metrics + audit history
```

Human approval is mandatory before disposition, plan approval, mission replacement, and outbound communication.

---

## Stack (as implemented)

- Next.js App Router, React, strict TypeScript
- Tailwind CSS, Lucide icons
- Zod runtime schemas
- React context + versioned `localStorage`
- Bundled schematic map (no tile or routing service)
- Vitest / Testing Library / Playwright

Reserved env names exist in `.env.example` for future LLM/map use; the MVP does not require them.

---

## Explicit non-architecture

Out of MVP scope and must not be introduced casually:

- Production database, auth, billing, or CRM
- Live map tiles or live routing as a demo dependency
- LLM as the source of authoritative quantities or food-safety decisions
- Real recipient PII or medical data
- Silent auto-approval or auto-dispatch

---

## Where to go next

| Need | Document |
|---|---|
| Product north star and hero scenario | [`CHOICEGRID_PRODUCT_SPEC.md`](../CHOICEGRID_PRODUCT_SPEC.md) |
| Entities and enums | [`DATA_MODEL.md`](DATA_MODEL.md) |
| Endpoints and `DemoState` | [`API_AND_STATE_CONTRACTS.md`](API_AND_STATE_CONTRACTS.md) |
| Agent I/O and prohibitions | [`AI_AGENT_CONTRACTS.md`](AI_AGENT_CONTRACTS.md) |
| Screens and acceptance | [`SCREEN_SPECIFICATIONS.md`](SCREEN_SPECIFICATIONS.md) |
| Seeded demo numbers | [`DEMO_SCENARIOS.md`](DEMO_SCENARIOS.md) |
| Settled trade-offs | [`DECISIONS.md`](DECISIONS.md) |
