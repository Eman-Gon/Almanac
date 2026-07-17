import { backgroundMissions, productLot, warehouse } from "@/data/seed/scenario";
import { coldCapacityUtilizationPct } from "@/domain/metrics/calculate";

export function getDashboardSummary() {
  return {
    atRiskInventoryLots:
      productLot.status === "distributed" || productLot.status === "disposed" ? 0 : 1,
    poundsAtHighExpirationRisk: productLot.availableQuantityLb,
    refrigeratedCapacityUsedPct: coldCapacityUtilizationPct(warehouse),
    openMissions: backgroundMissions.length,
  };
}
