# Implementation Plan

## Delivery strategy

Build vertically around the primary strawberry scenario. Avoid creating many disconnected screens before the core domain logic works.

Recommended order:

```text
Data and contracts
→ donation review
→ plan calculation
→ human approval
→ map and mission
→ disruption recovery
→ impact
→ polish and testing
```

---

## Workstreams

### Domain and data agent

Owns:

- Zod schemas
- Seed repository
- Capacity calculations
- Separate long-term refrigerated-storage and short-dwell staging calculations
- Scoring
- Plan generation
- Metric calculations
- State transitions

### Frontend agent

Owns:

- Application shell
- Dashboard
- Donation review
- Decision room
- Packing screen
- Mission and impact screens
- Responsive and accessible components

### Map and mission agent

Owns:

- Bundled schematic map and synchronized location list
- Markers and layers
- Precomputed route geometry
- Route-stop list
- Disruption route update

### AI integration agent

Owns:

- Intake structured extraction
- Explanation generation
- Fallback fixtures
- Agent run logging
- Prompt and schema validation

### QA and integration agent

Owns:

- Unit and integration tests
- Playwright scenario
- Contract consistency
- Demo reset
- Performance and fallback checks

Agents must coordinate through approved contracts rather than inventing separate shapes.

---

## Milestone 0 — Repository foundation

### Tasks

- Initialize Next.js and TypeScript
- Add lint, typecheck, test, and build commands
- Add Tailwind and base components
- Create route skeletons
- Add demo-mode configuration
- Copy documentation into repository

### Exit criteria

- App runs
- All expected commands exist
- Empty routes render
- Documentation links are valid

---

## Milestone 1 — Domain model and seed data

### Tasks

- Implement schemas from `DATA_MODEL.md`
- Create warehouse, donor, partner, vehicle, driver, and donation fixtures
- Implement deterministic seed and domain services
- Implement reset function
- Implement quantity-conservation helpers

### Exit criteria

- Seed data validates
- `DON-104` loads
- Reset is idempotent
- Domain unit tests pass

---

## Milestone 2 — Dashboard and donation workflow

### Tasks

- Build application shell
- Build dashboard KPI and alert cards
- Build donation intake
- Build donation details and confidence display
- Implement Intake Agent and fallback
- Implement donation APIs

### Exit criteria

- User can open the seeded alert
- Original message and structured fields render
- Missing data blocks planning
- Fallback works without API key

---

## Milestone 3 — Planning engine and decision room

### Tasks

- Implement capacity checks
- Implement destination scoring
- Implement three plan strategies
- Implement plan metrics
- Build comparison UI
- Build quantity editor
- Implement approval and audit event

### Exit criteria

- Three complete alternatives display; infeasible alternatives are visibly blocked and at least one is approvable
- Quantity conservation passes
- Approval creates mission and packing plan
- Invalid edit is blocked

---

## Milestone 4 — Packing, map, and mission

### Tasks

- Build packing-plan screen
- Persist `pending | complete` status per batch
- Keep historical `PKG-104` read-only after recovery
- Add map markers and synchronized list
- Wire route, demand, capacity, and vehicle layer toggles
- Add precomputed route matrix and polylines
- Build mission detail and stop list
- Connect plan approval to route and packing data

### Exit criteria

- Map works without live route API
- Packing quantities match plan
- Mission route and stops match allocations

---

## Milestone 5 — Disruption recovery

### Tasks

- Implement partner-cancellation fixture
- Implement affected-quantity calculation
- Implement recovery options
- Implement replacement approval
- Create and activate recovery packing plan `PKG-105` while retaining `PKG-104`
- Preserve completed mission stops only when location and quantities match; split already-packed quantity from any recovery-only packing delta
- Preserve original mission
- Update route, mission, metrics, and audit history

### Exit criteria

- Primary disruption works from seeded state
- No allocation remains at canceled partner
- Replanned mission is valid
- Original mission is retained as superseded
- Recovery packing uses non-colliding IDs, matches the approved replacement, and leaves only recovery-only quantity pending

---

## Milestone 6 — Impact and trust

### Tasks

- Implement impact formulas
- Build impact screen
- Add simulated-data labels
- Add agent and audit timelines
- Add metric detail tooltips

### Exit criteria

- Target fixture values reproduce
- Metrics update after replan
- Every metric has formula or assumption

---

## Milestone 7 — Demo hardening

### Tasks

- Implement reset control
- Add deterministic fallback paths
- Keep the bundled schematic route and synchronized location-list fallback independent of map tiles
- Run accessibility pass
- Add Playwright primary scenario
- Fix responsive issues
- Rehearse presentation twice

### Exit criteria

- All quality-gate commands pass
- Primary scenario passes twice from clean reset
- Non-developer can present it

---

## Suggested two-day hackathon schedule

### Day 1 morning

- Contracts, seed data, shell, dashboard

### Day 1 afternoon

- Donation details, planning engine, decision room

### Day 1 evening

- Approval, packing, map skeleton

### Day 2 morning

- Mission, disruption recovery, impact

### Day 2 late morning

- Tests, fallback, styling, pitch rehearsal

Do not wait until the end to integrate branches.

---

## Dependency graph

```text
Schemas and seed data
  ├── Dashboard
  ├── Donation details
  ├── Planning engine
  │     ├── Decision room
  │     ├── Packing plan
  │     └── Mission
  │           ├── Map
  │           ├── Disruption recovery
  │           └── Impact
  └── Tests and reset
```

---

## Integration rules

- Update domain contracts before dependent features.
- Do not duplicate fixture data in UI code.
- Use one canonical metric service.
- Use one canonical status enum.
- Run the primary scenario after every major integration.

---

## Risk register

| Risk | Owner | Mitigation |
|---|---|---|
| Scope expansion | Project lead | Enforce `SCOPE_AND_NON_GOALS.md` |
| Agent API failure | AI agent | Deterministic fallback |
| Map rendering failure | Map agent | Bundled schematic routes and synchronized fallback list |
| Contract drift | QA agent | Schema tests and source-of-truth order |
| Incorrect metrics | Domain agent | Central formulas and fixtures |
| Demo-state corruption | Integration agent | Idempotent reset |
| Accessibility gaps | Frontend and QA | Keyboard and automated checks |
| Unclear pitch | Project lead | One hero scenario and rehearsed script |

---

## Final handoff checklist

- [ ] Production build artifact created
- [ ] `.env.example` included
- [ ] Demo reset documented
- [ ] Seed data committed
- [ ] Primary partner-cancellation scenario tested; disabled preview controls labeled honestly
- [ ] Known limitations documented
- [ ] Presentation laptop tested offline or with limited network
- [ ] Source and metric labels reviewed
