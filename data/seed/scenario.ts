import type {
  AgentRun,
  AuditEvent,
  DonationOffer,
  Donor,
  Driver,
  PartnerAgency,
  ProductLot,
  Vehicle,
  Warehouse,
} from "@/domain/types";

export const scenario = {
  id: "SCN-STRAWBERRY-001",
  name: "Strawberry Rescue",
  currentDateLabel: "Wednesday, July 15",
  scoreConfigVersion: "score-v1",
  householdWeightLb: 3,
  baselineExpectedSpoilageLb: 1_000,
  modeledReplanningSeconds: 11,
  demoMode: true,
} as const;

export const donor: Donor = {
  id: "DNR-001",
  name: "Market Street Grocery",
  type: "retailer",
  location: {
    address: "1700 Market Street",
    city: "Santa Clara",
    region: "CA",
    postalCode: "95050",
    latitude: 37.3496,
    longitude: -121.9405,
  },
  contactName: "Synthetic donor contact",
  contactChannel: "Seeded phone record",
  reliability: {
    deliveredVsCommittedPct: 94,
    onTimePct: 91,
    conditionIssueRatePct: 3,
    sampleSize: 18,
  },
  active: true,
};

export const donation: DonationOffer = {
  id: "DON-104",
  donorId: donor.id,
  sourceText:
    "Hi, Market Street Grocery has about 80 cases of strawberries available today, roughly 1,200 pounds. They need to be picked up before 1 PM and kept refrigerated. Please confirm quickly.",
  productDescription: "Strawberries",
  quantityLb: 1_200,
  temperatureClass: "refrigerated",
  pickupLocation: donor.location,
  pickupWindow: {
    start: "2026-07-15T11:00:00-07:00",
    end: "2026-07-15T13:00:00-07:00",
  },
  estimatedRiskDeadline: "2026-07-16T22:45:00-07:00",
  conditionNotes: "Condition requires staff inspection at pickup.",
  status: "ready_for_planning",
  extractedFields: [
    {
      field: "productDescription",
      value: "Strawberries",
      confidence: "high",
      sourceSpan: "80 cases of strawberries",
      needsConfirmation: false,
    },
    {
      field: "quantityLb",
      value: 1_200,
      confidence: "high",
      sourceSpan: "roughly 1,200 pounds",
      needsConfirmation: false,
    },
    {
      field: "pickupWindow.end",
      value: "2026-07-15T13:00:00-07:00",
      confidence: "high",
      sourceSpan: "before 1 PM",
      needsConfirmation: false,
    },
    {
      field: "temperatureClass",
      value: "refrigerated",
      confidence: "high",
      sourceSpan: "kept refrigerated",
      needsConfirmation: false,
    },
    {
      field: "pickupLocation",
      value: donor.location.address,
      confidence: "medium",
      sourceSpan: "Loaded from confirmed donor profile",
      needsConfirmation: false,
    },
  ],
  createdAt: "2026-07-15T10:45:00-07:00",
  updatedAt: "2026-07-15T10:46:00-07:00",
};

export const productLot: ProductLot = {
  id: "LOT-104",
  donationId: donation.id,
  productName: "Strawberries",
  category: "produce",
  quantityLb: donation.quantityLb,
  temperatureClass: "refrigerated",
  riskDeadline: donation.estimatedRiskDeadline ?? undefined,
  riskLevel: "high",
  usabilityTags: ["no_cook", "requires_refrigeration", "culturally_preferred"],
  currentLocationId: donor.id,
  status: "offered",
};

export const warehouse: Warehouse = {
  id: "WH-001",
  name: "South County Distribution Center",
  location: {
    address: "750 Curtner Avenue",
    city: "San Jose",
    region: "CA",
    postalCode: "95125",
    latitude: 37.3018,
    longitude: -121.8737,
  },
  dryCapacityLb: 12_000,
  refrigeratedCapacityLb: 2_000,
  frozenCapacityLb: 1_200,
  occupiedDryLb: 6_240,
  occupiedRefrigeratedLb: 1_580,
  occupiedFrozenLb: 744,
  refrigeratedStagingCapacityAvailableLb: 500,
  dockWindows: [
    {
      start: "2026-07-15T08:00:00-07:00",
      end: "2026-07-15T17:00:00-07:00",
    },
  ],
  active: true,
};

type PartnerSeed = {
  id: string;
  name: string;
  agencyType?: PartnerAgency["agencyType"];
  city: string;
  latitude: number;
  longitude: number;
  coldCapacityLb: number;
  desiredQuantityLb: number;
  urgency: PartnerAgency["demandSignals"][number]["urgency"];
  refusalRisk: number;
  recentServiceGap: number;
  accessBurden: number;
  status?: PartnerAgency["status"];
  receivingStart?: string;
  receivingEnd?: string;
};

