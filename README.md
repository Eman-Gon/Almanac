# ChoiceGrid

ChoiceGrid is an AI-assisted food-bank operations prototype for deciding where urgent food should go, how it should be packed, and how to recover when the plan changes.

The product is designed for food-bank allocation, warehouse, and transportation teams. The current build can use Venice for validated natural-language extraction and retains a deterministic extraction fallback, while keeping capacity, scoring, routing assumptions, and impact metrics deterministic and auditable.

## Start here

Coding agents should read [`AGENTS.md`](AGENTS.md) first and then [`CHOICEGRID_PRODUCT_SPEC.md`](CHOICEGRID_PRODUCT_SPEC.md). The product spec explains the complete ChoiceGrid workflow and points each agent to the detailed contracts in `docs/`.

---


## Hero scenario

A grocery store offers **1,200 pounds of strawberries** that must be collected within two hours.

ChoiceGrid:

1. Parses the donor message.
2. Checks shelf-life urgency, warehouse cold capacity, partner demand, receiving windows, available vehicles, and recent service gaps.
3. Compares three distribution plans.
4. Lets a staff member approve or edit one plan.
5. Creates packing or cross-dock instructions and a route map.
6. Replans when a partner cancels; additional disruption concepts are disabled previews.
7. Calculates the scenario's operational and community impact.

---

## Product principles

- Help workers make better decisions; do not attempt to replace them.
- Require human approval before operational action.
- Prefer transparent deterministic calculations over opaque AI claims.
- Use synthetic and aggregate data only.
- Treat food condition and shelf life as advisory risk signals, not safety certification.
- Show efficiency and fairness separately.
- Label all demo estimates and simulated data clearly.

---

## Implemented technical stack

- Next.js 16 App Router and React 19
- Strict TypeScript 5.9
- Tailwind CSS 4 with repository-owned reusable components
- Lucide icons
- Zod 4 runtime schemas
- React context plus versioned browser `localStorage` for durable demo state
- Local deterministic fixtures and domain services
- Bundled schematic map and precomputed route geometry
- Vitest, Testing Library, and Playwright

The demo requires no production database, live routing service, map-tile service, or live LLM call. A Venice call is optional and cannot block the seeded workflow.

---

## Quick start

```bash
npm install
npm run dev
```

Then open:

```text
http://localhost:3000/dashboard
```

Validation commands:

```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
npm run demo:reset
```

The final command reports immutable seed readiness; it cannot clear a browser's `localStorage`. Use **Reset scenario** in the app to clear browser demo state and return to `/dashboard`.

After `npm run build`, use `npm run start` to serve the production build. `npm run test:watch` starts Vitest in watch mode.

---

## Environment variables

No environment variable is required for the current MVP. To enable optional Venice extraction, copy `.env.example` to `.env.local` and set a newly generated server-side key:

```text
LLM_PROVIDER=venice
LLM_BASE_URL=https://api.venice.ai/api/v1
LLM_API_KEY=
LLM_MODEL=mistral-small-3-2-24b-instruct
LLM_BACKUP_MODEL=qwen3-235b-a22b-instruct-2507
LLM_TIMEOUT_MS=8000
NEXT_PUBLIC_DEMO_MODE=true
NEXT_PUBLIC_MAP_TILE_URL=
```

`LLM_API_KEY` is read only in the server route and must never use a `NEXT_PUBLIC_` prefix. `VENICE_API_KEY` and `VENICE_BASE_URL` remain supported as aliases. The primary model is attempted first; `LLM_BACKUP_MODEL` is attempted after a timeout, provider error, invalid structured output, or missing required facts. At most two model calls are made, and each response is capped at 1,000 tokens. The response records the selected source, model, attempted models, and failover warnings. If configuration is absent or both models fail, the exact seeded hero offer uses the validated deterministic fallback. Unrelated offers fail safely instead of inheriting synthetic strawberry facts. The map always uses bundled local rendering.

---

## Core routes

