# ChoiceGrid

ChoiceGrid is an AI-assisted food-bank operations prototype for moving at-risk inventory already inside a warehouse, deciding which agencies can realistically take it, and recovering when the plan changes.

The product is designed for food-bank allocation, warehouse, and transportation teams. Inventory facts, agency history, capacity, scoring, routing assumptions, and impact metrics stay deterministic and auditable; an optional model may explain validated facts but is never required.

## Start here

Coding agents should read [`AGENTS.md`](AGENTS.md) first and then [`CHOICEGRID_PRODUCT_SPEC.md`](CHOICEGRID_PRODUCT_SPEC.md). The product spec explains the complete ChoiceGrid workflow and points each agent to the detailed contracts in `docs/`.

---


## Hero scenario

The food bank already has **1,200 pounds of strawberries** at `WH-001`. The lot is not moving fast enough and is approaching a seeded spoilage-risk deadline.

ChoiceGrid:

1. Reviews the existing lot, available pounds, risk deadline, refrigeration, and staff condition status.
2. Checks warehouse capacity, partner demand, receiving windows, assigned execution capacity, service gaps, and category-specific acceptance/refusal history.
3. Compares Hold for Later, Fastest Agency Release, and Balanced Release.
4. Lets a staff member approve or edit one plan.
5. Creates packing or cross-dock instructions and a route beginning at `WH-001`, with no donor pickup.
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

The demo requires no production database, live routing service, map-tile service, communications service, or live LLM call. Venice and Vapi experiments cannot block or alter the seeded workflow and are excluded from the judged hero.

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

No environment variable is required for the current MVP. To enable optional model explanations or isolated transport experiments, copy `.env.example` to `.env.local` and use newly generated server-side keys:

```text
LLM_PROVIDER=venice
LLM_BASE_URL=https://api.venice.ai/api/v1
LLM_API_KEY=
LLM_MODEL=openai-gpt-4o-mini-2024-07-18
LLM_BACKUP_MODEL=minimax-m25
LLM_TIMEOUT_MS=12000
NEXT_PUBLIC_DEMO_MODE=true
NEXT_PUBLIC_MAP_TILE_URL=
VAPI_API_KEY=
VAPI_ASSISTANT_ID=
VAPI_PHONE_NUMBER_ID=
VAPI_TEST_TO_NUMBER=
VAPI_TEST_CALLS_ENABLED=false
```

`LLM_API_KEY` is server-only and must never use a `NEXT_PUBLIC_` prefix. Optional model output may explain validated inventory facts but cannot create authoritative pounds, risk deadlines, acceptance rates, routes, or safety decisions. The hero uses deterministic fallback behavior when configuration is absent or attempts fail. Vapi remains disabled by default, excluded from primary navigation, and never changes operational state. The map always uses bundled local rendering.

---

## Core routes

| Route | Purpose |
|---|---|
| `/` | Redirect to `/dashboard` |
| `/dashboard` | Operations control tower |
| `/inventory` | List the seeded active lot plus display-only synthetic history |
| `/inventory/[id]` | Review existing lot, risk, warehouse, and condition details |
| `/plans` | Redirect to seeded plan set `PLN-104` |
| `/plans/[id]` | Compare and approve plans |
| `/map` | View demand, capacity, vehicles, and routes with functional layer toggles |
| `/packing/[id]` | Review created packing or cross-dock instructions (`PKG-104` after plan approval; `PKG-105` after recovery approval) |
| `/missions` | Redirect to active mission `MSN-104`, or `MSN-105` after recovery |
| `/missions/[id]` | Track the approved mission |
| `/simulate` | Trigger the executable partner-cancellation fixture; other controls are disabled previews |
| `/impact` | Review calculated results and audit history |
| `/partners/[id]` | Inspect a partner agency profile |
| `/communications` | Isolated communication experiment; not part of primary navigation or judged workflow |

Unknown dynamic IDs render the intentional shared not-found state. Only partner and partner-program destinations link to `/partners/[id]`.

---

## Implemented API routes

```text
GET  /api/inventory/:id

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

POST /api/communications/test
GET  /api/communications/status/:id

GET  /api/impact/:missionId
POST /api/demo/reset
```

All routes use the shared response envelope documented in `docs/API_AND_STATE_CONTRACTS.md`. The evolving workflow lives in validated browser demo state: `GET /api/packing/:id`, `GET /api/missions/:id`, and `GET /api/impact/:missionId` require `?preview=true` and return a labeled, non-persisted seed projection; without it they return `409 STATE_REQUIRED`. `GET /api/map/network` is also labeled as a non-persisted seed projection. Stateful actions require current resources and do not persist browser state. Plan payloads may edit canonical allocation quantities only; submitted identities and metrics are not authoritative.

---

## Repository structure

```text
app/
├── dashboard/
├── inventory/
├── plans/
├── map/
├── packing/
├── missions/
├── simulate/
├── impact/
├── partners/
└── api/

components/
├── inventory/
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
- `PILOT_VALIDATION_PLAN.md`
- `SUBMISSION_READINESS_CHECKLIST.md`

Background research is in:

- `docs/RESEARCH_INSIGHTS.md`
- `research/food_bank_hackathon_research_summary.md`
- `research/validation/EVIDENCE_REGISTER.md` — intentionally starts at zero until completed, consented operator validation exists

---

## MVP completion standard

The MVP is ready when a presenter can complete the primary strawberry scenario from dashboard through impact without editing data manually or opening developer tools.

The following must genuinely work:

- Existing inventory-lot validation and deterministic fallback explanation
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
- Category-specific agency acceptance/refusal evidence with sample size
- Warehouse-origin mission with no donor pickup

See `docs/TEST_AND_ACCEPTANCE_PLAN.md` for the full checklist.
