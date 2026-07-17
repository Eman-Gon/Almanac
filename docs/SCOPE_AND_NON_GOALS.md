# Scope and Non-Goals

## Product objective

Build a polished, reliable hackathon prototype that demonstrates one end-to-end workflow:

> Identify an at-risk perishable lot already inside the food-bank warehouse, compare explainable outbound plans using current constraints and agency history, obtain human approval, create packing and delivery instructions from the warehouse, recover from a partner cancellation, and calculate traceable scenario impact.

The MVP is not a complete food-bank operating system.

---

## Authoritative scope boundary

The judged workflow begins **after receiving and staff condition review**. `LOT-104` is existing inventory at `WH-001`; Almanac does not schedule a donor pickup, book a driver, inspect the incoming donation, or coordinate upstream collection in the hero scenario.

Donor intake, donor pickup, Vapi outreach, and driver scheduling are not hero features. Existing experimental routes may remain only as clearly isolated, non-navigation test surfaces until removed or repurposed.

---

## MVP scope

### 1. Operations dashboard

- Show one urgent at-risk inventory alert
- Show pounds approaching the seeded risk deadline
- Show long-term cold-storage and short-dwell staging utilization
- Show active outbound missions and agency shortage indicators
- Provide a short seeded shift briefing

### 2. Inventory-lot review

- Show warehouse, product, available pounds, received time, risk deadline, temperature requirement, and staff-entered condition status
- Show missing or low-confidence operational facts without fabricating them
- Preserve the lot's inventory and audit history
- Allow plan generation only when required deterministic facts are present

### 3. Destination and plan generation

- Load current agency demand, capacity, receiving windows, service-gap data, and category-specific acceptance history
- Show accepted, refused, and short-receipt sample counts behind the historical signal
- Calculate destination scores deterministically
- Produce three complete alternatives: **Hold for Later**, **Fastest Agency Release**, and **Balanced Release**
- Preserve quantity conservation and explain tradeoffs, assumptions, and exclusions

### 4. Human approval

- Approve a plan
- Edit allocation quantities within constraints
- Record the approver and reason
- Reject invalid, over-capacity, or history-only decisions that conflict with current hard constraints

### 5. Map and outbound mission

- Show warehouse, partner agencies, and assigned vehicle context
- Begin the route at `WH-001`; no donor pickup appears
- Display selected route, stop names, receiving windows, capacity, demand, and historical acceptance context
- Navigate between map, partner, packing, and mission screens

### 6. Packing or cross-dock plan

- Derive quantities from the approved plan
- Show destination, quantity, lot, priority, and staging instructions
- Indicate refrigerated handling
- Persist `pending | complete` without changing approved pounds
- Create `PKG-104` on plan approval and `PKG-105` on recovery approval; keep the original read-only and split already-packed quantity from the recovery-only delta

### 7. Disruption and recovery

Implement one fully working disruption:

- Partner cancellation

The system must produce a replacement allocation, packing plan, outbound mission, and audit record. Vehicle breakdown, cold-capacity loss, driver unavailability, and a shortened agency receiving window are selectable previews, not executable fixtures.

### 8. Impact and audit

- Calculate operational and food-impact metrics from the seeded lot
- Label scenario estimates
- Show approval, override, disruption, and replan events

---

## Stretch scope

Only after the MVP passes the end-to-end demo:

- Additional disruption types
- Improved agency acceptance and short-receipt analysis
- Shift-start briefing generated from current state
- De-identified historical lot replay
- Interactive multi-item warehouse triage with per-lot conservation and a route-local grouped release preview
- Multilingual draft partner communications
- Deterministic post-approval partner voice-outreach simulation, with no external delivery or operational-state mutation
- Limited pantry or program substitution preferences
- Cross-food-bank transfer option
- Camera-assisted condition flagging
- Volunteer-aware packing capacity

Stretch work must not destabilize the primary scenario.

---

## Explicit non-goals

The MVP will not implement:

- New-donation intake or donor pickup coordination as the hero workflow
- Donor, partner, or driver scheduling
- Live Vapi calls or automated outreach in the judged flow
- Production authentication or authorization
- Real recipient accounts, medical records, or household data
- Live food-bank integrations, GPS tracking, or production route optimization
- Automated food-safety approval
- Full warehouse management, purchasing, billing, CRM, or volunteer scheduling
- Simultaneous multi-lot packing, dispatch, shared vehicle routing, or operational capacity reservation
- Public pantry reservations or eligibility determination
- Multi-tenant deployment or compliance certification
- Machine-learning forecasting trained on live history

---

## Data scope

The hero dataset contains:

- 1 warehouse
- 10 partner agencies
- 3 vehicles and 4 synthetic drivers as execution context, not a scheduling product
- 1 primary existing inventory lot: `LOT-104`
- 1 secondary route-local fixture, `SCN-MULTI-ITEM-001`, with four independent synthetic lots; it never enters hero `DemoState`
- Category-specific synthetic agency acceptance/refusal/short-receipt history with explicit sample sizes
- 8 display-only historical inventory-lot summaries excluded from planning, KPIs, and impact
- 1 executable partner-cancellation fixture plus disabled disruption previews
- Synthetic Santa Clara County-area coordinates and aggregate community profiles

No real household, donor-contact, or recipient records are required.

---

## Technical constraints

- The demo must run locally.
- Core behavior must work without a live route, map, communications, or LLM service.
- The isolated voice-outreach simulator must not request a phone number, microphone, or provider connection and must not change the approved plan or demo state.
- The multi-item secondary scenario must reconcile every lot independently, label its coordinated plan as a preview, and never create packing, mission, partner-contact, or impact state.
- Deterministic fallback explanations must keep the demo usable.
- The production build must succeed and seed state must reset reliably.
- A presenter must complete the hero flow without developer tools.

---

## Definition of MVP complete

- [ ] Dashboard shows the seeded at-risk inventory lot.
- [ ] Inventory facts, risk deadline, and staff condition status are reviewable.
- [ ] Agency acceptance history is visible with sample size and does not override hard constraints.
- [ ] Three alternatives are generated; infeasible alternatives are blocked and at least one is approvable.
- [ ] Plan metrics and quantity conservation are calculated.
- [ ] Human approval creates packing instructions and an outbound mission beginning at `WH-001`.
- [ ] One partner cancellation creates a valid human-approved replacement.
- [ ] Impact metrics and audit history update.
- [ ] No donor pickup exists in the hero route and no real PII is present.
- [ ] The full flow passes Playwright or a documented smoke test.

---

## Stop condition for new features

Do not add a feature when the primary demo is unreliable, it requires a live dependency, introduces sensitive data, cannot be explained in the pitch, duplicates an upstream donation marketplace, or shifts the story away from at-risk warehouse inventory allocation and recovery.
