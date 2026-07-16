import {
  donation,
  partners,
  productLot,
  vehicles,
  warehouse,
} from "@/data/seed/scenario";
import type { PlanValidationContext } from "@/domain/planning/quantity";

export const scenarioValidationContext: PlanValidationContext = {
  offeredQuantityLb: donation.quantityLb,
  productLot,
  warehouse,
  partners,
  vehicle: vehicles[0],
};
