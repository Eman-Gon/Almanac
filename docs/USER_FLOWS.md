# User Flows

## Primary users

### Operations manager
Reviews at-risk inventory, compares plans, approves allocations, and monitors recovery and impact.

### Inventory coordinator
Confirms on-hand quantity, location, risk deadline, temperature class, and staff condition status.

### Warehouse lead
Reviews storage, staging, packing, and handling instructions.

### Dispatcher
Reviews the approved warehouse-origin route and handles disruptions; ChoiceGrid does not schedule drivers in the MVP.

### Partner-agency coordinator
Maintains current capacity, demand, receiving hours, and category-specific acceptance/refusal/short-receipt history.

The MVP may use one signed-in `demo_user` while preserving role labels.

---

## Navigation model

```text
Dashboard
  └── At-Risk Inventory
        └── Inventory Lot Details
              └── Decision Room
                    ├── Partner Profile
                    ├── Demand and Capacity Map
                    └── Approve Plan
                          ├── Packing Plan
                          └── Warehouse-Origin Mission
                                ├── Partner Cancellation
                                └── Impact and Audit
```

---

## Flow 1 — Primary at-risk-inventory workflow

### Starting state

- Dashboard alert references `LOT-104`.
- `LOT-104` contains 1,200 lb of strawberries already received at `WH-001`.
- The lot is refrigerated, staff-cleared for planning, and approaching a seeded risk deadline.
- Long-term refrigerated headroom is 420 lb; short-dwell staging is 500 lb.
- Candidate agencies include current constraints and category-specific synthetic acceptance history.

### Steps

1. User opens the dashboard and selects the at-risk inventory alert.
2. Inventory details show available pounds, received time, risk deadline, temperature, warehouse location, condition status, and audit history.
3. User confirms any missing staff-entered fact and selects **Generate outbound plans**.
4. Capacity, need, acceptance-history, planning, and routing services run deterministically.
5. The Decision Room displays Hold for Later, Fastest Agency Release, and Balanced Release; infeasible alternatives are visibly blocked.
6. User inspects metrics, assumptions, exclusions, current agency facts, historical outcomes, sample sizes, and the warehouse-origin map.
7. User approves Balanced Release or edits quantities.
8. System validates quantity, capacity, temperature, agency availability, receiving windows, and route constraints.
9. System creates approved packing plan `PKG-104` and assigned mission `MSN-104`.
10. User reviews the route from `WH-001` to partner drop-offs and later opens calculated impact.

### Success state

- `LOT-104` is `allocated` or `partially_allocated`.
- Approved allocations conserve available inventory.
- `MSN-104` and `PKG-104` reference `LOT-104` and the same allocations.
- There is no donor marker or donor pickup stop.
- An approval audit event exists.

---

## Flow 2 — Missing or uncertain inventory information

1. User opens `LOT-104` or another supported lot.
2. A required fact such as available quantity, risk deadline, temperature class, or staff condition status is missing.
3. Screen shows `needs_confirmation`; it does not infer a safety or shelf-life fact.
4. User enters or confirms the fact with a reason.
5. Plan generation becomes available and the confirmation is audited.

---

## Flow 3 — Compare plan options

- **Hold for Later:** attempts to retain the full lot, is blocked by 420 lb of long-term cold headroom, and creates no outbound mission.
- **Fastest Agency Release:** emphasizes same-day agency release, uses little long-term storage, and has a seeded 45.7-mile warehouse-origin route.
- **Balanced Release:** splits the lot across agency deliveries, short-dwell program staging, and a 60 lb inspection hold; its seeded route is 24.8 miles.

Users compare planned outbound pounds, miles, labor, cold-storage and staging use, need match, equity indicators, receiving windows, historical acceptance, refusal/short-receipt evidence, and exclusions. Sparse history is labeled low-confidence; history never overrides a current hard constraint.

---

## Flow 4 — Edit allocation before approval

1. User changes a destination quantity; identities cannot change.
2. System rebuilds the option from canonical rows and recalculates planned outbound pounds, modeled household-equivalents, storage, and staging.
3. System validates conservation, partner capacity, vehicle capacity, temperature, and windows.
4. Invalid values show inline errors; user enters an edit reason.
5. Human approves the edited option, and the audit event stores original and final quantities.

