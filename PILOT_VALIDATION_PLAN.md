# Almanac Validation and Pilot Plan

## Current evidence status

Almanac is ready for facilitated operator usability testing on the synthetic Strawberry Rescue scenario. It is **not yet ready for a live operational pilot or a multi-case historical replay**.

No food-bank interview, pilot commitment, or observed operational outcome is documented in this repository. Do not describe this plan as completed validation.

## Three readiness levels

| Level | Purpose | Current status | Required before starting |
|---|---|---|---|
| 1. Operator usability validation | Test whether the workflow, language, constraints, approvals, and recovery behavior make sense to real operators | **Ready** | Recruit participants and use synthetic data only |
| 2. Historical case replay | Compare Almanac recommendations with de-identified past inventory lots, agency outcomes, and disruption cases | **Blocked** | Add a configurable case-import path and obtain approved de-identified data |
| 3. Live shadow pilot | Run beside existing procedures without controlling acceptance, packing, dispatch, communications, or food-safety decisions | **Not ready** | Complete Levels 1–2, name an operational owner, approve data handling, and define incident/manual-fallback procedures |

The current plan-generation endpoint and browser state are tied to seeded `LOT-104`. A configurable case path is a separate implementation task; documentation alone does not remove that limitation.

## What Level 1 should prove

Run five to eight sessions across these broad roles when available:

- Donation coordination or sourcing
- Warehouse or inventory operations
- Dispatch or transportation
- Partner-agency coordination
- Operations leadership

Each participant should complete the same critical tasks without being coached through the interface:

1. Identify what is known, uncertain, or missing about the existing inventory lot.
2. Explain why Hold for Later is blocked.
3. Compare the three plans and identify the main tradeoff.
4. Review agency-history sample sizes and approve Balanced Release, or explain why they would not.
5. Find the packing instructions and mission receiving windows.
6. Respond to the partner cancellation and approve or reject the recovery.
7. Locate the audit evidence and distinguish calculated values from simulated estimates.

### Proposed Level 1 acceptance gates

These are team-defined research gates, not regulatory standards:

- At least 90% of critical tasks completed without facilitator rescue.
- Zero participant misunderstandings that imply AI can declare food safe or dispatch without approval.
- Every participant can identify the approving human and the reason an option is infeasible.
- No critical keyboard or screen-reader blocker in the tested path.
- Every recurring workflow correction is logged, including disagreement rather than only positive feedback.
- At least one operator from operations, warehouse, or dispatch confirms whether the cancellation scenario is realistic.

Failure to meet a gate is a learning result, not a reason to hide the session.

## Session measurements

Record one row per participant and task. Do not record recipient information, credentials, or sensitive operational details.

| Field | Meaning |
|---|---|
| Session ID | Anonymous identifier such as `VAL-001` |
| Broad role | Operations, warehouse, dispatch, donation coordination, or partner coordination |
| Task ID | Stable task number from the list above |
| Completed | `yes`, `with_prompt`, or `no` |
| Time seconds | Elapsed task time |
| Error or hesitation | Short non-sensitive observation |
| Confidence | Participant rating from 1–5 |
| Workflow correction | Requested terminology, data, rule, or approval change |
| Quote permission | `none`, `anonymous`, or `attributed` |

Use the interview and note protocol in [`FOOD_BANK_INTERVIEW.md`](FOOD_BANK_INTERVIEW.md). Do not publish a quote unless the participant explicitly approved the selected attribution level.

## Level 2 — historical replay design

After Level 1, request 20–50 de-identified past cases. The minimum useful case fields are:

- Inventory received/alert timestamp, product category, available quantity and unit
- Condition or inspection status, expressed as unknown when unavailable
- Temperature requirement
- Warehouse location and risk deadline
- Candidate destinations with capacity, demand, product fit and receiving windows
- Available vehicle capacity and relevant handling constraints
- Actual human decision and any cancellation or refusal
- Outcome fields the organization is comfortable sharing

Do not request recipient-level records, medical data, staff credentials, exact household addresses, or donor information that the partner has not approved for research use.

For each case, compare staff-only and Almanac-assisted results on:

- Time to a reviewable plan
- Time to a reviewable recovery after disruption
- Quantity conservation
- Capacity, temperature and receiving-window violations
- Human override rate and reason
- Unallocated or declined pounds, when known
- Route miles only when a verified baseline is available
- Whether unknown information was surfaced rather than fabricated

Success thresholds must be agreed with the pilot partner before reviewing results. Do not select thresholds after seeing the data.

## Level 3 — live shadow-pilot boundary

Duration: two to four weeks.

Almanac may generate a recommendation beside the existing process, but during shadow mode it must not:

- Accept or decline a donation
- Declare food safe
- Change authoritative inventory
- Dispatch a driver or vehicle
- Contact a donor or partner
- Replace the organization's existing system of record

The partner's existing procedure remains authoritative. A named staff member decides whether any Almanac output is useful.

### Required stop conditions

Stop the Almanac workflow and return to the partner's normal procedure when:

- Food condition, temperature history, source, quantity, or destination capacity is uncertain and operational review is required.
- The system produces a quantity-conservation, capacity, temperature, or receiving-window conflict.
- Required data is stale or unavailable.
- An AI response fails validation or contradicts the source message.
- The pilot owner requests a pause.
- A security, privacy, consent, or communications concern is reported.

## Pilot agreement checklist

Before Level 2 or Level 3, obtain written agreement on:

- Named sponsor, operational owner and technical contact
- Pilot level and exact workflow in scope
- Data fields, de-identification method, retention period and deletion date
- Who may access pilot data
- Baseline period and pre-registered success measures
- Manual fallback and incident owner
- Human approval and food-safety responsibility
- Communications and recording consent, if communications are ever enabled
- Permission to use anonymous findings, attributed quotes, or neither
- End-of-pilot export and deletion process

## Evidence that may be claimed afterward

Only after the corresponding work occurs:

- **Interviewed:** number of operators, broad roles and dates.
- **Usability tested:** task-completion results and recurring corrections.
- **Historically replayed:** number of de-identified cases and pre-registered comparison metrics.
- **Shadow piloted:** dates, participating organization with permission, scope and measured results.
- **Pilot commitment:** only when a named organization has approved it in writing.

Until then, use this statement:

> Almanac is a tested synthetic MVP prepared for operator usability validation. A configurable historical-data path and partner-approved shadow pilot are the next steps.
