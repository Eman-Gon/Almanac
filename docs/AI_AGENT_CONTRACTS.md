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

## 1. Inventory Risk Review Agent

### Purpose

Summarize a structured inventory lot already inside the warehouse, surface missing operational facts, and explain why it needs attention.

### Inputs

- Runtime-validated `ProductLot`
- Current warehouse and timestamp
- Staff-entered condition status and notes

### Outputs

```ts
interface InventoryRiskOutput {
  inventoryLotId: string;
  availableQuantityLb: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  riskDeadline: string | null;
  conditionStatus: "staff_cleared" | "needs_confirmation" | "inspection_hold";
  warnings: string[];
  missingFields: string[];
  explanation: string;
}
```

### LLM responsibilities

- Summarize validated facts
- Explain the named risk signals
- Draft staff follow-up questions for missing fields

### Deterministic responsibilities

- Required-field and timestamp validation
- Available-quantity and risk-deadline calculation
- Warehouse lookup and temperature compatibility

### Prohibited behavior

- Inventing inventory, age, shelf life, inspection, or agency facts
- Certifying shelf life or safety
- Changing lot status or quantity

### Fallback

Load a deterministic explanation for validated `LOT-104` facts and record `fallback_used`. The lot remains usable without an LLM.

---

## 2. Capacity Agent

### Purpose

Determine whether candidate handling paths are operationally feasible.

### Inputs

- Product lot
- Warehouse long-term refrigerated-storage headroom
- Warehouse short-dwell refrigerated staging capacity
- Partner capacity
- Vehicle capacity
- Dock and receiving windows
- Packing-program confirmed demand

### Outputs

```ts
interface CapacityAssessment {
  warehouseFeasible: boolean;
  compatibleWarehouseCapacityLb: number;
  refrigeratedStagingCapacityAvailableLb: number;
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
- Treating short-dwell staging as interchangeable with long-term storage
- Approving an override

---

## 3. Need-Matching Agent

### Purpose

Rank compatible destinations using documented need, usability, windows, capacity, service gaps, travel, urgency, and category-specific historical acceptance/refusal evidence.

### Inputs

- Product lot
- Partner agencies
- Demand signals
- Agency acceptance histories with accepted, refused, and short-receipt counts plus sample size
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
- Historical acceptance signal and sample size
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

- Product lot
- Capacity assessment
- Destination ranking
- Route matrix
- Scenario assumptions

### Required options

1. Hold for Later
2. Fastest Agency Release
3. Balanced Release

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
- Warehouse origin and partner locations
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

- Preserve only completed stops whose location and load/drop-off quantities are unchanged
- Replan only remaining work
- Mark the canceled partner and affected original stop `canceled`
- Mark original mission as superseded after approval
- Recalculate metrics
- Create audit events

After human approval, deterministic execution services create `PKG-105` and `MSN-105`. `PKG-105` uses non-colliding IDs and, when a completed destination/staging quantity grows, separates the already-packed amount from a pending recovery-only delta. The agent does not fabricate or silently activate those resources.

### Prohibited behavior

- Rewriting history
- Moving delivered quantity
- Silently approving the replacement

---

## Optional stretch agent: Communication Draft Agent

### Purpose

Draft operational messages after a human-approved decision.

### Inputs

- Approved action
- Recipient role: partner agency or warehouse lead
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

This agent is outside the judged hero. Vapi or any other live delivery transport must remain disabled and absent from primary navigation; the MVP proves the approved decision and instructions, not outreach automation.

---

## Optional stretch agent: Notes-to-Action Agent

### Purpose

Convert driver, receiving, or refusal notes into structured follow-up suggestions.

### Outputs may include

- Issue category
- Partner or warehouse team needing follow-up
- Repeated pattern
- Suggested operational rule
- Confidence

Every proposed rule requires human approval.

---

## Error handling

| Failure | Required behavior |
|---|---|
| Primary model timeout or provider error | Try the configured backup once, then use deterministic fallback and log warnings |
| Invalid JSON | Retry once using the configured backup with a schema reminder; if no backup exists, retry the primary once, then fallback |
| Missing required field | Return `needs_confirmation` |
| No feasible plan | Explain constraints and suggest retention, partial outbound allocation, or an approved transfer path |
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
Inventory Agent reviewed lot risk
Capacity Agent checked refrigeration
Need Agent evaluated 10 partners and their category history
Planning Agent generated 3 plans
Routing Agent calculated mission
```

Do not imply that each line is an unconstrained autonomous actor.
