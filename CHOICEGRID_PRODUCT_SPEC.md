# ChoiceGrid Product Specification and Coding Brief

**Status:** Approved hackathon direction  
**Audience:** Coding agents, designers, QA agents, technical leads, and presentation agents  
**Product type:** AI-assisted food-bank supply-chain decision and disruption-recovery prototype  
**Primary scenario:** At-risk warehouse inventory allocation
**Data:** Synthetic demo data only  
**Last updated:** July 16, 2026

---

## 1. How coding agents should use this file

This is the single product-level starting document for **ChoiceGrid**. It explains what the product is, why it exists, the workflow that must be built, and how the complete demo should behave.

It does **not** replace the detailed Markdown files already provided in the ChoiceGrid documentation pack.

Before changing code:

1. Read [`AGENTS.md`](AGENTS.md).
2. Read this file.
3. Read the companion documents relevant to the task.
4. Follow the source-of-truth hierarchy in `AGENTS.md`.
5. Do not invent behavior that conflicts with approved contracts.

When this file summarizes a topic and a detailed companion contract is more specific, follow the detailed contract.

---

## 2. Companion Markdown files already provided

### Root files

| File | Purpose |
|---|---|
| [`AGENTS.md`](AGENTS.md) | Mandatory coding-agent rules, source priority, tests, coding standards, and prohibited changes |
| [`README.md`](README.md) | Stack, setup, commands, routes, environment variables, and local run instructions |
| `CHOICEGRID_PRODUCT_SPEC.md` | This product north star and coding brief |
| [`DEMO_SCRIPT.md`](DEMO_SCRIPT.md) | Three-to-five-minute walkthrough, backup paths, and 90-second cut |
| [`PITCH_DECK_OUTLINE.md`](PITCH_DECK_OUTLINE.md) | Evidence-safe slide outline and speaker notes |
| [`BACKUP_DEMO_VIDEO.md`](BACKUP_DEMO_VIDEO.md) | Two-to-four-minute recording plan and shot list |
| [`FOOD_BANK_INTERVIEW.md`](FOOD_BANK_INTERVIEW.md) | Operator discovery and observed-usability protocol; no interview is claimed |
| [`PILOT_VALIDATION_PLAN.md`](PILOT_VALIDATION_PLAN.md) | Staged path from synthetic usability testing to historical replay and non-authoritative shadow evaluation |
| [`SUBMISSION_READINESS_CHECKLIST.md`](SUBMISSION_READINESS_CHECKLIST.md) | Evidence-safe hackathon submission gate and open-criteria tracker |

### Context, research, and governance

| File | Purpose |
|---|---|
| [`docs/HACKATHON_CONTEXT.md`](docs/HACKATHON_CONTEXT.md) | Official challenge prompt and success expectations |
| [`docs/RESEARCH_INSIGHTS.md`](docs/RESEARCH_INSIGHTS.md) | Concise implementation-focused research findings |
| [`docs/SOURCE_INDEX.md`](docs/SOURCE_INDEX.md) | Source priority and evidence-labeling rules |
| [`docs/DOMAIN_GLOSSARY.md`](docs/DOMAIN_GLOSSARY.md) | Food-bank and supply-chain terminology |
| [`docs/PRIVACY_AND_SAFETY.md`](docs/PRIVACY_AND_SAFETY.md) | Privacy, food-safety, dietary, fairness, and approval guardrails |
| [`docs/METRICS_AND_EVIDENCE.md`](docs/METRICS_AND_EVIDENCE.md) | Metric formulas, assumptions, and permitted claims |

### Product and technical contracts

| File | Purpose |
|---|---|
| [`docs/SCOPE_AND_NON_GOALS.md`](docs/SCOPE_AND_NON_GOALS.md) | MVP boundary, stretch scope, and explicit exclusions |
| [`docs/USER_FLOWS.md`](docs/USER_FLOWS.md) | Primary workflow, alternate paths, approval points, and disruptions |
| [`docs/SCREEN_SPECIFICATIONS.md`](docs/SCREEN_SPECIFICATIONS.md) | Route-by-route UI requirements and acceptance criteria |
| [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) | Visual rules, components, statuses, map semantics, and accessibility |
| [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md) | Shared entities, fields, identifiers, enums, and relationships |
| [`docs/AI_AGENT_CONTRACTS.md`](docs/AI_AGENT_CONTRACTS.md) | Narrow agent responsibilities, inputs, outputs, fallbacks, and prohibited behavior |
| [`docs/API_AND_STATE_CONTRACTS.md`](docs/API_AND_STATE_CONTRACTS.md) | Endpoints, schemas, state transitions, errors, and idempotency |
| [`docs/DEMO_SCENARIOS.md`](docs/DEMO_SCENARIOS.md) | Exact seeded scenario, disruption behavior, target metrics, and reset |
| [`docs/TEST_AND_ACCEPTANCE_PLAN.md`](docs/TEST_AND_ACCEPTANCE_PLAN.md) | Required unit, integration, accessibility, and end-to-end checks |
| [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md) | Build order, milestones, dependencies, and parallel work |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | Accepted decisions that should not be reopened casually |