Expected spoilage, staff minutes, need-match, equity, refusal risk, and route miles remain labeled seeded strategy estimates until quantity-sensitive formulas exist.

---

## Flow 5 — Packing-batch completion

1. User opens `PKG-104` after approval or `PKG-105` after recovery approval.
2. User starts packing, completes or reopens individual batches, and sees progress persist.
3. Completion changes status only, never approved quantity.
4. `PKG-105` preserves matching completed work and separates any added recovery amount into a pending `-R` delta.
5. After recovery, `PKG-104` is read-only and `PKG-105` is active.

## Flow 5A — Mission-stop completion

1. User opens the active mission.
2. Only the first pending stop is enabled.
3. `warehouse_load_complete` targets the `WH-001` origin; `delivery_complete` targets a partner drop-off.
4. Completing the final non-canceled stop marks the mission `delivered`.

Out-of-order completion is rejected and creates no audit event.

---

## Flow 6 — Partner cancellation

1. User triggers the named **Eastside Community Pantry canceled** fixture.
2. System marks the partner and affected route stop `canceled` and identifies 320 affected lb.
3. Completed and unaffected work remains unchanged.
4. Deterministic recovery sends 260 lb to Northside Family Resource Center and increases Community Kitchen staging from 400 lb to 460 lb.
5. User reviews and approves the replacement.
6. System creates `PKG-105` and `MSN-105`, preserves `PKG-104` read-only, and marks `MSN-104` `superseded`.

### Success state

- No allocation remains at the canceled partner.
- Replacement destinations stay within current capacity, history remains explanatory, and quantity is conserved.
- Audit history links the original and replacement mission.

---

## Flow 7 — Additional disruption previews

Vehicle breakdown, cold-capacity loss, driver unavailability, and a shortened agency receiving window are selectable previews that do not change the operational seed state. Driver scheduling, donor scheduling, and donor pickup are not executable workflows.

---

## Flow 8 — Low-confidence or failed AI explanation

1. An optional explanation request fails or violates its schema.
2. System shows a non-blocking status and loads a deterministic explanation of validated lot facts.
3. User continues; the run is logged as `fallback_used`.

No external model is required for planning.

---

## Flow 9 — Partner profile inspection

From a marker or plan row, user opens a partner profile showing current windows, capacity, demand, product preferences, recent allocations, and category-specific accepted/refused/short-receipt counts with sample size. User returns without losing plan state.

---

## Flow 10 — Demo reset

The presenter uses **Reset scenario** to restore `LOT-104`, agency history, capacities, partner statuses, and the unapproved baseline. The in-app action clears versioned browser state; `npm run demo:check` verifies immutable fixtures but cannot clear browser storage.

---

## Flow 11 — Simulated partner voice outreach (isolated stretch flow)

1. User opens `/communications` directly; it remains absent from primary navigation.
2. Before plan approval, the screen shows a prerequisite state and cannot run.
3. After plan or recovery approval, the screen derives recipient scripts from the active approved allocations and canonical partner facts.
4. User reviews every exact script, enters an authorization reason, and confirms a local simulation.
5. ChoiceGrid produces deterministic synthetic responses and transcripts with no network request.
6. The screen labels every response unverified and confirms that operational state did not change.

The flow never requests contact information, records audio, calls a provider,
or writes its preview timeline into `DemoState`.

---

## Flow 12 — Multi-item warehouse triage (secondary scenario)

1. User opens **Demo controls** and selects **Multi-item Warehouse Day**.
2. ChoiceGrid navigates to `/inventory/preview`; the route, not temporary UI state, identifies the scenario.
3. User reviews four independent lots ranked by the deterministic scenario clock, risk signal, and compatible storage pressure.
4. Selecting a lot reveals its condition, handling, headroom, deadline, and explanation.
5. ChoiceGrid calculates one grouped release preview while conserving every `productLotId` independently.
6. Frozen chicken remains entirely in inspection hold because staff confirmation is missing.
7. User reviews the four-lot reconciliation, checks the human-authorization control, and approves the local preview.
8. ChoiceGrid reveals four grouped agency outreach drafts labeled synthetic and not sent.
9. Reload clears local approval but keeps the route-selected scenario label; Strawberry Rescue state is unchanged.
10. User returns to `/dashboard` to continue the executable hero.

The flow does not generate operational plans, packing work, missions, routes,
impact claims, audit events, or partner contact.
