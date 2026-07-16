import { z } from "zod";

export const EntityIdSchema = z.string().min(1);
export const ISODateTimeSchema = z.string().datetime({ offset: true });

export const ConfidenceSchema = z.enum(["high", "medium", "low", "unknown"]);
export const TemperatureClassSchema = z.enum([
  "ambient",
  "refrigerated",
  "frozen",
]);
export const RiskLevelSchema = z.enum(["low", "medium", "high", "critical"]);
export const DataSourceSchema = z.enum(["seed", "user", "agent", "calculated"]);

export const DonationStatusSchema = z.enum([
  "draft",
  "needs_confirmation",
  "ready_for_planning",
  "plans_generated",
  "awaiting_approval",
  "approved",
  "partially_accepted",
  "declined",
  "redirected",
  "in_execution",
  "closed",
]);

export const ProductLotStatusSchema = z.enum([
  "offered",
  "inbound",
  "receiving",
  "available",
  "allocated",
  "inspection_hold",
  "distributed",
  "disposed",
]);

export const PlanStatusSchema = z.enum([
  "generated",
  "selected",
  "approved",
  "rejected",
  "superseded",
]);

export const MissionStatusSchema = z.enum([
  "draft",
  "approved",
  "assigned",
  "in_transit",
  "disrupted",
  "replanning",
  "superseded",
  "delivered",
  "closed",
]);

export const ProductCategorySchema = z.enum([
  "produce",
  "protein",
  "dairy",
  "grain",
  "prepared",
  "shelf_stable",
  "beverage",
  "other",
]);

export const UsabilityTagSchema = z.enum([
  "no_cook",
  "easy_open",
  "requires_refrigeration",
  "requires_freezer",
  "low_sodium_program",
  "gluten_free_program",
  "vegan_program",
  "vegetarian_program",
  "culturally_preferred",
  "family_meal_component",
]);

export const GeoLocationSchema = z.object({
  address: z.string().min(1),
  city: z.string().min(1),
  region: z.string().min(1),
  postalCode: z.string().min(1),
  latitude: z.number().finite(),
  longitude: z.number().finite(),
});

export const TimeWindowSchema = z
  .object({
    start: ISODateTimeSchema,
    end: ISODateTimeSchema,
  })
  .refine(({ start, end }) => Date.parse(end) > Date.parse(start), {
    message: "Time-window end must be after its start",
    path: ["end"],
  });

export const DonorSchema = z.object({
  id: EntityIdSchema,
  name: z.string().min(1),
  type: z.enum(["retailer", "farm", "manufacturer", "distributor", "other"]),
  location: GeoLocationSchema,
  contactName: z.string().optional(),
  contactChannel: z.string().optional(),
  reliability: z.object({
    deliveredVsCommittedPct: z.number().min(0).max(100),
    onTimePct: z.number().min(0).max(100),
    conditionIssueRatePct: z.number().min(0).max(100),
    sampleSize: z.number().int().nonnegative(),
  }),
  active: z.boolean(),
});

export const ExtractedFieldSchema = z.object({
  field: z.string().min(1),
  value: z.unknown(),
  confidence: ConfidenceSchema,
  sourceSpan: z.string().optional(),
  needsConfirmation: z.boolean(),
});

export const DonationOfferSchema = z.object({
  id: EntityIdSchema,
  donorId: EntityIdSchema,
  sourceText: z.string().min(1),
  productDescription: z.string().min(1),
  quantityLb: z.number().positive(),
  temperatureClass: TemperatureClassSchema,
  pickupLocation: GeoLocationSchema.nullable(),
  pickupWindow: TimeWindowSchema.nullable(),
  estimatedRiskDeadline: ISODateTimeSchema.nullable(),
  conditionNotes: z.string().optional(),
  status: DonationStatusSchema,
  extractedFields: z.array(ExtractedFieldSchema),
  createdAt: ISODateTimeSchema,
  updatedAt: ISODateTimeSchema,
});

export const ProductLotSchema = z.object({
  id: EntityIdSchema,
  donationId: EntityIdSchema.optional(),
  productName: z.string().min(1),
  category: ProductCategorySchema,
  quantityLb: z.number().nonnegative(),
  temperatureClass: TemperatureClassSchema,
  receivedAt: ISODateTimeSchema.optional(),
  riskDeadline: ISODateTimeSchema.optional(),
  riskLevel: RiskLevelSchema,
  usabilityTags: z.array(UsabilityTagSchema),
  currentLocationId: EntityIdSchema,
  status: ProductLotStatusSchema,
});

export const WarehouseSchema = z.object({
  id: EntityIdSchema,
  name: z.string().min(1),
  location: GeoLocationSchema,
  dryCapacityLb: z.number().nonnegative(),
  refrigeratedCapacityLb: z.number().nonnegative(),
  frozenCapacityLb: z.number().nonnegative(),
  occupiedDryLb: z.number().nonnegative(),
  occupiedRefrigeratedLb: z.number().nonnegative(),
  occupiedFrozenLb: z.number().nonnegative(),
  refrigeratedStagingCapacityAvailableLb: z.number().nonnegative(),
  dockWindows: z.array(TimeWindowSchema),
  active: z.boolean(),
});