### Full research appendix

| File | Purpose |
|---|---|
| [`research/food_bank_hackathon_research_summary.md`](research/food_bank_hackathon_research_summary.md) | Full research report, analytics, competitor review, product opportunities, and sources |
| [`research/validation/EVIDENCE_REGISTER.md`](research/validation/EVIDENCE_REGISTER.md) | De-identified register for completed interviews, observed usability, pilot commitments, and case evidence; initialized at zero |

---

## 3. Product in one sentence

> **ChoiceGrid helps food-bank staff move at-risk inventory already inside the warehouse before it spoils, using current agency constraints and historical acceptance to compare outbound plans, then replans when conditions change.**

### Tagline

> **When food or plans change, every usable pound still finds a destination.**

---

## 4. What ChoiceGrid is—and is not

### ChoiceGrid is

- A food-bank operations decision tool
- A human-approved AI-agent workflow
- An at-risk warehouse-inventory allocation planner
- A demand and capacity map
- A packing and cross-dock planner
- A delivery mission planner
- A disruption-recovery tool
- An explainable plan-comparison experience
- A calculated impact and audit view

### ChoiceGrid is not

- A generic chatbot
- A recipe generator
- A public pantry locator
- A client case-management system
- A full warehouse-management system
- A production routing platform
- A food-safety authority
- An autonomous dispatcher
- A donor-pickup or driver-scheduling product
- A repository of real recipient medical data

---

## 5. Why this idea is supported by the research

The research considered:

- **12 relevant subreddits**
- **30 newly reviewed Reddit thread pages**
- **2 complete Reddit thread exports**
- **32 Reddit thread pages total**
- Approximately **500 comments and replies considered**
- **269 items systematically parsed and coded**
- **20 formal articles, reports, and research papers**
- **6 existing food-bank technology products**

Only the 269-item parsed subset supports exact repetition counts.

### Exact repeated themes in the coded subset

| Theme | Mentions |
|---|---:|
| Repetitive, unbalanced, or insufficiently varied food | **59** |
| Storage, warehouse, funding, labor, or volunteer constraints | **42** |
| Fresh-food quality, spoilage, mold, or expiration | **42** |
| Shame, stigma, or eligibility confusion | **30** |
| Recipes, cooking knowledge, spices, or cultural fit | **27** |
| Client choice versus prepacked boxes | **23** |
| Allergies, dietary restrictions, or medical-food needs | **19** |
| Missing ingredients needed to create a complete meal | **16** |
| Toiletries and other non-food needs | **15** |
| Hours, transportation, delivery, or geographic access | **9** |
| Cooking-equipment or home-storage limitations | **9** |

One item may match several themes.

### Main product insight

The repeated problem is not merely a lack of food. Existing warehouse inventory must also be:

- Moved before it spoils
- Compatible with cold-storage capacity
- Compatible with partner receiving windows
- Appropriate for the destination or program
- Usable by the community
- Packed in an operationally realistic way
- Delivered through a feasible route
- Reallocated when circumstances change

ChoiceGrid connects these concerns after receiving, when staff are already sitting on inventory that must move. The authoritative hackathon direction is to avoid making upstream donor scheduling and pickup the product bottleneck.

---

## 6. Official hackathon fit

The official prompt asks teams to use AI agents to improve food-bank supply chains involving:

- Donation acceptance
- Purchasing
- Warehousing
- Allocation
- Packing
- Distribution
- Delivery

ChoiceGrid directly demonstrates:

- Existing-inventory risk triage
- Shelf-life urgency after warehouse receiving
- Cold-capacity checks
- Partner allocation
- Packing and cross-docking
- Route creation
- Disruption recovery
- Community-demand matching
- Human decision support

