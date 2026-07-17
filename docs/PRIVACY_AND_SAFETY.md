# Privacy and Safety

## Scope

Almanac is a food-bank operations prototype. It must not become a repository of real recipient medical data, a food-safety authority, or an autonomous dispatch system.

---

## Data-minimization rules

### Allowed in the prototype

- Synthetic partner agencies
- Synthetic donors, vehicles, and drivers
- Aggregate neighborhood or program demand
- Non-identifying usability categories
- Synthetic operating hours and capacity
- Seeded refusal and delivery notes
- Staff names that are clearly fictitious

### Not allowed

- Real recipient names
- Real addresses tied to households
- Real phone numbers or emails
- Medical diagnoses
- Immigration status
- Exact individual benefit status
- Unnecessary demographic attributes
- Real driver or employee personal data without explicit authorization
- Secrets, tokens, or credentials in client code

---

## Dietary and medical guardrails

The system may match food against staff-approved tags such as:

- Contains common allergen
- Gluten-free program eligible
- Low-sodium program category
- Vegan or vegetarian category
- No-cook
- Easy-open
- Refrigeration required
- Culturally preferred category

The system must not:

- Diagnose a condition
- Recommend medical treatment
- Guarantee that a product is allergen-free without verified product data
- Infer health status from location or behavior
- Present dietary matching as clinical advice

Show a disclaimer when dietary tags are displayed:

> Product tags support operational matching and do not replace ingredient review or medical guidance.

---

## Food-safety guardrails

AI or image analysis may:

- Flag visible damage
- Estimate urgency
- Identify missing condition information
- Recommend supervisor inspection
- Suggest refrigeration, cross-dock, or rapid distribution

AI may not:

- Declare food safe or unsafe
- Override a recall
- Replace temperature logs
- Ignore staff inspection
- Convert a “best by” date into an authoritative safety date

Any uncertain condition should result in:

```text
status = needs_inspection
```

---

## Human approval requirements

Human approval is required before:

- Accepting, partially accepting, redirecting, or declining a donation
- Finalizing an allocation plan
- Changing an approved mission
- Sending donor, driver, or agency communications
- Recording a product as disposed or rejected
- Overriding a capacity or safety warning

The interface must record:

- Approver
- Timestamp
- Original recommendation
- Final action
- Edit or override reason

---

## AI reliability rules

- Use structured output schemas.
- Reject invalid output.
- Preserve source provenance for any legacy upstream intake, but do not make donor messages or pickup data part of the hero lot.
- Show confidence by field when practical.
- Mark missing information explicitly.
- Use deterministic seeded fallback output if the model is unavailable.
- Never silently substitute invented addresses, quantities, or times.
- Log the model or ruleset version used for an agent run.

---

## Fairness rules

Do not collapse fairness and efficiency into one hidden score.

Show relevant factors such as:

- Recent service gap
- Travel burden
- Receiving-window compatibility
- Product urgency
- Need level
- Capacity
- Prior allocation
- Refusal risk

Allow staff to inspect and override plan weights. The selected weights are policy choices, not universal truth.

Avoid using protected characteristics unless an authorized and reviewed use is explicitly required. The prototype should use aggregate need and access indicators rather than individual attributes.

---

## Security rules

- Keep API keys server-side.
- Use environment variables.
- Never log secrets.
- Sanitize user-entered text before rendering.
- Validate identifiers and request bodies.
- Restrict demo-reset operations to demo mode.
- Do not include hidden production endpoints or credentials.
- Treat uploaded or pasted donor messages as untrusted input.

---

## Audit and traceability

Every consequential transition should create an audit event with:

- Event type
- Entity type and ID
- Actor type
- Actor ID or `demo_user`
- Timestamp
- Previous state
- New state
- Reason
- Related agent run

Audit history must be visible on the impact or mission screen.

---

## Accessibility and dignity

- Use respectful, non-stigmatizing language.
- Avoid labels such as “problem pantry” or “bad donor.”
- Prefer “constraint,” “follow-up needed,” or “receiving mismatch.”
- Do not expose neighborhood-level risk labels publicly without context.
- Meet WCAG-oriented keyboard, contrast, and screen-reader expectations.
- Never design the product to shame a household for preferences or inability to prepare food.

---

## Safety acceptance checklist

- [ ] No real recipient data is present.
- [ ] All dietary data is synthetic or aggregate.
- [ ] No screen claims AI certifies food safety.
- [ ] Human approval exists for consequential actions.
- [ ] Low-confidence output is visibly marked.
- [ ] Model failure has a deterministic fallback.
- [ ] Audit events are recorded.
- [ ] Fairness factors are inspectable.
- [ ] Demo metrics are labeled as simulated estimates.
- [ ] Secrets remain server-side.