| Route | Purpose |
|---|---|
| `/` | Redirect to `/dashboard` |
| `/dashboard` | Operations control tower |
| `/donations` | List the seeded active offer |
| `/donations/new` | Enter or paste a donation offer |
| `/donations/[id]` | Review extracted donation details |
| `/plans` | Redirect to seeded plan set `PLN-104` |
| `/plans/[id]` | Compare and approve plans |
| `/map` | View demand, capacity, vehicles, and routes with functional layer toggles |
| `/packing/[id]` | Review created packing or cross-dock instructions (`PKG-104` after plan approval; `PKG-105` after recovery approval) |
| `/missions` | Redirect to active mission `MSN-104`, or `MSN-105` after recovery |
| `/missions/[id]` | Track the approved mission |
| `/simulate` | Trigger the executable partner-cancellation fixture; other controls are disabled previews |
| `/impact` | Review calculated results and audit history |
| `/partners/[id]` | Inspect a partner agency profile |

Unknown dynamic IDs render the intentional shared not-found state. Only partner and partner-program destinations link to `/partners/[id]`.

---

## Implemented API routes

```text
POST /api/donations/parse
GET  /api/donations/:id

POST /api/plans/generate
GET  /api/plans/:id
POST /api/plans/:id/approve

GET  /api/partners
GET  /api/partners/:id
GET  /api/map/network

GET  /api/packing/:id
POST /api/packing/:id/start
POST /api/packing/:id/complete

GET  /api/missions/:id
POST /api/missions/:id/events
POST /api/missions/:id/disruptions
POST /api/disruptions/:id/approve-recovery

GET  /api/impact/:missionId
POST /api/demo/reset
```

All routes use the shared response envelope documented in `docs/API_AND_STATE_CONTRACTS.md`. The evolving workflow lives in validated browser demo state: `GET /api/packing/:id`, `GET /api/missions/:id`, and `GET /api/impact/:missionId` require `?preview=true` and return a labeled, non-persisted seed projection; without it they return `409 STATE_REQUIRED`. `GET /api/map/network` is also labeled as a non-persisted seed projection. Stateful actions require current resources and do not persist browser state. Plan payloads may edit canonical allocation quantities only; submitted identities and metrics are not authoritative.

---

## Repository structure

```text
app/
├── dashboard/
├── donations/
├── plans/
├── map/
├── packing/
├── missions/
├── simulate/
├── impact/
├── partners/
└── api/

components/
├── donations/
├── execution/
├── layout/
├── partners/
├── plans/
└── shared/

domain/
├── api/
├── dashboard/
├── demo/
├── execution/
├── metrics/
├── planning/
├── recovery/
├── schemas/
└── scoring/

data/
└── seed/

state/
scripts/

tests/
├── unit/
└── e2e/
```

---

## Documentation map

Start with:

- `AGENTS.md`
- `docs/SCOPE_AND_NON_GOALS.md`
- `docs/USER_FLOWS.md`
- `docs/DATA_MODEL.md`
- `docs/API_AND_STATE_CONTRACTS.md`
- `docs/AI_AGENT_CONTRACTS.md`
- `docs/DEMO_SCENARIOS.md`

Presentation support:

- `DEMO_SCRIPT.md`
- `PITCH_DECK_OUTLINE.md`
- `BACKUP_DEMO_VIDEO.md`
- `FOOD_BANK_INTERVIEW.md`

Background research is in:

- `docs/RESEARCH_INSIGHTS.md`
- `research/food_bank_hackathon_research_summary.md`

---

## MVP completion standard

The MVP is ready when a presenter can complete the primary strawberry scenario from dashboard through impact without editing data manually or opening developer tools.

The following must genuinely work:

- Structured donation extraction or deterministic fallback
- Plan calculations
- Human approval
- Quantity conservation
- Map markers and route display
- Packing-plan generation
- Persistent per-batch packing completion
- One partner-cancellation disruption and human-approved replan
- Canceled partner and stop state plus mission supersession
- Calculated impact metrics
- Audit trail

See `docs/TEST_AND_ACCEPTANCE_PLAN.md` for the full checklist.
