import { backgroundMissions, donation, warehouse } from "@/data/seed/scenario";
import { coldCapacityUtilizationPct } from "@/domain/metrics/calculate";

export function getDashboardSummary() {
  return {
    urgentOffers: donation.status === "closed" ? 0 : 1,
    poundsAtHighExpirationRisk: donation.quantityLb,
    refrigeratedCapacityUsedPct: coldCapacityUtilizationPct(warehouse),
    openMissions: backgroundMissions.length,
  };
}
