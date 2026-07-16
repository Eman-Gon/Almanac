import type { PlanOption, Warehouse } from "@/domain/types";

export function percentage(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

export function coldCapacityUtilizationPct(warehouse: Warehouse): number {
  return percentage(
    warehouse.occupiedRefrigeratedLb,
    warehouse.refrigeratedCapacityLb,
  );
}

export function plannedColdStorageUtilizationPct(
  plan: PlanOption,
  warehouse: Warehouse,
): number {
  const storedQuantityLb = plan.allocations
    .filter(
      (allocation) =>
        allocation.destinationId === warehouse.id && allocation.handling === "store",
    )
    .reduce((total, allocation) => total + allocation.quantityLb, 0);

  return percentage(
    warehouse.occupiedRefrigeratedLb + storedQuantityLb + plan.inspectionHoldLb,
    warehouse.refrigeratedCapacityLb,
  );
}

export function refrigeratedStagingUtilizationPct(
  plan: PlanOption,
  warehouse: Warehouse,
): number {
  const stagedQuantityLb = plan.allocations
    .filter((allocation) => allocation.handling === "pack")
    .reduce((total, allocation) => total + allocation.quantityLb, 0);

  return percentage(
    stagedQuantityLb,
    warehouse.refrigeratedStagingCapacityAvailableLb,
  );
}

export function estimatedHouseholdsSupported(
  distributedQuantityLb: number,
  poundsPerHousehold: number,
): number {
  if (poundsPerHousehold <= 0) return 0;
  return Math.round(distributedQuantityLb / poundsPerHousehold);
}

export function spoilageAvoidancePct(
  baselineExpectedSpoilageLb: number,
  expectedSpoilageLb: number,
): number | null {
  if (baselineExpectedSpoilageLb <= 0) return null;
  const avoided = baselineExpectedSpoilageLb - expectedSpoilageLb;
  return percentage(Math.max(0, avoided), baselineExpectedSpoilageLb);
}

export function totalRouteMiles(
  routeLegs: Array<{ distanceMiles: number }>,
): number {
  return Number(
    routeLegs.reduce((total, leg) => total + leg.distanceMiles, 0).toFixed(1),
  );
}

export function planImpact(plan: PlanOption, poundsPerHousehold: number) {
  return {
    poundsAssignedInTime: plan.metrics.quantityDistributedInTimeLb,
    estimatedHouseholdsSupported: estimatedHouseholdsSupported(
      plan.metrics.quantityDistributedInTimeLb,
      poundsPerHousehold,
    ),
    expectedSpoilageLb: plan.metrics.expectedSpoilageLb,
  };
}
