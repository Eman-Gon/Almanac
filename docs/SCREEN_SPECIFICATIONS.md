# Screen Specifications

## Global application shell

### Persistent elements

- Product logo and name
- Primary navigation
- Demo-mode badge
- Current scenario indicator
- Agent-status indicator
- User menu or `demo_user` label
- Reset-demo control in demo mode

### Primary navigation

- Dashboard
- Inventory
- Plans
- Map
- Missions
- Impact

After persisted state hydrates, Missions points to `MSN-105` when recovery is approved; `/missions` uses the same active-mission resolution.

### Shared states

Every data screen must support:

- Loading
- Empty
- Error
- Low-confidence or incomplete data
- Read-only after mission completion where appropriate

The root demo-state provider must finish validating browser storage before rendering the shell or any action control. During that gate, show **Loading saved demo state…** so a click cannot mutate the temporary seed state.

Unknown dynamic IDs render the intentional shared not-found state with a dashboard escape. Warehouse labels never link to `/partners/[id]`; only actual partner or partner-program destinations use partner-profile links.

---

## 1. Operations Control Tower

**Route:** `/dashboard`

### Purpose

Provide a shift-start view of urgent operational issues and entry into the hero scenario.

### Required components

- Header with date and scenario status
- Four to six KPI cards
- Urgent alerts list
- Overnight briefing card
- Active missions table
- Small map preview or network-status panel
- Cold-capacity indicator
- Expiration-risk list

### Seeded alert

```text
At-risk inventory
LOT-104 · 1,200 lb strawberries
Already at WH-001 · refrigerated
Seeded spoilage risk: high
```

### Actions

- Open inventory lot
- View mission
- Open full map
- Reset demo

### Acceptance criteria

- Urgent alert is visible without scrolling on common laptop size.
- Clicking it navigates to `/inventory/LOT-104`.
- KPI values derive from current state.

---

## At-Risk Inventory List

**Route:** `/inventory`

### Purpose

Keep the single operational hero lot prominent while providing believable synthetic inventory context.

### Required components

- One active `LOT-104` row linked to the inventory-review workflow
- Eight recent synthetic lot-history rows with quantity, temperature class, outcome, and terminal status
- A visible `Mock history · display only` label

Historical rows are not interactive operational records and must not affect dashboard KPIs, planning, impact, or demo state.

### Acceptance criteria

- Exactly one lot is labeled operational.
- Historical quantities use pounds and approved inventory statuses.
- The active strawberry row remains keyboard accessible and navigates to `/inventory/LOT-104`.

---

## Multi-item Warehouse Day (secondary scenario)

**Route:** `/inventory/preview`

### Purpose

Show how ChoiceGrid can triage several warehouse lots and group compatible
product lines without pretending the current single-lot mission contract can
execute them together.

### Required components

- `Scenario preview · 0 operational changes` guardrail
- Four typed lots: peanut butter, cabbage, blueberries, and frozen chicken
- Calculated urgency ranking using the fixed scenario clock
- Per-lot temperature, deadline, quantity, condition, storage pressure, and next action
- A deterministic grouped release preview with per-lot conservation
- Frozen chicken held for staff confirmation with no outbound allocation
- Human checkbox before grouped partner outreach drafts become visible
- Visible calculated/seeded provenance and `not sent` labels
- Return action to the executable Strawberry Inventory Release

### Acceptance criteria

- The route reports 4 lots, 2,960 available lb, and three handling zones from fixture data.
- Blueberries rank first; the result is deterministic and never uses `Date.now()`.
- Planned outbound, retained, and inspection-hold pounds total 2,960 lb.
- Aggregate conservation cannot hide a per-product substitution.
- Partner capacity is cumulative across every product line in that partner's draft.
- Approval is route-local and causes no network request or `DemoState` mutation.
- Reload preserves the route-selected scenario label but clears local preview approval.
- No preview control links to plan, packing, mission, dispatch, or live communications.
- `/dashboard`, `/inventory`, and `/inventory/LOT-104` remain strawberry-first and unchanged.

---

## Partner Outreach Simulator (isolated experiment)

**Route:** `/communications`

### Purpose

Demonstrate how one approved warehouse-release plan could become consistent
one-to-many partner voice scripts and structured responses without contacting
anyone. This route is excluded from primary navigation and the judged hero.

### Required components

- Pre-approval prerequisite state with a link back to plan review
- Approved lot, warehouse, plan, recipient quantity, capacity, demand, and receiving-window facts
- One deterministic generated voice script per approved partner allocation
- Staff-entered reason and explicit checkbox authorizing the local simulation
- One strict synthetic response and transcript per recipient
- Preview-only audit timeline for draft, human authorization, and simulation
- Visible `Simulation only`, `Synthetic response`, `Unverified`, and `0 operational changes` labels