function createPartner(seed: PartnerSeed): PartnerAgency {
  return {
    id: seed.id,
    name: seed.name,
    agencyType: seed.agencyType ?? "pantry",
    location: {
      address: `${seed.id.slice(-3)} Synthetic Way`,
      city: seed.city,
      region: "CA",
      postalCode: "95000",
      latitude: seed.latitude,
      longitude: seed.longitude,
    },
    receivingWindows: [
      {
        start: seed.receivingStart ?? "2026-07-15T09:30:00-07:00",
        end: seed.receivingEnd ?? "2026-07-15T13:00:00-07:00",
      },
    ],
    dryCapacityAvailableLb: 1_200,
    refrigeratedCapacityAvailableLb: seed.coldCapacityLb,
    frozenCapacityAvailableLb: 200,
    demandSignals: [
      {
        id: `DEM-${seed.id.slice(-3)}`,
        partnerId: seed.id,
        category: "produce",
        desiredQuantityLb: seed.desiredQuantityLb,
        urgency: seed.urgency,
        usabilityTags: ["no_cook", "requires_refrigeration"],
        validUntil: "2026-07-16T17:00:00-07:00",
        source: "seed",
      },
    ],
    acceptedCategories: ["produce", "shelf_stable"],
    preferredTags: ["no_cook", "culturally_preferred"],
    refusalRisk: seed.refusalRisk,
    recentServiceGap: seed.recentServiceGap,
    accessBurden: seed.accessBurden,
    status: seed.status ?? "available",
    notes: [
      {
        id: `NTE-${seed.id.slice(-3)}`,
        authorRole: "Partner-agency coordinator",
        text: "Synthetic receiving note for the Strawberry Rescue scenario.",
        createdAt: "2026-07-15T08:00:00-07:00",
        tags: ["seed", "receiving"],
      },
    ],
  };
}

export const partners: PartnerAgency[] = [
  createPartner({
    id: "PAR-001",
    name: "Harbor Light Pantry",
    city: "Milpitas",
    latitude: 37.4323,
    longitude: -121.8996,
    coldCapacityLb: 500,
    desiredQuantityLb: 520,
    urgency: "critical",
    refusalRisk: 4,
    recentServiceGap: 86,
    accessBurden: 74,
    receivingEnd: "2026-07-15T12:00:00-07:00",
  }),
  createPartner({
    id: "PAR-002",
    name: "Eastside Community Pantry",
    city: "San Jose",
    latitude: 37.3551,
    longitude: -121.8241,
    coldCapacityLb: 500,
    desiredQuantityLb: 420,
    urgency: "high",
    refusalRisk: 7,
    recentServiceGap: 78,
    accessBurden: 68,
    receivingStart: "2026-07-15T10:00:00-07:00",
    receivingEnd: "2026-07-15T12:30:00-07:00",
  }),
  createPartner({
    id: "PAR-003",
    name: "Community Kitchen",
    agencyType: "meal_program",
    city: "San Jose",
    latitude: 37.3189,
    longitude: -121.8861,
    coldCapacityLb: 500,
    desiredQuantityLb: 460,
    urgency: "high",
    refusalRisk: 3,
    recentServiceGap: 64,
    accessBurden: 59,
  }),
  createPartner({
    id: "PAR-004",
    name: "Northside Family Resource Center",
    city: "Santa Clara",
    latitude: 37.3895,
    longitude: -121.9632,
    coldCapacityLb: 280,
    desiredQuantityLb: 300,
    urgency: "high",
    refusalRisk: 5,
    recentServiceGap: 82,
    accessBurden: 71,
    receivingEnd: "2026-07-15T14:00:00-07:00",
  }),
  createPartner({
    id: "PAR-005",
    name: "Alum Rock Youth Pantry",
    city: "San Jose",
    latitude: 37.3664,
    longitude: -121.8272,
    coldCapacityLb: 160,
    desiredQuantityLb: 240,
    urgency: "high",
    refusalRisk: 12,
    recentServiceGap: 73,
    accessBurden: 80,
    status: "limited",
  }),
  createPartner({
    id: "PAR-006",
    name: "Willow Glen Community Table",
    agencyType: "meal_program",
    city: "San Jose",
    latitude: 37.2974,
    longitude: -121.9018,
    coldCapacityLb: 220,
    desiredQuantityLb: 180,
    urgency: "medium",
    refusalRisk: 6,
    recentServiceGap: 38,
    accessBurden: 42,
  }),
  createPartner({
    id: "PAR-007",
    name: "Sunnyvale Mobile Market",
    agencyType: "mobile_site",
    city: "Sunnyvale",
    latitude: 37.3688,
    longitude: -122.0363,
    coldCapacityLb: 120,
    desiredQuantityLb: 200,
    urgency: "medium",
    refusalRisk: 18,
    recentServiceGap: 55,
    accessBurden: 63,
    status: "limited",
  }),
  createPartner({
    id: "PAR-008",
    name: "Downtown Shelter Kitchen",
    agencyType: "shelter",
    city: "San Jose",
    latitude: 37.3382,
    longitude: -121.8921,
    coldCapacityLb: 260,
    desiredQuantityLb: 210,
    urgency: "medium",
    refusalRisk: 9,
    recentServiceGap: 44,
    accessBurden: 51,
  }),
  createPartner({
    id: "PAR-009",
    name: "West Valley School Pantry",
    agencyType: "school",
    city: "Campbell",
    latitude: 37.2872,
    longitude: -121.9499,
    coldCapacityLb: 80,
    desiredQuantityLb: 120,
    urgency: "low",
    refusalRisk: 15,
    recentServiceGap: 34,
    accessBurden: 45,
    status: "limited",
  }),
  createPartner({
    id: "PAR-010",
    name: "Coyote Valley Food Hub",
    agencyType: "other",
    city: "San Jose",
    latitude: 37.2248,
    longitude: -121.7649,
    coldCapacityLb: 600,
    desiredQuantityLb: 0,
    urgency: "low",
    refusalRisk: 22,
    recentServiceGap: 20,
    accessBurden: 33,
    status: "unavailable",
  }),
];

