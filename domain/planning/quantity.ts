import {
  assessPlanCapacity,
  type CapacityAssessment,
  type CapacityValidationIssue,
  type PlanValidationContext,
} from "@/domain/planning/capacity";
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

export type QuantityValidationIssue = {
  code:
    | "INVALID_QUANTITY"
    | "DUPLICATE_ALLOCATION_ID"
    | "QUANTITY_MISMATCH";
  constraint: "quantity";
  message: string;
  entityId?: string;
  plannedQuantityLb?: number;
  limitQuantityLb?: number;
  excessQuantityLb?: number;
  blocking: true;
  source: "calculated";
};

export type PlanValidationIssue =
  | QuantityValidationIssue
  | CapacityValidationIssue;

export type PlanValidation = {
  approvable: boolean;
  issues: PlanValidationIssue[];
  errors: string[];
  capacity: CapacityAssessment;
  displayMessage?: string;
};

function quantityIssue(
  issue: Omit<QuantityValidationIssue, "blocking" | "source" | "constraint">,
): QuantityValidationIssue {
  return {
    ...issue,
    constraint: "quantity",
    blocking: true,
    source: "calculated",
  };
}

export function validatePlanOption(
  plan: PlanOption,
  context: PlanValidationContext,
): PlanValidation {
  const issues: PlanValidationIssue[] = [];

  for (const allocation of plan.allocations) {
    if (!Number.isFinite(allocation.quantityLb) || allocation.quantityLb < 0) {
      issues.push(
        quantityIssue({
          code: "INVALID_QUANTITY",
          entityId: allocation.id,
          message: `Allocation ${allocation.id} must have a finite, nonnegative quantity.`,
        }),
      );
    }
  }

  if (!Number.isFinite(plan.inspectionHoldLb) || plan.inspectionHoldLb < 0) {
    issues.push(
      quantityIssue({
        code: "INVALID_QUANTITY",
        entityId: plan.id,
        message: "Inspection-hold quantity must be finite and nonnegative.",
      }),
    );
  }

  if (!Number.isFinite(plan.declinedLb) || plan.declinedLb < 0) {
    issues.push(
      quantityIssue({
        code: "INVALID_QUANTITY",
        entityId: plan.id,
        message: "Declined quantity must be finite and nonnegative.",
      }),
    );
  }

  const seenAllocationIds = new Set<string>();
  for (const allocation of plan.allocations) {
    if (seenAllocationIds.has(allocation.id)) {
      issues.push(
        quantityIssue({
          code: "DUPLICATE_ALLOCATION_ID",
          entityId: allocation.id,
          message: `Allocation ID ${allocation.id} is duplicated.`,
        }),
      );
    }
    seenAllocationIds.add(allocation.id);
  }

  if (!quantityConserves(plan, context.offeredQuantityLb)) {
    const accountedLb = accountedQuantityLb(plan);
    issues.push(
      quantityIssue({
        code: "QUANTITY_MISMATCH",
        plannedQuantityLb: accountedLb,
        limitQuantityLb: context.offeredQuantityLb,
        excessQuantityLb: Number.isFinite(accountedLb)
          ? Math.max(0, accountedLb - context.offeredQuantityLb)
          : undefined,
        message: `Quantity mismatch: ${accountedLb} lb accounted for of ${context.offeredQuantityLb} lb offered.`,
      }),
    );
  }

  const capacity = assessPlanCapacity(plan, context);
  issues.push(...capacity.issues);
  const errors = issues.map((issue) => issue.message);
  const fallbackRisk = plan.risks.find((risk) => risk.blocking) ?? plan.risks[0];

  return {
    approvable: issues.length === 0,
    issues,
    errors,
    capacity,
    displayMessage: issues[0]?.message ?? fallbackRisk?.message,
  };
}

export type { PlanValidationContext } from "@/domain/planning/capacity";