### Guardrails

- No phone number, microphone permission, provider request, call ID, or polling
  appears in the simulator.
- Scripts use only approved plan and canonical seeded facts.
- Synthetic responses cannot accept food, alter an allocation, change partner
  status, certify safety, dispatch a mission, or enter operational audit history.
- The simulator remains usable when all Vapi and LLM variables are absent.

---

## 2. Inventory Lot Details

**Route:** `/inventory/[id]`

### Purpose

Review an existing lot already received at the warehouse before outbound planning.

### Required fields

- Lot ID and product
- Warehouse location
- Physical and available quantity in pounds
- Received time and risk deadline
- Temperature requirement
- Staff-entered condition status and notes
- Risk level and missing-data state

### Actions

- Confirm missing fact
- Generate outbound plans
- Return to inventory

### Validation

- Quantity must be positive.
- Risk deadline and received time must be valid.
- Planning is blocked until temperature and staff condition status are confirmed.

---

## 4. AI Decision Room

**Route:** `/plans/[id]`

### Purpose

Compare complete operational plans and obtain human approval.

### Required components

- Three plan cards or comparison columns
- Metric comparison table
- Map preview
- Assumptions drawer
- Destination ranking table
- Historical acceptance evidence with accepted/refused/short-receipt counts and sample size
- Excluded-destination explanation
- Agent activity timeline
- Approval panel

### Plan metrics

- Pounds distributed before risk deadline
- Expected inspection hold or loss
- Miles
- Staff or volunteer minutes
- Long-term refrigerated-storage utilization
- Refrigerated-staging utilization
- Need-match score
- Equity indicator
- Refusal risk

### Actions

- Select plan
- Inspect destination
- Edit quantities
- Request another plan
- Approve plan

### Approval modal

Require:

- Selected plan
- Summary of changes
- Approver name or `demo_user`
- Optional reason
- Confirmation checkbox

### Acceptance criteria

- Only valid plans can be approved.
- Total quantities reconcile.
- Approval creates mission and packing plan.
- Edits change quantities only; identity, allocation metadata, and authoritative metrics are rebuilt from the canonical option.
- Planned outbound pounds, modeled household-equivalents, storage, and staging update after edits. Route miles, spoilage, labor, need-match, equity, and refusal risk remain labeled seeded strategy estimates.
- Sparse history is labeled low-confidence and cannot override current capacity, temperature, availability, or receiving windows.

---

## 5. Demand and Capacity Map

**Route:** `/map`

### Purpose

Provide the spatial context behind allocation decisions.

### Required layers

- Warehouse
- Partner agencies
- Vehicles
- Approved or candidate routes
- Optional demand or service-gap overlay

### Marker semantics

- Warehouse: purple
- Available partner: green
- Capacity-constrained partner: amber
- Unavailable or canceled partner: red
- Vehicle: neutral truck icon

Do not rely on color alone; include icons, labels, or patterns.

On the full map, every current route stop shows its sequence and full location name. At phone widths, numbered pins replace on-canvas name labels to avoid collisions, while the synchronized list immediately below preserves every full route-stop name and quantity. Nearby context remains icon-only until selected so the default map stays legible. No location detail is open on initial render.

### Popup contents

- Name
- Type
- Planned warehouse load/departure or partner delivery when the location is on the mission route
- Demand level
- Storage capacity
- Receiving window
- Current status
- View details action

### Controls

- Toggle routes
- Toggle demand partners
- Toggle warehouse capacity
- Toggle vehicles
- Zoom in, zoom out, and reset to the fitted route
- Pan by dragging after zoom or with arrow keys while the map has focus
- Open partner profile

### Acceptance criteria

- Map renders with local seed data.
- Route display does not require a live routing API.
- Zoom and pan are presentation-only; they do not change route geometry, distance, stop order, quantities, or metrics.
- A replacement route is never synthesized from URL state; `MSN-105` remains unavailable on the map until human approval creates the persisted mission.
- The default desktop view keeps all current route-stop names and sequence visible while withholding detailed facts until selection; the phone layout keeps sequence on the map and full names in the adjacent synchronized list.
- The synchronized route list shows planned mission quantities separately from requested demand.
- Every layer checkbox immediately updates both the schematic map and its visible legend/list.
- Keyboard users can access a synchronized location list.

---

## 6. Packing and Cross-Dock Plan

**Route:** `/packing/[id]`

### Purpose

Translate the approved plan into warehouse action. The implemented IDs are `PKG-104` after primary plan approval and `PKG-105` after recovery approval.

