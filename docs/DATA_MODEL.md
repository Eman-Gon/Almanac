# Data Model

## Conventions

- IDs use stable prefixed strings such as `DON-104` or `PAR-012`.
- Times use ISO 8601.
- Food weight uses pounds in the MVP.
- Capacity fields include explicit units.
- Types shown below are conceptual TypeScript contracts; implementation schemas should be generated or validated with Zod.

---

## Shared types

```ts
type EntityId = string;
type ISODateTime = string;
type Confidence = "high" | "medium" | "low" | "unknown";
type TemperatureClass = "ambient" | "refrigerated" | "frozen";
type RiskLevel = "low" | "medium" | "high" | "critical";
type DataSource = "seed" | "user" | "agent" | "calculated";
```

---

## Donor

```ts
interface Donor {
  id: EntityId;
  name: string;
  type: "retailer" | "farm" | "manufacturer" | "distributor" | "other";
  location: GeoLocation;
  contactName?: string;
  contactChannel?: string;
  reliability: DonorReliability;
  active: boolean;
}

interface DonorReliability {
  deliveredVsCommittedPct: number;
  onTimePct: number;
  conditionIssueRatePct: number;
  sampleSize: number;
}
```

---

## Donation offer

```ts
type DonationStatus =
  | "draft"
  | "needs_confirmation"
  | "ready_for_planning"
  | "plans_generated"
  | "awaiting_approval"
  | "approved"
  | "partially_accepted"
  | "declined"
  | "redirected"
  | "in_execution"
  | "closed";

interface DonationOffer {
  id: EntityId;
  donorId: EntityId;
  sourceText: string;
  productDescription: string;
  quantityLb: number;
  temperatureClass: TemperatureClass;
  pickupLocation: GeoLocation | null;
  pickupWindow: TimeWindow | null;
  estimatedRiskDeadline: ISODateTime | null;
  conditionNotes?: string;
  status: DonationStatus;
  extractedFields: ExtractedField[];
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

interface ExtractedField {
  field: string;
  value: unknown;
  confidence: Confidence;
  sourceSpan?: string;
  needsConfirmation: boolean;
}
```

---

## Product lot

```ts
interface ProductLot {
  id: EntityId;
  donationId?: EntityId;
  productName: string;
  category: ProductCategory;
  quantityLb: number;
  temperatureClass: TemperatureClass;
  receivedAt?: ISODateTime;
  riskDeadline?: ISODateTime;
  riskLevel: RiskLevel;
  usabilityTags: UsabilityTag[];
  currentLocationId: EntityId;
  status: "offered" | "inbound" | "receiving" | "available" | "allocated" | "inspection_hold" | "distributed" | "disposed";
}

type ProductCategory =
  | "produce"
  | "protein"
  | "dairy"
  | "grain"
  | "prepared"
  | "shelf_stable"
  | "beverage"
  | "other";

type UsabilityTag =
  | "no_cook"
  | "easy_open"
  | "requires_refrigeration"
  | "requires_freezer"
  | "low_sodium_program"
  | "gluten_free_program"
  | "vegan_program"
  | "vegetarian_program"
  | "culturally_preferred"
  | "family_meal_component";
```

---

## Locations

```ts
interface GeoLocation {
  address: string;
  city: string;
  region: string;
  postalCode: string;
  latitude: number;
  longitude: number;
}

interface TimeWindow {
  start: ISODateTime;
  end: ISODateTime;
}
```

---

## Warehouse

```ts
interface Warehouse {
  id: EntityId;
  name: string;
  location: GeoLocation;
  dryCapacityLb: number;
  refrigeratedCapacityLb: number;
  frozenCapacityLb: number;
  occupiedDryLb: number;
  occupiedRefrigeratedLb: number;
  occupiedFrozenLb: number;
  refrigeratedStagingCapacityAvailableLb: number;
  dockWindows: TimeWindow[];
  active: boolean;
}
```

`refrigeratedCapacityLb - occupiedRefrigeratedLb` is long-term refrigerated-storage headroom. `refrigeratedStagingCapacityAvailableLb` is a separate short-dwell, same-day staging constraint. An allocation with `handling: "store"` or an inspection hold consumes long-term storage headroom; an allocation with `handling: "pack"` consumes staging capacity. The same pounds must never be counted against both pools unless the operational workflow explicitly moves them between pools at different modeled times.

---

## Partner agency

