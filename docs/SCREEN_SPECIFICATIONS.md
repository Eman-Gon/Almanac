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

### Shared states

Every data screen must support:

- Loading
- Empty
- Error
- Low-confidence or incomplete data
- Read-only after mission completion where appropriate

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
- Cold-capacity utilization
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

### Popup contents

- Name
- Type
- Demand level
- Storage capacity
- Receiving window
- Current status
- View details action

### Controls

- Toggle route
- Toggle demand
- Toggle cold capacity
- Fit to mission
- Filter by product fit
- Open partner profile

### Acceptance criteria

- Map renders with local seed data.
- Route display does not require a live routing API.
- Keyboard users can access a synchronized location list.

---

## 6. Packing and Cross-Dock Plan

**Route:** `/packing/[id]`

### Purpose

Translate the approved plan into warehouse action.

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
- View packing plan
- View impact

### Acceptance criteria

- Mission stop quantities match plan allocations.
- Completed stops cannot be accidentally edited.
- Disruption creates a recoverable state, not silent mutation.

---

## 8. Disruption Simulator

**Route:** `/simulate`

### Purpose

Create a controlled live-demo failure.

### Required scenario buttons

- Partner canceled
- Truck breakdown
- Cold capacity lost
- Driver unavailable
- Donation quantity doubled
- Pickup deadline shortened

Only one or two must be fully implemented for MVP; others may be visibly labeled `preview`.

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
- Cold-capacity utilization
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
