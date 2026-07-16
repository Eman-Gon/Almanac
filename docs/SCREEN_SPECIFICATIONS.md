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
- Donations
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

Unknown dynamic IDs render the intentional shared not-found state with a dashboard escape. Donor and warehouse labels must never link to `/partners/[id]`; only actual partner or partner-program destinations use partner-profile links.

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
Urgent donation offer
1,200 lb strawberries
Pickup required before 1:00 PM
Estimated urgency: high
```

### Actions

- Open donation
- View mission
- Open full map
- Reset demo

### Acceptance criteria

- Urgent alert is visible without scrolling on common laptop size.
- Clicking it navigates to `/donations/DON-104`.
- KPI values derive from current state.

---

## Donation Offer List

**Route:** `/donations`

### Purpose

Keep the single operational hero offer prominent while providing believable synthetic context.

### Required components

- One active `DON-104` row linked to the donation-review workflow
- Eight recent synthetic history rows with quantity, temperature class, outcome, and terminal status
- A visible `Mock history · display only` label

Historical rows are not interactive operational records and must not affect dashboard KPIs, planning, impact, or demo state.

### Acceptance criteria

- Exactly one offer is labeled operational.
- Historical quantities use pounds and approved donation statuses.
- The active strawberry row remains keyboard accessible and navigates to `/donations/DON-104`.

---

## Communication Test Center

**Route:** `/communications`

### Purpose

Send a human-approved test update through Vapi without allowing the communication agent to change an operational decision.

### Required components

- Voice-call and SMS channel choices
- Test contact name and E.164 test number
- Staff-entered approved message
- Separate approved voicemail message for voice calls
- Explicit authorization checkbox before sending
- Preview-only result when Vapi is not fully configured
- Provider status for a live voice request when a Vapi call ID is available

### Guardrails

- The server keeps Vapi credentials out of the browser.
- Live requests require `VAPI_TEST_CALLS_ENABLED=true` and match `VAPI_TEST_TO_NUMBER` exactly.
- A call response is informational and unverified; it cannot accept a donation, alter allocation, certify food safety, or dispatch a mission.

---

## 2. Donation Intake

**Route:** `/donations/new`

### Purpose

Allow a user to enter a structured offer or paste a natural-language message.

### Required fields

- Donor
- Message or description
- Product
- Quantity and unit
- Pickup location
- Pickup window
- Storage requirement
- Condition notes
- Optional image placeholder

### Actions

- Parse offer
- Load demo offer
- Clear
- Save draft

### Validation

- Message or required structured fields must be present.
- Quantity must be positive.
- Pickup window must be valid.

---

## 3. Donation Details

**Route:** `/donations/[id]`

### Purpose

Review extracted information before planning.

### Layout

- Left: original donor message
- Right: structured fields
- Bottom: agent activity and missing information

### Required elements

- Donation status
- Product lot summary
- Field-level confidence
- Donor reliability summary
- Warehouse capacity preview
- Missing-question list
- Audit timeline

### Actions

- Edit field
- Confirm information
- Generate plans
- Return to dashboard

### Acceptance criteria

- Unknown data is visibly marked.
- Original message is never replaced by the parsed version.
- Generate-plans button is disabled until required data is complete.

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
- Distributed pounds, households, storage, and staging update after edits. Route miles, spoilage, labor, need-match, equity, and refusal risk remain labeled seeded strategy estimates.

---

## 5. Demand and Capacity Map

**Route:** `/map`

### Purpose

Provide the spatial context behind allocation decisions.

### Required layers

- Donors
- Warehouse
- Partner agencies
- Vehicles
- Approved or candidate routes
- Optional demand or service-gap overlay

### Marker semantics

- Donor: blue
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
- Planned pickup, warehouse transfer, or partner delivery when the location is on the mission route
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

Show the approved pickup and delivery sequence.

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

- Mark pickup complete
- Mark stop complete
- Trigger disruption
- View the packing plan for the current mission (`PKG-104` or `PKG-105`)
- View impact

### Acceptance criteria

- Mission stop quantities match plan allocations.
- Completed stops cannot be accidentally edited.
- Only the first pending stop is enabled; out-of-order completion is blocked.
- Planned route totals match the strategy template: 18.4 miles Warehouse First, 45.7 Direct Distribution, and 24.8 Mixed Plan.
- Disruption creates a recoverable state, not silent mutation.

---

## 8. Disruption Simulator

**Route:** `/simulate`

### Purpose

Create a controlled live-demo failure.

### Required scenario buttons

- Eastside Community Pantry canceled — executable primary fixture
- Truck breakdown — disabled preview
- Cold capacity lost — disabled preview
- Driver unavailable — disabled preview
- Pickup deadline shortened — disabled preview

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

- Pounds offered
- Pounds accepted
- Pounds assigned in time
- Estimated spoilage avoided
- Estimated households supported
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
