# Food-Bank Interview Guide

## Current evidence status

No food-bank interview has occurred or is documented in this repository. This guide is a future validation tool and must not block development or be described as completed research.

## Objective and time box

Maximum duration: 20 minutes.

Validate whether the Strawberry Rescue workflow, capacity model, approval points, disruption handling, and evidence language reflect real operator needs. Do not request recipient records, medical information, credentials, or other sensitive data.

## Opening — 2 minutes

Suggested introduction:

> “We are testing a synthetic prototype for urgent food-donation allocation and recovery. We are not asking for recipient data or evaluating your organization. We want to learn where the workflow or assumptions are unrealistic.”

Record the participant's role only at a broad level, such as operations, warehouse, donation coordination, dispatch, or partner-agency coordination.

## Questions — 15 minutes

1. When an urgent perishable donation arrives, what facts must be confirmed before anyone can plan or accept it?

   **Assumption to validate:** Product, quantity, condition, pickup window, location, and temperature requirement are the minimum useful intake fields.

   **Notes:**

   ________________________________________________________________________________

2. How do you distinguish long-term refrigerated storage from cross-dock or short-dwell refrigerated staging in day-to-day decisions?

   **Assumption to validate:** These are separate capacity pools and should not be treated as interchangeable.

   **Notes:**

   ________________________________________________________________________________

3. Which partner facts most often make an allocation infeasible: capacity, confirmed demand, receiving staff, hours, product fit, transportation, or something else?

   **Assumption to validate:** Capacity, demand, status, product compatibility, and receiving windows are useful hard constraints or ranking inputs.

   **Notes:**

   ________________________________________________________________________________

4. If a partner cancels after approval, what work should be preserved, what must be recalculated, and who approves the replacement?

   **Assumption to validate:** The canceled partner and stop should remain in history, unaffected work should remain intact, and replacement allocation requires human approval.

   **Notes:**

   ________________________________________________________________________________

5. Are destination-level packing batches and `pending | complete` status useful at this level, or would staff need different units, labels, or checkpoints?

   **Assumption to validate:** Per-batch progress is useful as long as it cannot alter approved quantities.

   **Notes:**

   ________________________________________________________________________________

6. What explanation would you need before approving a recommended allocation plan?

   **Assumption to validate:** Contributing factors, hard constraints, exclusions, assumptions, confidence, and alternatives are sufficient for review.

   **Notes:**

   ________________________________________________________________________________

7. Which prototype metrics would be credible enough to display, and which would require stronger operational data or different wording?

   **Assumption to validate:** Assigned pounds, route miles, capacity utilization, audit events, and explicitly modeled estimates are more credible than unsupported “food saved” claims.

   **Notes:**

   ________________________________________________________________________________

## Close — 3 minutes

Ask:

> “What is the single most unrealistic or missing part of this workflow?”

**Notes:**

________________________________________________________________________________

## Post-interview record

- Date: ____________________
- Broad participant role: ____________________
- Interviewer: ____________________
- Permission to retain anonymized notes: Yes / No
- Top workflow correction: ______________________________________________________
- Assumption confirmed: _________________________________________________________
- Assumption rejected or still uncertain: _______________________________________
- Follow-up that does not require sensitive data: ________________________________

Until these fields contain real notes from an actual conversation, continue to state that no interview has occurred.

