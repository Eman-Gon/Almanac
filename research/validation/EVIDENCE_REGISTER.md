# ChoiceGrid Validation Evidence Register

## Status summary

```yaml
last_updated: 2026-07-16
completed_consented_sessions: 0
organizations_represented: 0
written_pilot_commitments: 0
historical_cases_replayed: 0
live_shadow_cases_observed: 0
```

This file begins at zero intentionally. Do not add planned calls, informal enthusiasm or challenge-language evidence to completed validation counts.

Store only de-identified summaries here. Keep participant names, contact information, recordings, scheduling details, signed agreements and sensitive operational records outside the public repository.

## Evidence strength

| Evidence type | What it can support | What it cannot support |
|---|---|---|
| Official challenge request | The problem or capability was requested by challenge organizers | ChoiceGrid adoption or effectiveness |
| Completed operator interview | What that participant reported about their workflow | Market-wide demand |
| Observed usability session | Whether that participant completed defined tasks in the tested scenario | Live operational impact |
| Pilot interest | Willingness to continue a conversation | A committed pilot |
| Written pilot agreement | A named organization's willingness to run the agreed evaluation | Product effectiveness before results exist |
| Historical replay | Performance on the reported de-identified cases | Prospective live performance |
| Shadow-pilot observation | Performance beside existing procedures for the stated sample and dates | Production readiness outside that scope |

## Session register

Add one row only after the participant has consented to de-identified notes.

| Session ID | Date | Broad role | Organization label | Discovery completed | Usability completed | Quote permission | Continue interest | Sanitized summary status |
|---|---|---|---|---|---|---|---|---|
| _No completed sessions_ | | | | | | | | |

## Finding register

Record both supporting and contradicting findings. One session may contribute multiple findings.

| Finding ID | Session ID | Type | Finding | Evidence basis | Severity | Product implication |
|---|---|---|---|---|---|---|
| _No findings recorded_ | | | | | | |

Allowed `Type` values:

- `supports_assumption`
- `contradicts_assumption`
- `new_requirement`
- `usability_issue`
- `safety_or_authority_issue`
- `metric_feedback`
- `pilot_interest`

## Usability result register

| Session ID | Task ID | Result | Seconds | Moderator prompt | Issue summary |
|---|---|---|---:|---|---|
| _No results recorded_ | | | | | |

Use `completed`, `completed_with_prompt`, or `not_completed` for `Result`.

## Pilot commitment register

Do not add an organization until written approval exists. Keep the agreement itself outside the repository.

| Commitment ID | Organization label approved for use | Approval date | Pilot level | Named owner confirmed | Scope recorded | Status |
|---|---|---|---|---|---|---|
| _No written commitments_ | | | | | | |

## Historical or shadow-case register

This section remains empty until a configurable, approved de-identified case path exists.

| Case ID | Mode | Date | Evaluable | Quantity conserved | Approval preserved | Constraint violation | Override | Outcome notes |
|---|---|---|---|---|---|---|---|---|
| _No cases evaluated_ | | | | | | | | |

Allowed `Mode` values:

- `historical_replay`
- `live_shadow`

## Synthesis template

Complete only after the relevant evidence exists:

- Completed consented sessions: ____
- Broad roles represented: ____
- Organizations represented: ____
- Participants completing all critical tasks without moderator takeover: ____ / ____
- Participants providing a recent example of the core problem: ____ / ____
- Participants willing to continue validation: ____ / ____
- Written pilot commitments: ____
- Highest unresolved issue severity: ____
- Strongest supporting finding: _________________________________________________
- Strongest contradicting finding: ______________________________________________
- Decision: `continue`, `iterate`, or `stop`

Never replace the zero counts or empty rows with estimates.