export const vehicles: Vehicle[] = [
  {
    id: "VEH-001",
    name: "ColdRunner 1",
    capacityLb: 1_400,
    temperatureCapability: ["ambient", "refrigerated"],
    status: "assigned",
    currentLocation: warehouse.location,
  },
  {
    id: "VEH-002",
    name: "ColdRunner 2",
    capacityLb: 900,
    temperatureCapability: ["ambient", "refrigerated"],
    status: "available",
    currentLocation: warehouse.location,
  },
  {
    id: "VEH-003",
    name: "Box Truck 3",
    capacityLb: 2_000,
    temperatureCapability: ["ambient"],
    status: "available",
    currentLocation: warehouse.location,
  },
];

export const drivers: Driver[] = ["Maya Chen", "Jordan Lee", "Avery Patel", "Riley Gomez"].map(
  (name, index): Driver => ({
    id: `DRV-00${index + 1}`,
    name,
    status: index === 0 ? "assigned" : "available",
    shiftWindow: {
      start: "2026-07-15T08:00:00-07:00",
      end: "2026-07-15T17:00:00-07:00",
    },
  }),
);

export const baselineAgentRun: AgentRun = {
  id: "RUN-104",
  agentType: "intake",
  entityId: donation.id,
  startedAt: "2026-07-15T10:45:30-07:00",
  completedAt: "2026-07-15T10:45:31-07:00",
  status: "fallback_used",
  confidence: "high",
  modelOrRuleset: "seeded-intake-v1",
  errorCode: "AGENT_UNAVAILABLE",
};

export const baselineAuditEvents: AuditEvent[] = [
  {
    id: "AUD-100",
    eventType: "donation_offer_received",
    entityType: "DonationOffer",
    entityId: donation.id,
    actorType: "system",
    actorId: "demo_seed",
    occurredAt: donation.createdAt,
    newState: { status: "draft" },
  },
  {
    id: "AUD-101",
    eventType: "deterministic_fallback_loaded",
    entityType: "DonationOffer",
    entityId: donation.id,
    actorType: "agent",
    actorId: "intake_agent",
    occurredAt: "2026-07-15T10:45:31-07:00",
    newState: { status: "ready_for_planning" },
    reason: "No LLM configured; validated seeded extraction used.",
    agentRunId: baselineAgentRun.id,
  },
];

export const backgroundMissions = [
  {
    id: "MSN-1023",
    name: "Berry Rescue Run",
    route: "Sunnyvale → Eastside Pantry",
    load: "1,200 lb strawberries",
    window: "9:30 AM – 12:30 PM",
    status: "En route",
    tone: "blue",
  },
  {
    id: "MSN-1021",
    name: "Produce Share",
    route: "San Jose → Community Kitchen",
    load: "950 lb mixed produce",
    window: "10:00 AM – 1:00 PM",
    status: "In progress",
    tone: "green",
  },
  {
    id: "MSN-1019",
    name: "Dairy Delivery",
    route: "Milpitas → Family Resource Center",
    load: "600 lb dairy",
    window: "1:00 PM – 4:00 PM",
    status: "Scheduled",
    tone: "amber",
  },
] as const;

export const expirationRiskItems = [
  { product: "Strawberries", quantityLb: 1_200, timing: "Today by 1:00 PM", risk: "High" },
  { product: "Leafy greens", quantityLb: 450, timing: "Tomorrow by 10:00 AM", risk: "Medium" },
  { product: "Yogurt cups", quantityLb: 300, timing: "Jul 17 by 11:59 PM", risk: "Low" },
] as const;