The challenge materials emphasize that technology should make workers better at their jobs rather than replace them. Human approval is therefore mandatory before consequential actions.

---

## 7. Primary users

The MVP may use one `demo_user`, but the experience should preserve these role labels.

### Operations manager

- Reviews urgent alerts
- Compares plans
- Understands assumptions and risks
- Approves or overrides recommendations
- Reviews impact

### Inventory coordinator

- Reviews existing on-hand lots
- Confirms quantity, risk deadline, temperature, and condition status
- Resolves missing operational information
- Initiates planning

### Warehouse lead

- Reviews cold capacity
- Reviews packing and staging instructions
- Verifies quantities and handling requirements

### Dispatcher

- Reviews the assigned execution fixture, receiving windows, and route
- Handles disruptions

### Partner-agency coordinator

- Maintains agency capacity and availability
- Reviews demand, product fit, and category-specific acceptance/refusal history

---

## 8. Product principles

### 8.1 Human approval

Agents may:

- Extract
- Rank
- Recommend
- Explain
- Draft
- Simulate
- Replan

Agents may not silently:

- Accept or decline donations
- Certify food as safe
- Dispatch vehicles
- Contact partners
- Change approved allocations
- Use real recipient medical records

### 8.2 Deterministic operations

Use an LLM for:

- Natural-language extraction
- Follow-up questions
- Plain-language explanations
- Draft communications
- Note categorization

Use deterministic code for:

- Unit conversion
- Capacity checks
- Quantity allocation
- Time-window validation
- Destination scores
- Plan metrics
- Route distances used in the demo
- Impact calculations
- State transitions

### 8.3 Explainability

Every recommendation should expose:

- Positive factors
- Penalties
- Capacity constraints
- Time constraints
- Assumptions
- Missing information
- Excluded destinations
- Alternatives
- Confidence or fallback status

### 8.4 Data minimization

Use only:

- Synthetic donors
- Synthetic partners
- Synthetic vehicles and drivers
- Aggregate demand profiles
- Non-identifying usability tags
- Seeded operational notes

### 8.5 Honest metrics

Clearly distinguish:

- Official challenge facts
- Exact coded research
- Qualitative research
- External research
- Synthetic inputs
- Calculated demo metrics
- Team assumptions

---

## 9. Hero scenario

### Scenario ID

```text
SCN-STRAWBERRY-001
```

### Starting inventory alert

```text
LOT-104 · Strawberries · 1,200 lb available at WH-001
Refrigerated · staff condition review recorded · high spoilage risk
Allocate before the seeded risk deadline.
```

### Seeded facts

- Inventory lot: `LOT-104`, already received at `WH-001`
- Product: strawberries
- Available quantity: **1,200 lb**
- Temperature: refrigerated
- Received time: seeded warehouse timestamp
- Modeled risk deadline: **36 hours after the seeded inventory alert**
- Condition status: staff-cleared for planning; **60 lb** remains a supervisor inspection hold
- Long-term warehouse refrigerated-storage headroom: **420 lb**
- Separate refrigerated short-dwell staging capacity: **500 lb**
- Refrigerated vehicle capacity: **1,400 lb**
- Two high-demand partners can receive today
- One high-need partner has limited cold capacity
- One meal-kit program has **500 lb** compatible capacity and confirmed demand for **460 lb**; the primary plan stages **400 lb** and reserves **60 lb** of that demand for recovery flexibility
- **60 lb** is reserved for supervisor inspection hold in long-term refrigerated storage and modeled as expected handling loss in impact calculations

All values are synthetic.

---

## 10. Required plan alternatives

### Option A — Hold for Later

- Attempt to keep most or all food in long-term warehouse storage
- Surface the cold-capacity conflict
- Show lower coordination complexity
- Show higher modeled spoilage or handling risk
- Mark the option warning or partially infeasible when appropriate
- Use **0 outbound miles** because the blocked option creates no mission

### Option B — Fastest Agency Release

- Send most food directly to partner agencies
- Use less warehouse capacity
- Increase route miles and receiving-window sensitivity
- Show stronger immediate access
- Use the seeded 45.7-mile direct route template

### Option C — Balanced Release

Recommended seeded plan:

| Destination or handling path | Quantity |
|---|---:|
| Partner A | **420 lb** |
| Partner B | **320 lb** |
| Meal-kit program through refrigerated staging | **400 lb** |
| Inspection hold or modeled handling loss | **60 lb** |
| **Total** | **1,200 lb** |