### Required components

- Plan summary
- Destination batches
- Product lot and quantity
- Handling requirement
- Priority order
- Staging location
- Label preview
- Completion controls

### Possible instructions

- Cross-dock directly to outbound lane
- Place in refrigerated staging
- Hold for supervisor inspection
- Allocate to tomorrow's meal-kit line

### Acceptance criteria

- Quantities exactly match approved allocations.
- Refrigerated product is visibly identified.
- No completion action changes allocation quantities.
- Every batch exposes `pending | complete` status, and completion survives navigation in the same browser.
- The plan becomes complete only after every batch is complete.
- A supported ID with no created plan shows a prerequisite state directing the user to plan or recovery approval; the screen must not fabricate executable packing data.
- `PKG-105` uses `BAT-101`-series IDs; when a completed destination/staging quantity grows, it shows an already-packed `-C` batch and a pending recovery-only `-R` delta.
- After recovery, `PKG-104` remains visible but its start and completion controls are disabled; `PKG-105` is active.

---

## 7. Mission Detail

**Route:** `/missions/[id]`

### Purpose

Show the approved warehouse-origin delivery sequence.

### Required components

- Mission status
- Assigned vehicle and driver
- Route map
- Ordered stop list
- Stop quantities
- Receiving windows
- Contact and instruction placeholders
- Event timeline
- Disruption button

### Actions

- Mark warehouse load complete
- Mark stop complete
- Trigger disruption
- View the packing plan for the current mission (`PKG-104` or `PKG-105`)
- View impact

### Acceptance criteria

- Mission stop quantities match plan allocations.
- Completed stops cannot be accidentally edited.
- Only the first pending stop is enabled; out-of-order completion is blocked.
- Hold for Later is blocked with 0 outbound miles; executable route totals match 45.7 miles for Fastest Agency Release and 24.8 miles for Balanced Release.
- Disruption creates a recoverable state, not silent mutation.

---

## 8. Disruption Simulator

**Route:** `/simulate`

### Purpose

Create a controlled live-demo failure.

### Required scenario buttons

- Eastside Community Pantry canceled — executable primary fixture
- Truck breakdown — selectable preview; does not change the operational seed state
- Cold capacity lost — selectable preview; does not change the operational seed state
- Driver unavailable — selectable preview; does not change the operational seed state
- Agency receiving window shortened — selectable preview; does not change the operational seed state

Only the named partner cancellation is executable in the MVP. Every other control is disabled and visibly labeled `Preview`.

### Required output

- What became infeasible
- Affected pounds and stops
- Replacement options
- Metric difference
- Approval requirement

### Acceptance criteria

- Primary disruption is deterministic.
- Replan changes route and allocations.
- Audit history records the disruption and approval.
- The canceled partner and affected original stop show `canceled`.
- The original mission shows `superseded` after recovery approval.
- Recovery approval creates `PKG-105` and `MSN-105`; changed, canceled, and new packing batches remain `pending`.

---

## 9. Impact and Audit

**Route:** `/impact`

### Purpose

Summarize calculated scenario outcomes and demonstrate trust.

### Required metrics

- Existing inventory available
- Pounds accepted
- Pounds planned outbound before the risk deadline
- Estimated spoilage avoided
- Modeled household-equivalents
- Miles
- Long-term refrigerated-storage utilization
- Refrigerated-staging utilization
- Replanning time
- Human overrides

### Required visualizations

- Before-and-after plan comparison
- Allocation by destination
- Timeline or audit log

### Labels

Every result must show one of:

- Calculated from scenario
- Simulated estimate
- Seeded assumption

### Acceptance criteria

- Metrics update after replan.
- Audit events are chronologically ordered.
- No metric is hard-coded outside scenario fixtures or formulas.

---

## 10. Partner Profile

**Route:** `/partners/[id]`

### Purpose

Explain why an agency is or is not a suitable destination.

### Required fields

- Name and location
- Receiving windows
- Dry, refrigerated, and frozen capacity
- Current demand by product category
- Product preferences and restrictions
- Recent allocations
- Refusal or short-receipt notes
- Accepted/refused/short-receipt counts and sample size by product category
- Access and service-gap indicators

### Actions

- Return to plan
- View on map
- Include or exclude with reason, if authorized

---

## Responsive behavior

### Desktop

Use a persistent sidebar or top navigation and multi-column decision views.

### Tablet

Collapse comparison to horizontal cards and retain the synchronized map/list.

### Mobile

Prioritize mission, stop details, and approval summaries. The full three-plan comparison may become a swipeable sequence.

The hackathon presentation target is a common 13–16 inch laptop, but the application must remain usable at 375 px width.