```ts
interface PartnerAgency {
  id: EntityId;
  name: string;
  agencyType: "pantry" | "meal_program" | "shelter" | "school" | "mobile_site" | "other";
  location: GeoLocation;
  receivingWindows: TimeWindow[];
  dryCapacityAvailableLb: number;
  refrigeratedCapacityAvailableLb: number;
  frozenCapacityAvailableLb: number;
  demandSignals: DemandSignal[];
  acceptedCategories: ProductCategory[];
  preferredTags: UsabilityTag[];
  refusalRisk: number;
  recentServiceGap: number;
  accessBurden: number;
  status: "available" | "limited" | "unavailable" | "canceled";
  notes: OperationalNote[];
}

interface DemandSignal {
  id: EntityId;
  partnerId: EntityId;
  category: ProductCategory;
  desiredQuantityLb: number;
  urgency: RiskLevel;
  usabilityTags: UsabilityTag[];
  validUntil: ISODateTime;
  source: "order" | "service_history" | "staff_entry" | "aggregate_request" | "seed";
}
```

---

## Vehicle and driver

```ts
interface Vehicle {
  id: EntityId;
  name: string;
  capacityLb: number;
  temperatureCapability: TemperatureClass[];
  status: "available" | "assigned" | "unavailable" | "maintenance";
  currentLocation: GeoLocation;
}

interface Driver {
  id: EntityId;
  name: string;
  status: "available" | "assigned" | "unavailable";
  shiftWindow: TimeWindow;
}
```

---

## Plan and allocation

```ts
type PlanStatus = "generated" | "selected" | "approved" | "rejected" | "superseded";

interface PlanSet {
  id: EntityId;
  donationId: EntityId;
  options: PlanOption[];
  generatedAt: ISODateTime;
  selectedOptionId?: EntityId;
  approvedOptionId?: EntityId;
}

interface PlanOption {
  id: EntityId;
  planSetId: EntityId;
  name: string;
  strategy: "warehouse_first" | "direct_distribution" | "mixed" | "custom";
  status: PlanStatus;
  allocations: Allocation[];
  inspectionHoldLb: number;
  declinedLb: number;
  metrics: PlanMetrics;
  assumptions: string[];
  risks: PlanRisk[];
  excludedDestinations: DestinationExclusion[];
}

interface Allocation {
  id: EntityId;
  productLotId: EntityId;
  destinationId: EntityId;
  destinationType: "warehouse" | "partner" | "packing_program" | "external_redirect";
  quantityLb: number;
  plannedArrivalAt: ISODateTime;
  handling: "store" | "cross_dock" | "pack" | "inspect" | "redirect";
  score: DestinationScore;
}

interface DestinationScore {
  total: number;
  documentedNeed: number;
  usabilityMatch: number;
  receivingWindowFit: number;
  availableCapacity: number;
  recentServiceGap: number;
  equityPriority: number;
  travelPenalty: number;
  spoilagePenalty: number;
  refusalRiskPenalty: number;
}

interface PlanMetrics {
  quantityDistributedInTimeLb: number;
  expectedSpoilageLb: number;
  estimatedHouseholdsSupported: number;
  totalMiles: number;
  staffMinutes: number;
  coldCapacityUtilizationPct: number;
  refrigeratedStagingUtilizationPct: number;
  needMatchScore: number;
  equityIndicator: number;
  refusalRiskScore: number;
}
```

Plan edits are quantity-only overlays on a canonical `PlanOption`. The system accepts changed `Allocation.quantityLb` values only when plan and allocation identities still match, then reconstructs all authoritative fields from the canonical option. Distributed pounds, households, long-term storage use, and refrigerated-staging use are quantity-derived. Route miles, expected spoilage, staff minutes, need-match, equity, and refusal risk remain seeded strategy-level scenario estimates until quantity-sensitive formulas exist.

---

## Packing plan

```ts
interface PackingPlan {
  id: EntityId;
  approvedPlanOptionId: EntityId;
  batches: PackingBatch[];
  status: "draft" | "ready" | "in_progress" | "complete";
}

interface PackingBatch {
  id: EntityId;
  destinationId: EntityId;
  productLotId: EntityId;
  quantityLb: number;
  priority: number;
  stagingLocation: string;
  temperatureClass: TemperatureClass;
  instruction: string;
  status: "pending" | "complete";
}
```

The relevant `DemoState` fields store packing plans by ID rather than as one replaceable value:

```ts
interface DemoState {
  packingPlans: Record<string, PackingPlan>;
  activePackingPlanId: string | null;
}
```

Plan approval inserts `PKG-104` with `BAT-001`-series batches. Recovery approval inserts and activates `PKG-105` with non-colliding `BAT-101`-series batches without deleting `PKG-104`. If a completed destination/staging batch gains quantity during recovery, the replacement splits it into an already-packed `-C` batch and a pending recovery-only `-R` delta. `PKG-104` is historical and read-only after recovery.

---

## Mission and route