Balanced Release should be recommended because it balances urgency, cold capacity, demand, receiving feasibility, route feasibility, service gaps, and historical acceptance/refusal evidence.

Its seeded route template totals **24.8 miles**.

---

## 11. Primary disruption

### Event

Partner B cancels after approval because receiving staff are unavailable.

### Affected quantity

```text
320 lb
```

### Required behavior

1. Mark Partner B canceled.
2. Identify affected allocations and route stops.
3. Preserve unaffected or completed work.
4. Generate recovery alternatives.
5. Recalculate capacity, quantity, route, miles, windows, impact, and risk.
6. Require human approval.
7. Create replacement packing plan `PKG-105` and replacement mission `MSN-105`.
8. Preserve completed route stops only when location and quantities still match.
9. In `PKG-105`, separate already-packed quantity from any pending recovery-only delta using non-colliding batch IDs.
10. Preserve `PKG-104` as read-only history and mark the old mission `superseded`.

### Seeded recovery

A valid fixture:

- Sends **260 lb** to an alternate compatible partner
- Adds **60 lb** to the Community Kitchen meal-kit staging allocation, increasing it from **400 lb** to **460 lb** within its **500 lb** compatible capacity and confirmed **460 lb** demand
- Keeps the original **60 lb** supervisor inspection hold in long-term refrigerated storage

The replacement must satisfy capacity, temperature, time-window, and quantity-conservation rules.

---

## 12. Required MVP capabilities

### 12.1 Dashboard

Show:

- At-risk inventory alert
- Pounds at high expiration risk
- Long-term cold-storage and refrigerated-staging utilization
- Active missions
- Partner shortage indicators
- Short shift-start briefing

### 12.2 Inventory-lot review

Support:

- Loading `LOT-104` from existing warehouse inventory
- Available quantity, received time, risk deadline, temperature, location, and condition status
- Explicit missing or low-confidence operational facts
- Manual staff confirmation and audit history
- Deterministic risk facts and fallback explanation when no LLM is configured

### 12.3 Plan generation

Support:

- Capacity assessment
- Partner ranking
- Category-specific historical acceptance/refusal evidence with sample size
- Three complete alternatives
- Quantity conservation
- Temperature compatibility
- Time-window feasibility
- Transparent metrics
- Excluded-destination reasons

### 12.4 Human approval

Support:

- Plan selection
- Validated quantity edits
- Approver identity
- Optional reason
- Audit event
- Idempotent approval

Edits may change allocation quantities only. Rebuild identities and allocation metadata from the canonical option; recalculate planned outbound pounds, modeled household-equivalents, storage, and staging utilization, then rerun hard constraints. Route miles, expected spoilage, staff minutes, need-match, equity, and refusal risk remain labeled seeded strategy estimates.

### 12.5 Packing and cross-dock plan

Show:

- Product lot
- Destination
- Quantity
- Handling type
- Priority
- Staging location
- Refrigeration requirement
- Completion status

Plan approval creates `PKG-104` with `BAT-001`-series rows. Recovery creates `PKG-105` with `BAT-101`-series rows. If completed work grows at the same destination and staging location, show the completed amount as `-C` and the recovery-only delta as pending `-R`; keep `PKG-104` read-only.

### 12.6 Map and mission

Show:

- Warehouse
- Partner agencies
- Vehicle
- Candidate or approved route
- Demand
- Compatible cold capacity
- Receiving windows
- Partner status
- Historical acceptance context with sample size
- Accessible synchronized location list

### 12.7 Disruption recovery

The executable MVP fixture is partner cancellation. Refrigerated truck breakdown and other disruption concepts are shown only as disabled previews.

Recovery must reuse real domain logic rather than switch to an unrelated hard-coded page.

Recovery approval must create both replacement warehouse instructions and a replacement mission. Changed, canceled, and newly added batches begin `pending`; unchanged matching batches may preserve prior completion.

### 12.8 Impact and audit

Calculate:

- Pounds planned outbound before the risk deadline
- Inspection hold or modeled loss
- Modeled household-equivalents
- Total miles
- Staff minutes
- Long-term cold-storage and refrigerated-staging utilization
- Modeled spoilage avoidance
- Approvals and overrides
- Disruption and recovery events

---

## 13. Explicit non-goals

Do not build:

- New-donation intake or donor pickup as the hero workflow
- Donor, driver, or partner scheduling
- Live Vapi outreach in the judged flow
- Production authentication
- Real recipient accounts
- Real medical records
- Live food-bank integrations
- Live GPS
- Production route optimization
- Automated food-safety approval
- Full WMS or CRM functionality
- Billing or donor tax receipts
- Full volunteer scheduling
- Public pantry reservations
- Real-time public eligibility determination
- Multi-tenant regional deployment
- A generic chatbot as the main experience
- A consumer recipe app
- A basic pantry locator as the primary product

---

## 14. Screens and routes

| Route | Screen | Purpose |
|---|---|---|
| `/dashboard` | Operations Control Tower | See urgent issues and enter the scenario |
| `/inventory` | At-Risk Inventory | Review operational and display-only lot context |
| `/inventory/[id]` | Inventory Lot Details | Review on-hand quantity, risk facts, warehouse location, condition status, and audit data |
| `/plans/[id]` | AI Decision Room | Compare, edit, select, and approve plans |
| `/map` | Demand and Capacity Map | Understand demand, capacity, windows, vehicles, and routes |
| `/packing/[id]` | Packing and Cross-Dock Plan | Translate approval into warehouse instructions |
| `/missions/[id]` | Mission Detail | Show vehicle, driver, stops, quantities, and route |
| `/simulate` | Disruption Simulator | Trigger and approve a recovery |
| `/impact` | Impact and Audit | Show calculated outcomes and decision history |
| `/partners/[id]` | Partner Profile | Inspect demand, capacity, windows, status, and decision factors |

Detailed screen requirements live in `docs/SCREEN_SPECIFICATIONS.md`.

---

## 15. Primary navigation flow

```text
/dashboard
    ↓
/inventory/LOT-104
    ↓
/plans/PLN-104
    ↓
/packing/PKG-104
    ↓
/missions/MSN-104
    ↓
/simulate?mission=MSN-104
    ↓
/packing/PKG-105
    ↓
/missions/MSN-105
    ↓
/impact?mission=MSN-105
```

Product story:

```text
At-risk inventory alert
→ understand the existing lot
→ compare alternatives
→ approve a plan
→ create warehouse and route instructions
→ recover from disruption
→ measure the outcome
```

---

## 16. Map requirements

The map is a decision surface, not decoration.

### Required data

- Warehouse origin
- Partner agencies
- Vehicle
- Candidate and approved routes
- Demand level
- Compatible cold capacity
- Receiving windows
- Status: available, limited, unavailable, or canceled
- Product-fit indicator
- Historical acceptance signal and sample size
- Optional service-gap layer

### Reliability

The demo must not depend on a live routing service.

Use:

- Seeded coordinates
- Deterministic distance matrix
- Precomputed route geometry
- Map fallback or accessible location list

The implemented layer checkboxes toggle routes, demand partners, warehouse capacity, and vehicles. Each control must update the schematic map and visible legend/list immediately.

---

## 17. Agent architecture

ChoiceGrid uses narrow agents with structured contracts.

### Inventory Risk Review Agent

- Summarizes validated lot facts and risk signals
- Identifies missing operational facts
- Drafts staff follow-up questions
- Must not invent shelf life, inspection results, or inventory

### Capacity Agent

- Checks warehouse capacity
- Checks partner capacity
- Checks vehicle compatibility
- Checks dock and receiving windows
- Fully deterministic

### Need-Matching Agent

Ranks destinations using:

- Documented demand
- Product usability
- Receiving-window fit
- Compatible capacity
- Recent service gap
- Historical category acceptance and sample size
- Travel
- Access burden
- Refusal risk

### Planning Agent

- Creates three complete plans
- Conserves quantity
- Calculates metrics
- Explains assumptions and risks
- Identifies excluded destinations

### Routing Agent

- Creates or loads the stop sequence
- Uses deterministic seeded distance data
- Respects vehicle and time constraints

### Recovery Agent

- Identifies affected work
- Preserves unaffected work
- Generates replacement plans
- Requires human approval
- Supersedes the old mission

### Optional Communication Draft Agent

May draft:

- Partner notice
- Disruption update

All messages remain drafts until approved. Communication delivery, including Vapi, is outside the judged hero.

---

## 18. Destination score

A possible MVP score:

```text
Destination Score =
25% documented need
+ 15% product usability match
+ 15% receiving-window compatibility
+ 15% compatible available capacity
+ 15% category-specific historical acceptance
+ 10% recent service gap
+ 5% equity priority
- travel penalty
- spoilage penalty
- refusal-risk penalty
```

