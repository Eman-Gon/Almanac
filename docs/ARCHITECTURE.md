# Architecture

Short overview of how Almanac is structured in this repository. Detailed contracts remain authoritative; when this file and a contract disagree, follow the source-of-truth order in [`AGENTS.md`](../AGENTS.md).

---

## Intent

Almanac is a **hackathon control-tower prototype**, not a production platform. The architecture optimizes for:

1. A runnable warehouse inventory-release → plan → approve → pack → disrupt → recover → impact demo
2. Deterministic, testable operational math
3. Mandatory human approval before consequential action
4. Zero dependency on live databases, map tiles, routing APIs, or LLM calls for the judged hero

---

## System shape

```text
┌─────────────────────────────────────────────────────────────┐
│  Clients                                                    │
│  Browser (desktop/phone)  ·  Expo Go WebView (mobile/)      │
│  Same Next.js UI · DemoState in WebView/browser localStorage│
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS (hosted) or LAN (dev)
┌───────────────────────────▼─────────────────────────────────┐
│  Next.js App Router (hosted e.g. on Vercel)                 │
│  app/* screens · components/* · state/demo-state.tsx        │
│  DemoState key: choicegrid-demo-v3                          │
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

There is no server-side session store and no database. HTTP routes are **stateless**: they validate inputs, apply deterministic domain logic, and return envelopes. Durable demo progress lives in the browser or Expo WebView.

The Expo companion is a **native shell** over the hosted web app. It does not reimplement plans, map, or packing in React Native, and it is not a separate ops backend. See [`mobile/README.md`](../mobile/README.md) and [`DEPLOY.md`](DEPLOY.md).

---

## Layers

| Layer | Location | Responsibility |
|---|---|---|
| Screens | `app/` | Thin route pages for the hero workflow |
| UI | `components/` | Domain-named React components; loading/empty/error states |
| Client state | `state/demo-state.tsx` | Zod-validated `DemoState`; hydration gate; approval/recovery mutations; audit trail |
| Mobile shell | `mobile/` | Expo Go WebView + URL settings over the hosted app |
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

The browser (or Expo WebView) owns the evolving scenario under `choicegrid-demo-v3`:

```text
stage: initial → plans_generated → approved → disrupted → recovered
```

`DemoState` holds selected/edited plans, approved option, packing plans, missions, partner overrides, disruption, and audit events. The provider fails closed to seed state when persisted JSON fails validation. State does **not** sync across devices or users.

### Server routes

Two patterns:

1. **Seed projection** — e.g. `GET /api/map/network`, or packing/mission/impact with `?preview=true`. Always labeled `projection: "seed_preview_not_persisted"`. Does not read browser state.
2. **Transition function** — e.g. approve plan, start packing, complete batch, approve recovery. Caller must pass the current resource body; the handler validates and returns the next state. Idempotent where documented.

In-app **Reset scenario** clears browser/WebView state. `npm run demo:check` validates immutable seed readiness from the terminal.

---

## Agent architecture

“Agent” means a **narrow contract**, not autonomous software. Each agent has structured I/O, runtime validation, explicit failure/fallback behavior, and human review where consequences matter.

| Agent | Computation style | May do | Must not do |
|---|---|---|---|
| Intake | LLM-shaped + deterministic validation | Explain/normalize validated facts; flag ambiguity | Invent quantities; accept inventory disposition; certify safety |
| Capacity | Deterministic | Warehouse/partner/vehicle/window checks | Override human judgment |
| Need-matching | Deterministic | Rank destinations with explainable factors | Hide exclusions or assumptions |
| Planning | Deterministic | Build three complete plans; conserve quantity | Silently approve a plan |
| Routing | Deterministic seeded geometry | Stop sequence from fixtures | Call live routing APIs |
| Recovery | Deterministic | Preserve unaffected work; propose replacement | Dispatch or supersede without approval |
| Communication | Draft-only / isolated experiment | Draft notices when enabled | Send messages in the judged hero |

**Split of authority**

- LLMs (when present): natural-language explanation of validated facts
- Code: quantities, capacity, scores, routes, metrics, status transitions

The MVP demo uses deterministic fallbacks; no live LLM call is required. Full contracts: [`AI_AGENT_CONTRACTS.md`](AI_AGENT_CONTRACTS.md).

---

## Hero workflow mapping

```text
Inventory review   →  /inventory/[id] · GET /api/inventory/:id
Plan compare       →  POST /api/plans/generate · /plans/[id]
Human approval     →  DemoState + POST /api/plans/:id/approve
Packing            →  PKG-104 in DemoState · packing APIs for transitions
Mission / map      →  MSN-104 · bundled schematic map + precomputed legs
Disruption         →  /simulate partner cancel → recovery plans
Recovery approval  →  PKG-105 / MSN-105 supersede prior mission
Impact             →  calculated metrics + audit history
```

Human approval is mandatory before plan approval, mission replacement, and outbound communication.

---

## Stack (as implemented)

- Next.js App Router, React, strict TypeScript
- Tailwind CSS, Lucide icons
- Zod runtime schemas
- React context + versioned `localStorage`
- Bundled schematic map (no tile or routing service)
- Optional Vercel hosting ([`DEPLOY.md`](DEPLOY.md))
- Expo Go WebView companion (`mobile/`)
- Vitest / Testing Library / Playwright

Reserved env names exist in `.env.example` for optional LLM/Vapi; the MVP does not require them.

---

## Explicit non-architecture

Out of MVP scope and must not be introduced casually:

- Production database, auth, billing, or CRM
- Multi-tenant shared demo state
- Full React Native reimplementation of the control tower
- Live map tiles or live routing as a demo dependency
- LLM as the source of authoritative quantities or food-safety decisions
- Real recipient PII or medical data
- Silent auto-approval or auto-dispatch

---

## Where to go next

| Need | Document |
|---|---|
| Product north star and hero scenario | [`ALMANAC_PRODUCT_SPEC.md`](../ALMANAC_PRODUCT_SPEC.md) |
| Hosted deploy | [`DEPLOY.md`](DEPLOY.md) |
| Expo Go companion | [`mobile/README.md`](../mobile/README.md) |
| Entities and enums | [`DATA_MODEL.md`](DATA_MODEL.md) |
| Endpoints and `DemoState` | [`API_AND_STATE_CONTRACTS.md`](API_AND_STATE_CONTRACTS.md) |
| Agent I/O and prohibitions | [`AI_AGENT_CONTRACTS.md`](AI_AGENT_CONTRACTS.md) |
| Screens and acceptance | [`SCREEN_SPECIFICATIONS.md`](SCREEN_SPECIFICATIONS.md) |
| Seeded demo numbers | [`DEMO_SCENARIOS.md`](DEMO_SCENARIOS.md) |
| Settled trade-offs | [`DECISIONS.md`](DECISIONS.md) |
