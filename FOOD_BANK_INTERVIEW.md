# ChoiceGrid Operator Discovery and Usability Guide

## Current evidence status

No food-bank interview or operator usability session has occurred or is documented in this repository. This guide is a future validation tool and must not be described as completed research.

Track only completed, consented sessions in [`research/validation/EVIDENCE_REGISTER.md`](research/validation/EVIDENCE_REGISTER.md).

## Recruitment target

Recruit five to eight operators across at least three of these functions, preferably from two organizations:

- Donation coordination or sourcing
- Warehouse or inventory operations
- Dispatch or transportation
- Partner-agency coordination
- Operations leadership

Do not recruit only executives or only people already enthusiastic about the concept. The goal is to find workflow errors and rejected assumptions, not collect praise.

## Outreach message

> We built a synthetic prototype for moving at-risk food already inside a food-bank warehouse. We are looking for 25 minutes with operations or warehouse staff to learn where the allocation and recovery workflow is unrealistic. This is research, not a sales demo. We will not request recipient data, credentials, donor records, or other sensitive information. Would you walk through one synthetic scenario and tell us what we got wrong?

Keep names, email addresses and scheduling details outside the public repository.

## Consent before notes or recording

Read this before beginning:

> We are testing the workflow, not you. The scenario and organizations in the prototype are synthetic. You may skip any question or stop at any time. Please do not share recipient records, credentials, confidential contracts, exact addresses or other sensitive operational data.

Record the participant's choices before taking notes:

- Permission to retain de-identified notes: Yes / No
- Permission to record audio or video: Yes / No
- Quote permission: None / Anonymous / Attributed
- If attributed, approved role and organization wording: __________________________

If note permission is declined, thank the participant and do not create an evidence-register entry beyond an optional aggregate count that contains no identifying information.

## Session plan — 25 minutes

### Part A — neutral discovery before showing ChoiceGrid, 8 minutes

Begin with a recent example. Do not describe ChoiceGrid's solution first.

1. Tell me about the most recent lot that was already in the warehouse but was not moving quickly enough. How did the team decide where it should go?
2. Which people, tools, spreadsheets, calls or systems were involved at each handoff?
3. What information was missing or changed while the decision was being made?
4. How often do partner cancellations, receiving-window changes, vehicle problems or capacity surprises materially affect the plan?
5. What is the consequence when the team cannot place or reroute the food in time?
6. Who has authority to approve the allocation, accept food condition, change warehouse work and dispatch a vehicle?

Follow up with “What happened next?” and “Can you give a recent example?” Avoid turning assumptions into yes/no questions.

### Part B — observed prototype tasks, 12 minutes

Open the reset Strawberry Rescue scenario. Ask the participant to think aloud, but do not point to the control they need.

| Task | Success evidence | Watch for |
|---|---|---|
| 1. Review the lot | Identifies available quantity, risk deadline, refrigeration, condition status, and uncertainty | Treating a risk flag as food-safety approval |
| 2. Find blocking information | Identifies missing or uncertain facts and explains what requires confirmation | Assuming unknown values are confirmed |
| 3. Compare plans | Explains why Hold for Later is blocked, reviews acceptance-history sample size, and names a Balanced Release tradeoff | Choosing only by history, distance, or recommendation badge |
| 4. Review approval | Identifies who approves and what the approval changes | Believing AI already accepted or dispatched |
| 5. Inspect execution | Finds packing quantities, vehicle, stops and receiving windows | Confusing progress status with quantity authority |
| 6. Recover from cancellation | Identifies 320 affected pounds, reviews the replacement and finds the second approval | Missing the canceled history or assuming recovery is automatic |
| 7. Interpret impact | Distinguishes calculated scenario values from observed impact | Saying “saved,” “served” or “time saved” |

For each task record:

- `completed`, `completed_with_prompt`, or `not_completed`
- Elapsed seconds
- Moderator prompt, if any
- Error, hesitation or safety misunderstanding
- Requested workflow, terminology or data correction

Do not correct the participant until the task is clearly blocked. The confusion is evidence about the product.

### Part C — reflection and pilot interest, 5 minutes

Ask:

1. What is the single most unrealistic or missing part of this workflow?
2. Which recommendation factor or explanation would you need before approving a plan?
3. What would make you reject this tool even if the calculations were correct?
4. Which outcomes would be credible to measure in a historical replay or shadow evaluation?
5. Would you participate in a supervised evaluation where your current process remains authoritative? Why or why not?
6. Who would need to approve access to de-identified historical cases or a shadow pilot?

“Interested” is not a pilot commitment. Record a commitment only when a named organization has approved it in writing.

## Post-session record

- Session ID: ____________________
- Date: ____________________
- Broad participant role: ____________________
- Organization label: Withheld / Approved anonymous label / Approved name
- Interviewer: ____________________
- De-identified notes permission: Yes / No
- Recording permission: Yes / No
- Quote permission: None / Anonymous / Attributed
- Critical tasks completed without prompt: ____ / 7
- Highest issue severity: None / Low / Medium / High / Critical
- Recent real example supplied: Yes / No
- Top workflow correction: ______________________________________________________
- Assumption supported: __________________________________________________________
- Assumption contradicted or uncertain: __________________________________________
- Willing to continue validation: Yes / Maybe / No
- Written pilot commitment received: Yes / No

## Issue severity

| Severity | Definition |
|---|---|
| Critical | Could enable an unsafe decision, unauthorized action, hidden quantity error or loss of human control |
| High | Blocks a critical task or makes the recommendation materially misleading |
| Medium | Causes substantial confusion or requires moderator rescue but has a workaround |
| Low | Wording, discoverability or polish issue that does not alter the decision |

## Synthesis rules

- Report denominators, such as “4 of 6 participants,” rather than “operators agreed.”
- Include contradicting evidence and rejected assumptions.
- Separate reported behavior from observed task behavior.
- Separate pilot interest from a written pilot commitment.
- Never place raw recordings, names, email addresses, confidential examples or recipient information in the repository.
- Do not generalize five interviews to all food banks.

Until the evidence register contains completed, consented sessions, continue to state that no operator validation has occurred.