export const DemandSignalSchema = z.object({
  id: EntityIdSchema,
  partnerId: EntityIdSchema,
  category: ProductCategorySchema,
  desiredQuantityLb: z.number().nonnegative(),
  urgency: RiskLevelSchema,
  usabilityTags: z.array(UsabilityTagSchema),
  validUntil: ISODateTimeSchema,
  source: z.enum([
    "order",
    "service_history",
    "staff_entry",
    "aggregate_request",
    "seed",
  ]),
});

export const OperationalNoteSchema = z.object({
  id: EntityIdSchema,
  authorRole: z.string().min(1),
  text: z.string().min(1),
  createdAt: ISODateTimeSchema,
  tags: z.array(z.string()),
});

export const PartnerAgencySchema = z.object({
  id: EntityIdSchema,
  name: z.string().min(1),
  agencyType: z.enum([
    "pantry",
    "meal_program",
    "shelter",
    "school",
    "mobile_site",
    "other",
  ]),
  location: GeoLocationSchema,
  receivingWindows: z.array(TimeWindowSchema),
  dryCapacityAvailableLb: z.number().nonnegative(),
  refrigeratedCapacityAvailableLb: z.number().nonnegative(),
  frozenCapacityAvailableLb: z.number().nonnegative(),
  demandSignals: z.array(DemandSignalSchema),
  acceptedCategories: z.array(ProductCategorySchema),
  preferredTags: z.array(UsabilityTagSchema),
  refusalRisk: z.number().min(0).max(100),
  recentServiceGap: z.number().min(0).max(100),
  accessBurden: z.number().min(0).max(100),
  status: z.enum(["available", "limited", "unavailable", "canceled"]),
  notes: z.array(OperationalNoteSchema),
});

export const VehicleSchema = z.object({
  id: EntityIdSchema,
  name: z.string().min(1),
  capacityLb: z.number().positive(),
  temperatureCapability: z.array(TemperatureClassSchema),
  status: z.enum(["available", "assigned", "unavailable", "maintenance"]),
  currentLocation: GeoLocationSchema,
});

export const DriverSchema = z.object({
  id: EntityIdSchema,
  name: z.string().min(1),
  status: z.enum(["available", "assigned", "unavailable"]),
  shiftWindow: TimeWindowSchema,
});

export const DestinationScoreSchema = z.object({
  total: z.number().min(0).max(100),
  documentedNeed: z.number(),
  usabilityMatch: z.number(),
  receivingWindowFit: z.number(),
  availableCapacity: z.number(),
  recentServiceGap: z.number(),
  equityPriority: z.number(),
  travelPenalty: z.number(),
  spoilagePenalty: z.number(),
  refusalRiskPenalty: z.number(),
});

export const PlanMetricsSchema = z.object({
  quantityDistributedInTimeLb: z.number().nonnegative(),
  expectedSpoilageLb: z.number().nonnegative(),
  estimatedHouseholdsSupported: z.number().nonnegative(),
  totalMiles: z.number().nonnegative(),
  staffMinutes: z.number().nonnegative(),
  coldCapacityUtilizationPct: z.number().nonnegative(),
  refrigeratedStagingUtilizationPct: z.number().nonnegative(),
  needMatchScore: z.number().min(0).max(100),
  equityIndicator: z.number().min(0).max(100),
  refusalRiskScore: z.number().min(0).max(100),
});

export const AllocationSchema = z.object({
  id: EntityIdSchema,
  productLotId: EntityIdSchema,
  destinationId: EntityIdSchema,
  destinationType: z.enum([
    "warehouse",
    "partner",
    "packing_program",
    "external_redirect",
  ]),
  quantityLb: z.number().nonnegative(),
  plannedArrivalAt: ISODateTimeSchema,
  handling: z.enum(["store", "cross_dock", "pack", "inspect", "redirect"]),
  score: DestinationScoreSchema,
});

export const PlanRiskSchema = z.object({
  code: z.string().min(1),
  level: RiskLevelSchema,
  message: z.string().min(1),
  blocking: z.boolean(),
});

export const DestinationExclusionSchema = z.object({
  destinationId: EntityIdSchema,
  reason: z.string().min(1),
});

export const PlanOptionSchema = z.object({
  id: EntityIdSchema,
  planSetId: EntityIdSchema,
  name: z.string().min(1),
  strategy: z.enum(["warehouse_first", "direct_distribution", "mixed", "custom"]),
  status: PlanStatusSchema,
  allocations: z.array(AllocationSchema),
  inspectionHoldLb: z.number().nonnegative(),
  declinedLb: z.number().nonnegative(),
  metrics: PlanMetricsSchema,
  assumptions: z.array(z.string()),
  risks: z.array(PlanRiskSchema),
  excludedDestinations: z.array(DestinationExclusionSchema),
});

