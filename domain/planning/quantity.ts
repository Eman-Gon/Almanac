import type { PlanOption } from "@/domain/types";

export const QUANTITY_TOLERANCE_LB = 0.01;

export function allocatedQuantityLb(plan: PlanOption): number {
  return plan.allocations.reduce((total, allocation) => total + allocation.quantityLb, 0);
}

export function accountedQuantityLb(plan: PlanOption): number {
  return allocatedQuantityLb(plan) + plan.inspectionHoldLb + plan.declinedLb;
}

export function quantityConserves(
  plan: PlanOption,
  offeredQuantityLb: number,
): boolean {
  return Math.abs(accountedQuantityLb(plan) - offeredQuantityLb) <= QUANTITY_TOLERANCE_LB;
}

export type PlanValidation = {
  approvable: boolean;
  errors: string[];
};

export function validatePlanOption(
  plan: PlanOption,
  offeredQuantityLb: number,
): PlanValidation {
  const errors: string[] = [];

  if (!quantityConserves(plan, offeredQuantityLb)) {
    errors.push(
      `Quantity mismatch: ${accountedQuantityLb(plan)} lb accounted for of ${offeredQuantityLb} lb offered.`,
    );
  }

  if (plan.allocations.some((allocation) => allocation.quantityLb < 0)) {
    errors.push("Allocation quantities cannot be negative.");
  }

  for (const risk of plan.risks) {
    if (risk.blocking) {
      errors.push(risk.message);
    }
  }

  return { approvable: errors.length === 0, errors };
}
