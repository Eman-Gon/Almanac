# Scope and Non-Goals

## Product objective

Build a polished, reliable hackathon prototype that demonstrates one end-to-end workflow:

> Parse an urgent perishable donation, compare destination plans, obtain human approval, create packing and delivery instructions, recover from a disruption, and calculate impact.

The MVP is not a complete food-bank operating system.

---

## MVP scope

### 1. Operations dashboard

- Show one urgent donation alert
- Show expiration-risk pounds
- Show cold-capacity utilization
- Show active missions and agency shortage indicators
- Provide a short seeded overnight briefing

### 2. Donation intake and review

- Paste or enter a donor message
- Extract structured fields
- Show original text and field confidence
- Identify missing information
- Allow a deterministic fallback when no model is configured

### 3. Destination and plan generation

- Load partner demand, capacity, receiving windows, and service-gap data
- Calculate destination scores
- Produce three complete plan options
- Preserve quantity conservation
- Explain tradeoffs and exclusions

### 4. Human approval

- Approve a plan
- Edit allocation quantities within constraints
- Record the approver and reason
- Reject invalid or over-capacity edits

### 5. Map and mission

- Show donor, warehouse, partner agencies, and vehicle
- Display selected route and route-stop details
- Display receiving windows and capacity indicators
- Navigate between map, partner, and mission screens

### 6. Packing or cross-dock plan

- Derive quantities from the approved plan
- Show destination, quantity, lot, priority, and staging instructions
- Indicate refrigerated handling
- Persist `pending | complete` status for each batch without changing approved quantities
- Create `PKG-104` on plan approval and `PKG-105` on recovery approval; keep the original read-only and split already-packed quantity from any pending recovery-only delta

### 7. Disruption and recovery

Implement one fully working disruption:

- Partner cancellation

The system must produce a replacement allocation, packing plan, mission, and audit record. Truck breakdown, cold-capacity loss, driver unavailability, and a shortened pickup deadline are disabled preview controls, not executable disruption fixtures.

### 8. Impact and audit

- Calculate operational and food-impact metrics
- Label scenario estimates
- Show approval, override, disruption, and replan events

---

## Stretch scope

Only after the MVP passes the end-to-end demo:

- Additional disruption types
- Donor-performance history
- Refusal-pattern analysis
- Shift-start briefing generated from current state
- Voice-note ingestion
- Multilingual partner communications
- Limited pantry or program substitution preferences
- Cross-food-bank transfer option
- Camera-assisted condition flagging
- Volunteer-aware packing capacity

Stretch work must not destabilize the primary scenario.

---

## Explicit non-goals

The MVP will not implement:

- Production authentication or authorization
- Real recipient accounts
- Real medical or dietary records
- Live food-bank integrations
- Real GPS tracking
- Production route optimization
- Automated food-safety approval
- Full warehouse management
- Purchase-order management
- Billing, payments, or donor tax receipts
- Enterprise CRM
- Full volunteer scheduling
- Public pantry reservations
- Real-time public eligibility determination
- Multi-tenant regional deployment
- Regulatory compliance certification
- Machine-learning forecasting trained on live food-bank history

---

## Data scope

The implemented hero dataset contains:

- 1 warehouse
- 10 partner agencies
- 1 donor
- 3 vehicles
- 4 drivers
- 1 primary product lot
- 1 active donation offer
- 1 executable partner-cancellation fixture plus disabled disruption previews
- Synthetic Santa Clara County-area coordinates
- Aggregate partner and community profiles

No real household records are required.

---

## Technical constraints

- The demo must run locally.
- Core behavior must work without a live external route service.
- Agent outputs must have deterministic fallback fixtures.
- The production build must succeed.
- Seed data must reset to a known state.
- A presenter must be able to complete the primary flow without developer tools.

---

## Definition of MVP complete

- [ ] Dashboard shows the seeded urgent donation.
- [ ] Donation details are extracted and reviewable.
- [ ] Three complete alternatives are generated; infeasible alternatives are visibly blocked and at least one is approvable.
- [ ] Plan metrics are calculated.
- [ ] Human approval changes state.
- [ ] Packing instructions derive from approved quantities.
- [ ] Map and mission reflect the approved plan.
- [ ] One disruption creates a valid replacement plan.
- [ ] Impact metrics and audit history update.
- [ ] Quantity conservation tests pass.
- [ ] No real PII is present.
- [ ] The full demo passes Playwright or a documented manual smoke test.

---

## Stop condition for new features

Do not add a feature when any of these are true:

- The primary demo is not reliable.
- The feature requires a new external dependency that can fail live.
- It introduces real sensitive data.
- It cannot be explained in the pitch.
- It duplicates an existing competitor without supporting the core workflow.
- It changes the product story from urgent allocation and recovery.
