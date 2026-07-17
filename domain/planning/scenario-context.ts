import {
  donor,
  donation,
  drivers,
  partners,
  productLot,
  scenario,
  vehicles,
  warehouse,
} from "@/data/seed/scenario";
import type { PlanValidationContext } from "@/domain/planning/quantity";
import type {
  DonationOffer,
  Donor,
  Driver,
  PartnerAgency,
  ProductLot,
  Vehicle,
  Warehouse,
} from "@/domain/types";

export type ScenarioWorkflowIds = {
  planSetId: string;
  primaryOptionId: string;
  recoveryPlanSetId: string;
  recoveryOptionId: string;
  primaryPackingPlanId: string;
  recoveryPackingPlanId: string;
  primaryMissionId: string;
  recoveryMissionId: string;
  disruptionId: string;
  canceledPartnerId: string;
  mealKitPartnerId: string;
  alternatePartnerId: string;
};

type StrategyEstimate = {
  totalMiles: number;
  staffMinutes: number;
  expectedSpoilageLb: number;
  needMatchScore: number;
  equityIndicator: number;
  refusalRiskScore: number;
};

type RouteTemplateLeg = { distanceMiles: number; durationMinutes: number };

export type AlmanacScenarioContext = PlanValidationContext & {
  scenario: {
    id: string;
    scoreConfigVersion: string;
    householdWeightLb: number;
    baselineExpectedSpoilageLb: number;
    modeledReplanningSeconds: number;
  };
  ids: ScenarioWorkflowIds;
  donor: Donor;
  donation: DonationOffer;
  productLot: ProductLot;
  warehouse: Warehouse;
  partners: PartnerAgency[];
  vehicle: Vehicle;
  driver: Driver;
  recovery: {
    mealKitAdditionalLimitLb: number;
    totalMiles: number;
    staffMinutes: number;
    needMatchScore: number;
    equityIndicator: number;
    refusalRiskScore: number;
  };
  strategyEstimates: {
    holdForLater: StrategyEstimate;
    fastestRelease: StrategyEstimate;
    balancedRelease: StrategyEstimate;
  };
  planQuantities: {
    holdForLaterLb: number;
    fastestPartnerOneLb: number;
    fastestCanceledPartnerLb: number;
    fastestMealKitLb: number;
    balancedPartnerOneLb: number;
    balancedCanceledPartnerLb: number;
    balancedMealKitLb: number;
    balancedInspectionHoldLb: number;
  };
  timeline: Record<
    | "planGeneratedAt"
    | "warehouseArrivalAt"
    | "partnerOneArrivalAt"
    | "canceledPartnerArrivalAt"
    | "mealKitArrivalAt"
    | "alternateArrivalAt"
    | "planEditedAt"
    | "planApprovedAt"
    | "missionApprovedAt"
    | "missionAssignedAt"
    | "primaryPackingStartedAt"
    | "primaryPackingChangedAt"
    | "primaryMissionEventAt"
    | "disruptionAt"
    | "replanningAt"
    | "recoveryApprovedAt"
    | "recoveryPackingStartedAt"
    | "recoveryPackingChangedAt"
    | "recoveryMissionEventAt",
    string
  >;
  routes: {
    primary: RouteTemplateLeg[];
    recovery: RouteTemplateLeg[];
    warehouseDurationMinutes: number;
  };
};

export const scenarioContext: AlmanacScenarioContext = {
  scenario,
  ids: { ...scenario.workflow },
  donor,
  donation,
  availableInventoryQuantityLb: productLot.availableQuantityLb,
  productLot,
  warehouse,
  partners,
  vehicle: vehicles[0],
  driver: drivers[0],
  recovery: { ...scenario.recovery },
  strategyEstimates: {
    holdForLater: { ...scenario.strategyEstimates.holdForLater },
    fastestRelease: { ...scenario.strategyEstimates.fastestRelease },
    balancedRelease: { ...scenario.strategyEstimates.balancedRelease },
  },
  planQuantities: { ...scenario.planQuantities },
  timeline: { ...scenario.timeline },
  routes: {
    primary: scenario.routes.primary.map((leg) => ({ ...leg })),
    recovery: scenario.routes.recovery.map((leg) => ({ ...leg })),
    warehouseDurationMinutes: scenario.routes.warehouseDurationMinutes,
  },
};

export const scenarioValidationContext: PlanValidationContext = {
  availableInventoryQuantityLb: scenarioContext.availableInventoryQuantityLb,
  productLot: scenarioContext.productLot,
  warehouse: scenarioContext.warehouse,
  partners: scenarioContext.partners,
  vehicle: scenarioContext.vehicle,
};