Rules:

- Keep score components visible.
- Display accepted, refused, and short-receipt counts plus the sample size behind historical acceptance.
- Mark sparse history low-confidence; never turn missing history into a positive claim.
- Version the configuration, such as `score-v1`.
- Quantity-only edits do not recompute this seeded destination score; keep the score labeled and rerun hard constraints.
- A score cannot override a hard capacity, temperature, or time-window constraint.
- Do not describe the score as perfectly objective or perfectly fair.

---

## 19. Quantity conservation

Every plan must satisfy:

```text
available inventory
=
planned outbound allocation
+ retained long-term warehouse quantity
+ inspection hold
+ approved external transfer
+ explicitly unallocated quantity
```

`expectedSpoilageLb` is a non-exclusive risk estimate over those physical buckets, not another conservation bucket. The seeded 60 lb inspection hold is treated as expected loss for impact but is counted only once in quantity conservation.

Primary plan:

```text
1,200 = 420 + 320 + 400 + 60
```

A plan is not approvable when:

- Quantities do not reconcile
- Capacity is exceeded
- Temperature is incompatible
- A required time window is infeasible
- Blocking information is missing
- A canceled or unavailable destination remains assigned

---

## 20. State model

### Inventory lot

```text
available
→ partially_allocated / allocated / inspection_hold
→ distributed / disposed
```

### Mission

```text
draft
→ approved
→ assigned
→ in_transit
→ delivered
→ closed
```

### Disruption branch

```text
assigned / in_transit
→ disrupted
→ replanning
→ superseded by replacement mission
```

`superseded` is a terminal status for the original mission after a human approves its replacement. The replacement mission begins its own `draft → approved → assigned` lifecycle; the demo records these transitions in audit history even when the UI advances them in one reviewed action.

Invalid transitions must return an explicit conflict error.

---

## 21. Core data entities

Detailed schemas are in `docs/DATA_MODEL.md`.

At minimum, share typed representations for:

- `ProductLot`
- `Warehouse`
- `PartnerAgency`
- `DemandSignal`
- `Vehicle`
- `Driver`
- `PlanSet`
- `PlanOption`
- `Allocation`
- `DestinationScore`
- `PlanMetrics`
- `PackingPlan`
- `PackingBatch`
- `Mission`
- `RouteStop`
- `RouteLeg`
- `Disruption`
- `AgentRun`
- `AuditEvent`

Use stable prefixed IDs such as:

```text
LOT-104
PAR-012
PLN-104
OPT-003
PKG-104
PKG-105
MSN-104
MSN-105
DSP-001
```

Use ISO 8601 timestamps and explicit units.

---

## 22. API expectations

Core operations should include:

```text
GET  /api/inventory/:id

POST /api/plans/generate
GET  /api/plans/:id
POST /api/plans/:planSetId/approve

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

Rules:

- Validate inputs and outputs.
- Use a consistent response envelope.
- Return explicit domain errors.
- Make approval idempotent.
- Calculate impact in the canonical domain layer, not only in the browser.
- Treat `GET /api/packing/:id`, `GET /api/missions/:id`, and `GET /api/impact/:missionId` as explicit seed previews only when `preview=true`; otherwise return `STATE_REQUIRED` because these resources are created by browser workflow state.
- Label map and stateful GET projections `seed_preview_not_persisted`.
- Require action callers to submit the current schema-valid resource and lifecycle prerequisites; API actions calculate transitions but do not persist browser state.
- Accept only quantity changes on canonical plan allocation rows; ignore submitted identities and metrics in favor of canonical values and the documented recalculation boundary.

---

## 23. Implemented technical stack

- Next.js App Router
- TypeScript strict mode
- React and Tailwind CSS with repository-owned components
- Lucide icons
- Zod schemas
- React context plus versioned browser `localStorage` for durable demo state
- A global hydration gate that validates saved state before rendering the shell or enabling actions
- Local deterministic fixtures and domain services
- A bundled schematic map and precomputed route geometry
- Optional model-generated explanations with runtime validation and deterministic fallback; no live LLM is required
- Vitest, Testing Library, and Playwright

Required commands:

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
npm run demo:reset
```

`npm run demo:reset` reports immutable fixture readiness from the terminal. It cannot clear a browser's versioned `localStorage`; use the in-app **Reset scenario** action for that reset.

