# ChoiceGrid

ChoiceGrid is an AI-assisted food-bank operations prototype for deciding where urgent food should go, how it should be packed, and how to recover when the plan changes.

The product is designed for food-bank allocation, warehouse, and transportation teams. It uses AI for natural-language interpretation and explanations while keeping quantities, capacity, scoring, routing assumptions, and impact metrics deterministic and auditable.

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
6. Replans when a pantry cancels or a truck becomes unavailable.
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

## Proposed technical stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui or equivalent reusable components
- React Leaflet
- Zod
- Zustand or equivalent lightweight state management
- Local fixture repository for demo data
- Optional server-side LLM integration for structured extraction and explanations
- Vitest, Testing Library, and Playwright

The hackathon demo must remain usable without a live routing service or production database.

---

## Expected quick start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Then open:

```text
http://localhost:3000/dashboard
```

Expected validation commands:

```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

Reset the seeded demo:

```bash
npm run demo:reset
```

These commands are the intended contract. Update this file if repository initialization chooses different names.

---

## Environment variables

A minimal `.env.example` should document optional values such as:

```text
LLM_API_KEY=
LLM_MODEL=
NEXT_PUBLIC_DEMO_MODE=true
NEXT_PUBLIC_MAP_TILE_URL=
```

The demo should degrade gracefully when `LLM_API_KEY` is absent by using deterministic seeded extraction results.

---

## Core routes

| Route | Purpose |
|---|---|
| `/dashboard` | Operations control tower |
| `/donations/new` | Enter or paste a donation offer |
| `/donations/[id]` | Review extracted donation details |
| `/plans/[id]` | Compare and approve plans |
| `/map` | View demand, capacity, and routes |
| `/packing/[id]` | Review packing or cross-dock instructions |
| `/missions/[id]` | Track the approved mission |
| `/simulate` | Trigger a controlled disruption |
| `/impact` | Review calculated results and audit history |
| `/partners/[id]` | Inspect a partner agency profile |

---

## Suggested repository structure

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
├── layout/
├── dashboard/
├── plans/
├── map/
├── packing/
├── missions/
└── shared/

domain/
├── schemas/
├── scoring/
├── planning/
├── routing/
├── metrics/
└── repositories/

agents/
├── intake/
├── capacity/
├── matching/
├── planning/
├── recovery/
└── communication/

data/
├── seed/
└── fixtures/

tests/
├── unit/
├── integration/
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
- One disruption and replan
- Calculated impact metrics
- Audit trail

See `docs/TEST_AND_ACCEPTANCE_PLAN.md` for the full checklist.