export const PlanSetSchema = z.object({
  id: EntityIdSchema,
  donationId: EntityIdSchema,
  options: z.array(PlanOptionSchema).length(3),
  generatedAt: ISODateTimeSchema,
  selectedOptionId: EntityIdSchema.optional(),
  approvedOptionId: EntityIdSchema.optional(),
});

export const PackingBatchSchema = z.object({
  id: EntityIdSchema,
  destinationId: EntityIdSchema,
  productLotId: EntityIdSchema,
  quantityLb: z.number().nonnegative(),
  priority: z.number().int().positive(),
  stagingLocation: z.string().min(1),
  temperatureClass: TemperatureClassSchema,
  instruction: z.string().min(1),
  status: z.enum(["pending", "complete"]),
});

export const PackingPlanSchema = z.object({
  id: EntityIdSchema,
  approvedPlanOptionId: EntityIdSchema,
  batches: z.array(PackingBatchSchema),
  status: z.enum(["draft", "ready", "in_progress", "complete"]),
});

export const RouteStopSchema = z.object({
  id: EntityIdSchema,
  sequence: z.number().int().positive(),
  locationId: EntityIdSchema,
  locationType: z.enum(["donor", "warehouse", "partner"]),
  arrivalWindow: TimeWindowSchema,
  quantityPickupLb: z.number().nonnegative(),
  quantityDropoffLb: z.number().nonnegative(),
  status: z.enum(["pending", "arrived", "complete", "canceled", "skipped"]),
  instructions: z.array(z.string()),
});

export const RouteLegSchema = z.object({
  fromStopId: EntityIdSchema,
  toStopId: EntityIdSchema,
  distanceMiles: z.number().nonnegative(),
  durationMinutes: z.number().nonnegative(),
  polyline: z.array(z.tuple([z.number(), z.number()])),
});

export const MissionSchema = z.object({
  id: EntityIdSchema,
  donationId: EntityIdSchema,
  approvedPlanOptionId: EntityIdSchema,
  vehicleId: EntityIdSchema,
  driverId: EntityIdSchema,
  stops: z.array(RouteStopSchema),
  routeLegs: z.array(RouteLegSchema),
  status: MissionStatusSchema,
  createdAt: ISODateTimeSchema,
  updatedAt: ISODateTimeSchema,
});

export const AuditEventSchema = z.object({
  id: EntityIdSchema,
  eventType: z.string().min(1),
  entityType: z.string().min(1),
  entityId: EntityIdSchema,
  actorType: z.enum(["human", "agent", "system"]),
  actorId: z.string().min(1),
  occurredAt: ISODateTimeSchema,
  previousState: z.unknown().optional(),
  newState: z.unknown().optional(),
  reason: z.string().optional(),
  agentRunId: EntityIdSchema.optional(),
});

export const AgentRunSchema = z.object({
  id: EntityIdSchema,
  agentType: z.enum([
    "intake",
    "capacity",
    "matching",
    "planning",
    "routing",
    "recovery",
    "communication",
  ]),
  entityId: EntityIdSchema,
  startedAt: ISODateTimeSchema,
  completedAt: ISODateTimeSchema.optional(),
  status: z.enum(["running", "success", "failed", "fallback_used"]),
  confidence: ConfidenceSchema.optional(),
  modelOrRuleset: z.string().min(1),
  inputHash: z.string().optional(),
  errorCode: z.string().optional(),
});

export type Confidence = z.infer<typeof ConfidenceSchema>;
export type DonationStatus = z.infer<typeof DonationStatusSchema>;
export type TemperatureClass = z.infer<typeof TemperatureClassSchema>;
export type RiskLevel = z.infer<typeof RiskLevelSchema>;
export type Donor = z.infer<typeof DonorSchema>;
export type DonationOffer = z.infer<typeof DonationOfferSchema>;
export type ProductLot = z.infer<typeof ProductLotSchema>;
export type Warehouse = z.infer<typeof WarehouseSchema>;
export type PartnerAgency = z.infer<typeof PartnerAgencySchema>;
export type Vehicle = z.infer<typeof VehicleSchema>;
export type Driver = z.infer<typeof DriverSchema>;
export type DestinationScore = z.infer<typeof DestinationScoreSchema>;
export type PlanMetrics = z.infer<typeof PlanMetricsSchema>;
export type Allocation = z.infer<typeof AllocationSchema>;
export type PlanOption = z.infer<typeof PlanOptionSchema>;
export type PlanSet = z.infer<typeof PlanSetSchema>;
export type PackingPlan = z.infer<typeof PackingPlanSchema>;
export type Mission = z.infer<typeof MissionSchema>;
export type AuditEvent = z.infer<typeof AuditEventSchema>;
export type AgentRun = z.infer<typeof AgentRunSchema>;
