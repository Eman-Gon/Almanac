import { describe, expect, it } from "vitest";
import { generatePlanSet } from "@/domain/planning/generate-plans";
import { validatePlanOption } from "@/domain/planning/quantity";
import { scenarioContext, type AlmanacScenarioContext } from "@/domain/planning/scenario-context";
import { createRecoveryOptionResult } from "@/domain/recovery/create-recovery";
import {
  approvePlanTransition,
  approveRecoveryTransition,
  triggerPartnerCancellationTransition,
} from "@/domain/workflow/transitions";

function secondScenario(): AlmanacScenarioContext {
  const roleIds = ["PAR-A", "PAR-B", "PAR-C", "PAR-D"];
  const partners = scenarioContext.partners.map((partner, index) => {
    if (index >= roleIds.length) return partner;
    const id = roleIds[index];
    return {
      ...partner,
      id,
      demandSignals: partner.demandSignals.map((signal) => ({
        ...signal,
        id: `DEM-${id}`,
        partnerId: id,
      })),
    };
  });
  const warehouse = {
    ...scenarioContext.warehouse,
    id: "WH-SECOND",
    refrigeratedCapacityLb: 1_000,
    occupiedRefrigeratedLb: 700,
    refrigeratedStagingCapacityAvailableLb: 300,
  };
  const productLot = {
    ...scenarioContext.productLot,
    id: "LOT-SECOND",
    quantityLb: 600,
    availableQuantityLb: 600,
    currentLocationId: warehouse.id,
  };
  return {
    ...scenarioContext,
    scenario: { ...scenarioContext.scenario, id: "SCN-SECOND-001", householdWeightLb: 4 },
    ids: {
      planSetId: "PLN-SECOND",
      primaryOptionId: "OPT-SECOND",
      recoveryPlanSetId: "PLN-SECOND-R",
      recoveryOptionId: "OPT-SECOND-R",
      primaryPackingPlanId: "PKG-SECOND",
      recoveryPackingPlanId: "PKG-SECOND-R",
      primaryMissionId: "MSN-SECOND",
      recoveryMissionId: "MSN-SECOND-R",
      disruptionId: "DSP-SECOND",
      canceledPartnerId: "PAR-B",
      mealKitPartnerId: "PAR-C",
      alternatePartnerId: "PAR-D",
    },
    productLot,
    warehouse,
    partners,
    vehicle: { ...scenarioContext.vehicle, id: "VEH-SECOND", capacityLb: 700 },
    driver: { ...scenarioContext.driver, id: "DRV-SECOND" },
    availableInventoryQuantityLb: 600,
    planQuantities: {
      holdForLaterLb: 600,
      fastestPartnerOneLb: 200,
      fastestCanceledPartnerLb: 180,
      fastestMealKitLb: 220,
      balancedPartnerOneLb: 200,
      balancedCanceledPartnerLb: 160,
      balancedMealKitLb: 210,
      balancedInspectionHoldLb: 30,
    },
    recovery: {
      ...scenarioContext.recovery,
      mealKitAdditionalLimitLb: 20,
      totalMiles: 14.2,
      staffMinutes: 58,
    },
    strategyEstimates: {
      holdForLater: { ...scenarioContext.strategyEstimates.holdForLater, totalMiles: 0 },
      fastestRelease: { ...scenarioContext.strategyEstimates.fastestRelease, totalMiles: 22.5 },
      balancedRelease: { ...scenarioContext.strategyEstimates.balancedRelease, totalMiles: 12.4, expectedSpoilageLb: 30 },
    },
    routes: {
      primary: [{ distanceMiles: 4, durationMinutes: 10 }, { distanceMiles: 4, durationMinutes: 10 }, { distanceMiles: 4.4, durationMinutes: 11 }],
      recovery: [{ distanceMiles: 4, durationMinutes: 10 }, { distanceMiles: 5, durationMinutes: 12 }, { distanceMiles: 5.2, durationMinutes: 12 }],
      warehouseDurationMinutes: 12,
    },
  };
}

describe("multi-scenario deterministic workflow", () => {
  it("runs a second inventory scenario through approval, disruption, and recovery", () => {
    const context = secondScenario();
    const plans = generatePlanSet(context);
    const selected = plans.options[2];

    expect(plans.id).toBe("PLN-SECOND");
    expect(plans.inventoryLotId).toBe("LOT-SECOND");
    expect(validatePlanOption(selected, context).approvable).toBe(true);

    const approval = approvePlanTransition({ planSetId: plans.id, optionId: selected.id }, context);
    expect(approval.ok).toBe(true);
    if (!approval.ok) return;
    expect(approval.value.mission.id).toBe("MSN-SECOND");
    expect(approval.value.packingPlan.id).toBe("PKG-SECOND");

    const disruption = triggerPartnerCancellationTransition(approval.value.approvedPlan, approval.value.mission, "Second scenario cancellation.", context);
    expect(disruption.ok).toBe(true);
    if (!disruption.ok) return;
    expect(disruption.value.replacementPlan.allocations.some((item) => item.destinationId === "PAR-B")).toBe(false);

    const recovery = approveRecoveryTransition(
      approval.value.approvedPlan,
      approval.value.packingPlan,
      disruption.value.originalMission,
      {
        id: disruption.value.disruption.id,
        missionId: disruption.value.disruption.missionId,
        partnerId: disruption.value.disruption.partnerId,
        affectedQuantityLb: disruption.value.disruption.affectedQuantityLb,
      },
      context,
    );
    expect(recovery.ok).toBe(true);
    if (!recovery.ok) return;
    expect(recovery.value.replacementMission.id).toBe("MSN-SECOND-R");
    expect(recovery.value.replacementPackingPlan.id).toBe("PKG-SECOND-R");
    expect(recovery.value.approvedOption.metrics.quantityPlannedOutboundInTimeLb).toBe(570);
  });

  it("returns typed issues instead of throwing when recovery entities are missing", () => {
    const context = secondScenario();
    const original = generatePlanSet(context).options[2];
    const result = createRecoveryOptionResult(original, {
      ...context,
      partners: context.partners.filter((partner) => partner.id !== context.ids.alternatePartnerId),
    });

    expect(result.option).toBeNull();
    expect(result.issues).toContainEqual(expect.objectContaining({
      code: "MISSING_RECOVERY_PARTNER",
      entityId: "PAR-D",
      blocking: true,
    }));
  });
});