---

## 24. What must genuinely work

- Inventory-lot schema validation
- Missing and low-confidence operational-data handling
- Capacity checks
- Destination-score calculation
- Three plan alternatives
- Quantity conservation
- Plan edits and validation
- Human approval
- Packing-plan derivation
- Map and route rendering
- One disruption and recovery
- Impact calculations
- Audit events
- Demo reset
- Deterministic fallback when the LLM is unavailable

## 25. What may be simulated

- Warehouse, inventory, partner, and demand records
- Service-gap indicators
- Vehicles and drivers
- Route geometry
- Shelf-life risk assumptions
- Households-per-pound assumptions
- Refusal history
- Communication delivery
- Schematic map background and route geometry

Synthetic and scenario-based values must be labeled.

---

## 26. Target demo metrics

| Metric | Target |
|---|---:|
| Existing inventory available | **1,200 lb** |
| Pounds planned before the seeded risk deadline | **1,140 lb** |
| Inspection hold or modeled loss | **60 lb** |
| Modeled household-equivalents | **380** |
| Modeled spoilage avoidance | **94%** |
| Seeded disruption-to-recovery event interval | **11 seconds** |

These are simulated estimates calculated from the seeded scenario.

---

## 27. Ninety-second demo

### 0–15 seconds

Open `/dashboard`.

> “The food bank already has 1,200 pounds of strawberries in refrigerated inventory. They are not moving fast enough, so staff need a feasible outbound plan before the seeded risk deadline.”

### 15–30 seconds

Show:

- Existing lot and warehouse location
- Available quantity
- Risk deadline and age
- Refrigeration and staff condition status
- Missing-data handling
- Missing-data behavior

Generate plans.

### 30–50 seconds

Compare:

- Hold for Later
- Fastest Agency Release
- Balanced Release

Show:

- Warehouse cold-capacity warning
- Partner demand
- Receiving windows
- Metrics
- Excluded destinations

Show each agency's historical acceptance evidence and sample size, then approve Balanced Release.

### 50–65 seconds

Show:

- Packing or cross-dock batches
- Route
- Warehouse-origin route and vehicle context
- Receiving windows
- Approval in audit history

### 65–80 seconds

Trigger Partner Canceled.

Show:

- 320 affected pounds
- Recovery plan
- New route
- Human recovery approval

### 80–90 seconds

Show:

- 1,140 pounds planned before the seeded risk deadline
- 380 modeled household-equivalents using the seeded 3 lb assumption
- 94% modeled spoilage avoidance
- 11-second seeded event interval, not compute time or observed staff time
- Simulated-data label

---

## 28. Required tests

### Schemas and data

- Inventory-lot schema
- Required fields
- Unit conversion
- Agent envelope
- API validation

### Planning

- Hard capacity constraints
- Temperature compatibility
- Time-window feasibility
- Quantity conservation
- Score components
- Metrics
- Invalid edits
- Approval idempotency

### Recovery

- Canceled partner removed
- No canceled route stop remains
- Replacement conserves quantity
- Replacement respects capacity
- Old mission is superseded
- Audit events are added

### UI and accessibility

- Critical navigation
- Loading, empty, error, and low-confidence states
- Keyboard access
- Map/list synchronization
- Approval modal
- Demo reset

### End to end

```text
dashboard
→ inventory lot
→ plans
→ approval
→ mission
→ disruption
→ recovery
→ impact
```

---

## 29. Definition of done

The MVP is complete when:

- The dashboard shows the seeded at-risk warehouse lot.
- Required lot facts are validated and missing data is explicit.
- Three complete alternatives are generated; infeasible alternatives are visibly blocked and at least one option is feasible and approvable.
- Quantity conservation passes.
- Balanced Release can be approved.
- Packing and mission records are created.
- The map reflects the approved mission.
- One disruption produces a valid recovery.
- Recovery requires approval.
- Impact metrics update.
- Audit events are visible.
- Demo reset works.
- No real PII is present.
- Lint, types, tests, end-to-end checks, and production build pass.
- The full presentation can be completed in approximately 90 seconds.

---

## 30. Work order for coding agents

### Phase 1 — Foundation

Read:

```text
AGENTS.md
CHOICEGRID_PRODUCT_SPEC.md
docs/SCOPE_AND_NON_GOALS.md
docs/DATA_MODEL.md
docs/API_AND_STATE_CONTRACTS.md
```

Build:

