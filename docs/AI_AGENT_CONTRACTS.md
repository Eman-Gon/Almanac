# AI Agent Contracts

## Architecture principle

ChoiceGrid uses a set of specialized agents, but the word **agent** does not mean unrestricted autonomy. Each agent has a narrow contract, structured inputs and outputs, explicit failure behavior, and human review where consequences matter.

Quantitative calculations must be deterministic. LLMs may interpret text and produce explanations but must not be the source of authoritative capacities, quantities, route distances, or food-safety decisions.

---

## Shared agent envelope

```ts
interface AgentResult<T> {
  runId: string;
  status: "success" | "failed" | "fallback_used";
  data?: T;
  confidence?: "high" | "medium" | "low" | "unknown";
  warnings: string[];
  missingFields: string[];
  modelOrRuleset: string;
  startedAt: string;
  completedAt: string;
}
```

Every output must be runtime-validated.

---

## 1. Intake Agent

### Purpose

Convert a donor message or form into a structured donation offer.

### Inputs

- Raw donor message
- Optional known donor ID
- Current timestamp
- Optional image metadata, not required for MVP

### Outputs

```ts
interface IntakeOutput {
  productDescription: string | null;
  quantityLb: number | null;
  temperatureClass: "ambient" | "refrigerated" | "frozen" | null;
  pickupLocation: GeoLocation | null;
  pickupWindow: TimeWindow | null;
  estimatedRiskDeadline: string | null;
  conditionNotes: string | null;
  fields: ExtractedField[];
  followUpQuestions: string[];
}
```

### LLM responsibilities

- Extract explicitly stated details
- Normalize obvious units when conversion is known
- Identify ambiguity
- Draft follow-up questions

### Deterministic responsibilities

- Unit conversion
- Required-field validation
- Timestamp validation
- Donor lookup

### Prohibited behavior

- Inventing an address
- Guessing quantity from vague language without marking it low confidence
- Certifying shelf life or safety
- Accepting the donation

### Fallback

Load the seeded `DON-104` extraction result and record `fallback_used`.

---

## 2. Capacity Agent

### Purpose

Determine whether candidate handling paths are operationally feasible.

### Inputs

- Donation offer
- Product lot
- Warehouse capacity
- Partner capacity
- Vehicle capacity
- Dock and receiving windows
- Optional packing capacity

### Outputs

```ts
interface CapacityAssessment {
  warehouseFeasible: boolean;
  compatibleWarehouseCapacityLb: number;
  directDistributionFeasible: boolean;
  vehicleOptions: string[];
  capacityWarnings: CapacityWarning[];
  maxAcceptableQuantityLb: number;
}
```

### Implementation

Fully deterministic. The agent label represents a bounded service, not an LLM call.

### Prohibited behavior

- Ignoring temperature compatibility
- Treating unavailable capacity as available
- Approving an override

---

## 3. Need-Matching Agent

### Purpose

Rank compatible destinations using documented need, usability, windows, capacity, service gaps, travel, urgency, and refusal risk.

### Inputs

- Product lot
- Partner agencies
- Demand signals
- Capacity assessment
- Score-weight configuration
- Route-distance matrix

### Outputs

```ts
interface DestinationRanking {
  rankedDestinations: RankedDestination[];
  excludedDestinations: DestinationExclusion[];
  scoreVersion: string;
}
```

### Implementation

- Deterministic score calculation
- Optional LLM-generated plain-language explanation based only on score components

### Required explanation

For every recommended destination, state:

- Top positive factors
- Capacity and window fit
- Relevant penalty
- Any assumptions

### Prohibited behavior

- Inferring medical need
- Hiding score components
- Using protected characteristics without approved policy

---

## 4. Planning Agent

### Purpose

Create three complete and feasible plan options.

### Inputs

- Donation offer
- Product lot
- Capacity assessment
- Destination ranking
- Route matrix
- Scenario assumptions

### Required options