```ts
type MissionStatus =
  | "draft"
  | "approved"
  | "assigned"
  | "in_transit"
  | "disrupted"
  | "replanning"
  | "superseded"
  | "delivered"
  | "closed";

interface Mission {
  id: EntityId;
  donationId: EntityId;
  approvedPlanOptionId: EntityId;
  vehicleId: EntityId;
  driverId: EntityId;
  stops: RouteStop[];
  routeLegs: RouteLeg[];
  status: MissionStatus;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

interface RouteStop {
  id: EntityId;
  sequence: number;
  locationId: EntityId;
  locationType: "donor" | "warehouse" | "partner";
  arrivalWindow: TimeWindow;
  quantityPickupLb: number;
  quantityDropoffLb: number;
  status: "pending" | "arrived" | "complete" | "canceled" | "skipped";
  instructions: string[];
}

interface RouteLeg {
  fromStopId: EntityId;
  toStopId: EntityId;
  distanceMiles: number;
  durationMinutes: number;
  polyline: [number, number][];
}
```

The seeded strategy templates sum to 18.4 miles for Warehouse First, 45.7 miles for Direct Distribution, and 24.8 miles for Mixed Plan. A mission may complete only its first pending stop; canceled stops are skipped and out-of-order completion is rejected.

---

## Disruption and recovery

```ts
interface Disruption {
  id: EntityId;
  missionId: EntityId;
  type: "partner_canceled" | "vehicle_breakdown" | "capacity_loss" | "driver_unavailable" | "quantity_changed" | "pickup_window_changed";
  occurredAt: ISODateTime;
  affectedEntityId: EntityId;
  details: Record<string, unknown>;
  status: "open" | "plan_generated" | "resolved";
}

interface RecoveryPlan {
  id: EntityId;
  disruptionId: EntityId;
  supersedesMissionId: EntityId;
  replacementPlanOption: PlanOption;
  replacementMission?: Mission;
  approvalStatus: "awaiting_approval" | "approved" | "rejected";
}
```

---

## Agent and audit records

```ts
interface AgentRun {
  id: EntityId;
  agentType: "intake" | "capacity" | "matching" | "planning" | "routing" | "recovery" | "communication";
  entityId: EntityId;
  startedAt: ISODateTime;
  completedAt?: ISODateTime;
  status: "running" | "success" | "failed" | "fallback_used";
  confidence?: Confidence;
  modelOrRuleset: string;
  inputHash?: string;
  errorCode?: string;
}

interface AuditEvent {
  id: EntityId;
  eventType: string;
  entityType: string;
  entityId: EntityId;
  actorType: "human" | "agent" | "system";
  actorId: EntityId;
  occurredAt: ISODateTime;
  previousState?: unknown;
  newState?: unknown;
  reason?: string;
  agentRunId?: EntityId;
}

interface OperationalNote {
  id: EntityId;
  authorRole: string;
  text: string;
  createdAt: ISODateTime;
  tags: string[];
}
```

---

## Invariants

1. Quantities must be nonnegative.
2. Approved allocation totals cannot exceed accepted quantity.
3. Destination allocations cannot exceed compatible capacity without an explicit override.
4. Vehicle load cannot exceed capacity.
5. Temperature capability must match product requirement.
6. A plan must identify all offered quantity as accepted, declined, redirected, held, or unresolved.
7. Only approved plans create executable missions.
8. Consequential status changes create audit events.
9. Replanned missions supersede rather than silently overwrite the original mission.
10. Unknown values remain unknown until confirmed.
11. Long-term refrigerated storage and short-dwell refrigerated staging are validated as separate capacity pools.
12. Completing a packing batch changes only its completion status; it cannot change approved quantities.
13. Recovery packing uses non-colliding batch IDs and separates already-packed quantity from a pending recovery-only delta when a completed destination/staging batch grows.
14. Canonical plan and allocation identities cannot be changed through quantity editing; submitted metrics are not authoritative.
15. Mission stops complete in route sequence, and a superseded mission or historical packing plan is read-only.

---

## Minimum seed dataset

- `DON-104`: 1,200 lb strawberries
- `DON-096` through `DON-103`: display-only synthetic donation-history summaries with terminal outcomes; these are not executable offers and do not enter calculations
- `WH-001`: primary warehouse near refrigerated capacity
- `PAR-001` through `PAR-010`: partner agencies with varied windows and capacity
- `VEH-001` through `VEH-003`: vehicle fleet
- `DRV-001` through `DRV-004`: synthetic drivers
- Three plan options
- One primary packing plan created after approval and one deterministic replacement packing plan created after recovery approval
- One primary mission created after approval and one deterministic replacement mission created after recovery approval
- One executable partner-cancellation fixture
- Disabled preview controls for additional disruption concepts; previews are not executable fixtures