- Repository setup
- Shared schemas
- Fixture repository
- Demo reset
- Domain errors

### Phase 2 — Inventory and planning

Read:

```text
docs/AI_AGENT_CONTRACTS.md
docs/USER_FLOWS.md
docs/METRICS_AND_EVIDENCE.md
```

Build:

- Inventory-lot review and fallback explanation
- Capacity service
- Destination score
- Three plans
- Plan metrics
- Quantity conservation

### Phase 3 — Approval and execution

Read:

```text
docs/SCREEN_SPECIFICATIONS.md
docs/DESIGN_SYSTEM.md
```

Build:

- Decision Room
- Approval
- Packing plan
- Mission
- Audit events

### Phase 4 — Map and recovery

Build:

- Markers and route
- Accessible location list
- Partner cancellation
- Replacement plan
- Superseding mission

### Phase 5 — Impact and hardening

Read:

```text
docs/DEMO_SCENARIOS.md
docs/TEST_AND_ACCEPTANCE_PLAN.md
```

Build:

- Impact page
- Reset and fallback
- End-to-end tests
- Accessibility
- Demo polish

---

## 31. Task-specific reading guide

### Frontend agent

```text
AGENTS.md
CHOICEGRID_PRODUCT_SPEC.md
docs/SCOPE_AND_NON_GOALS.md
docs/USER_FLOWS.md
docs/SCREEN_SPECIFICATIONS.md
docs/DESIGN_SYSTEM.md
docs/API_AND_STATE_CONTRACTS.md
```

### Backend or domain agent

```text
AGENTS.md
CHOICEGRID_PRODUCT_SPEC.md
docs/DATA_MODEL.md
docs/API_AND_STATE_CONTRACTS.md
docs/METRICS_AND_EVIDENCE.md
docs/PRIVACY_AND_SAFETY.md
docs/TEST_AND_ACCEPTANCE_PLAN.md
```

### AI-agent engineer

```text
AGENTS.md
CHOICEGRID_PRODUCT_SPEC.md
docs/AI_AGENT_CONTRACTS.md
docs/DATA_MODEL.md
docs/METRICS_AND_EVIDENCE.md
docs/PRIVACY_AND_SAFETY.md
docs/RESEARCH_INSIGHTS.md
```

### QA agent

```text
AGENTS.md
CHOICEGRID_PRODUCT_SPEC.md
docs/SCOPE_AND_NON_GOALS.md
docs/DEMO_SCENARIOS.md
docs/TEST_AND_ACCEPTANCE_PLAN.md
docs/METRICS_AND_EVIDENCE.md
```

---

## 32. Prohibited shortcuts

Do not:

- Replace calculations with LLM prose
- Hard-code contradictory values on different screens
- Skip quantity conservation
- Auto-approve plans
- Mark food safe
- Use real recipient PII
- Require a live external routing service
- Hide infeasible windows
- Treat straight-line distance as full logistics
- Mutate approved missions without an audit event
- Remove disruptions from history
- Display unsupported impact claims
- Turn the product into a general chatbot
- Build stretch features before the hero scenario is reliable

---

## 33. Pitch language

### Recommended

> “ChoiceGrid is a human-approved decision and recovery layer for at-risk food already inside a food-bank warehouse. It combines current constraints with agency acceptance history, compares outbound plans, creates packing and delivery instructions, and replans when conditions change.”

### Avoid

- “The AI knows the food is safe.”
- “These are real households.”
- “This is connected to live food-bank systems.”
- “Our fairness score is objective.”
- “No other product does this.”
- “The AI autonomously runs the supply chain.”

### Prefer

- “The prototype estimates urgency and requests staff review.”
- “The metrics are calculated from a simulated scenario.”
- “The system uses transparent constraints and human approval.”
- “Existing products cover pieces of the workflow; ChoiceGrid demonstrates the closed operational loop.”

---

## 34. Final directive

Build the smallest reliable product that proves this story:

> **An existing perishable lot is at risk inside the warehouse. ChoiceGrid compares feasible destinations using current constraints and agency history, obtains human approval, creates warehouse-origin packing and route instructions, recovers from one partner cancellation, and shows calculated impact.**

Do not optimize for the number of features.

Optimize for:

- Coherence
- Reliability
- Explainability
- Human control
- Visual clarity
- Map usefulness
- Demonstrable AI value
- Honest metrics
- A successful 90-second presentation

The strawberry scenario is the product until it works end to end.