1. Warehouse First
2. Direct Distribution
3. Mixed Plan

The planner may omit an option only if it is demonstrably infeasible, in which case it must explain why and provide another feasible option.

### Outputs

```ts
interface PlanningOutput {
  planSet: PlanSet;
  recommendation?: {
    planOptionId: string;
    explanation: string;
  };
}
```

### Deterministic responsibilities

- Allocate quantities
- Enforce capacity
- Conserve quantity
- Calculate metrics
- Check risk deadlines

### LLM responsibilities

- Name or summarize plans
- Explain tradeoffs from calculated values

### Prohibited behavior

- Creating quantity that does not exist
- Assigning incompatible product
- Approving a plan

---

## 5. Routing Agent

### Purpose

Convert an approved plan into a feasible stop sequence and map representation.

### Inputs

- Approved allocations
- Donor, warehouse, partner locations
- Receiving windows
- Vehicle and driver
- Precomputed distance and duration matrix

### Outputs

```ts
interface RoutingOutput {
  mission: Mission;
  feasibility: "feasible" | "warning" | "infeasible";
  warnings: string[];
}
```

### Implementation

Deterministic heuristic or seeded route templates. A live external route provider must not be required for the demo.

### Prohibited behavior

- Returning arrival times outside windows without warning
- Exceeding vehicle capacity
- Dispatching the mission without approval

---

## 6. Recovery Agent

### Purpose

Generate replacement options after a disruption.

### Inputs

- Original mission
- Disruption
- Remaining undelivered quantity
- Current time
- Current capacities and availability
- Route matrix

### Outputs

```ts
interface RecoveryOutput {
  impactSummary: {
    affectedQuantityLb: number;
    affectedStops: string[];
    reasonOriginalPlanFailed: string;
  };
  replacementOptions: PlanOption[];
}
```

### Required behavior

- Preserve completed stops
- Replan only remaining work
- Mark original mission as superseded after approval
- Recalculate metrics
- Create audit events

### Prohibited behavior

- Rewriting history
- Moving delivered quantity
- Silently approving the replacement

---

## 7. Communication Agent

### Purpose

Draft operational messages after a human-approved decision.

### Inputs

- Approved action
- Recipient role: donor, driver, partner agency, warehouse lead
- Relevant times, quantities, and instructions
- Communication style configuration

### Outputs

```ts
interface CommunicationDraft {
  channel: "email" | "sms" | "in_app";
  subject?: string;
  body: string;
  factsUsed: string[];
}
```

### Required behavior

- Use only approved facts
- Keep messages concise
- Mark as draft
- Require human send action

### Prohibited behavior

- Sending automatically
- Inventing contacts or commitments
- Including unnecessary sensitive data

---

## Optional stretch agent: Notes-to-Action Agent

### Purpose

Convert driver, receiving, or refusal notes into structured follow-up suggestions.

### Outputs may include

- Issue category
- Partner or donor needing follow-up
- Repeated pattern
- Suggested operational rule
- Confidence

Every proposed rule requires human approval.

---

## Error handling

| Failure | Required behavior |
|---|---|
| Model timeout | Use deterministic fallback and log warning |
| Invalid JSON | Retry once with schema reminder, then fallback |
| Missing required field | Return `needs_confirmation` |
| No feasible plan | Explain constraints and suggest partial acceptance or redirect |
| Route infeasible | Return warning or infeasible status; do not hide failure |
| Score configuration missing | Load versioned default configuration |

---

## Agent observability

Each run should record:

- Agent type
- Entity ID
- Start and end time
- Status
- Model or ruleset version
- Confidence
- Warnings
- Error code
- Fallback use

The UI may show a simplified timeline:

```text
Intake Agent parsed offer
Capacity Agent checked refrigeration
Need Agent evaluated 10 partners
Planning Agent generated 3 plans
Routing Agent calculated mission
```

Do not imply that each line is an unconstrained autonomous actor.
