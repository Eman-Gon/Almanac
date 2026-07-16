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

export type QuantityReconciliation = {
  offeredQuantityLb: number;
  deliveredBeforeRiskLb: number;
  inspectionHoldLb: number;
  expectedLossLb: number;
  declinedQuantityLb: number;
  redirectedQuantityLb: number;
  unassignedQuantityLb: number;
  totalAccountedLb: number;
  holdOrLossLb: number;
  reconciles: boolean;
};

/** Reconciles outcome buckets without double-counting an inspection hold. */
export function reconcilePlanQuantities(
  plan: PlanOption,
  offeredQuantityLb: number,
): QuantityReconciliation {
  const redirectedQuantityLb = plan.allocations
    .filter(
      (allocation) =>
        allocation.destinationType === "external_redirect" ||
        allocation.handling === "redirect",
    )
    .reduce((total, allocation) => total + Math.max(0, allocation.quantityLb), 0);
  const deliveredBeforeRiskLb = Math.max(
    0,
    plan.metrics.quantityDistributedInTimeLb - redirectedQuantityLb,
  );
  const inspectionHoldLb = Math.max(0, plan.inspectionHoldLb);
  const declinedQuantityLb = Math.max(0, plan.declinedLb);
  const residualAfterKnownBuckets =
    offeredQuantityLb -
    deliveredBeforeRiskLb -
    inspectionHoldLb -
    declinedQuantityLb -
    redirectedQuantityLb;
  const expectedLossLb = Math.max(0, residualAfterKnownBuckets);
  const unassignedQuantityLb = Math.max(
    0,
    offeredQuantityLb -
      deliveredBeforeRiskLb -
      inspectionHoldLb -
      expectedLossLb -
      declinedQuantityLb -
      redirectedQuantityLb,
  );
  const totalAccountedLb =
    deliveredBeforeRiskLb +
    inspectionHoldLb +
    expectedLossLb +
    declinedQuantityLb +
    redirectedQuantityLb +
    unassignedQuantityLb;

  return {
    offeredQuantityLb,
    deliveredBeforeRiskLb,
    inspectionHoldLb,
    expectedLossLb,
    declinedQuantityLb,
    redirectedQuantityLb,
    unassignedQuantityLb,
    totalAccountedLb,
    holdOrLossLb: inspectionHoldLb + expectedLossLb,
    reconciles:
      residualAfterKnownBuckets >= -QUANTITY_TOLERANCE_LB &&
      Math.abs(totalAccountedLb - offeredQuantityLb) <= QUANTITY_TOLERANCE_LB,
  };
}

export type QuantityValidationIssue = {
  code:
    | "INVALID_QUANTITY"
    | "DUPLICATE_ALLOCATION_ID"
    | "QUANTITY_MISMATCH"
    | "METRIC_QUANTITY_MISMATCH";
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

  const reconciliation = reconcilePlanQuantities(
    plan,
    context.offeredQuantityLb,
  );
  if (!reconciliation.reconciles) {
    issues.push(
      quantityIssue({
        code: "METRIC_QUANTITY_MISMATCH",
        plannedQuantityLb: reconciliation.totalAccountedLb,
        limitQuantityLb: context.offeredQuantityLb,
        excessQuantityLb: Math.max(
          0,
          reconciliation.totalAccountedLb - context.offeredQuantityLb,
        ),
        message: `Outcome quantities do not reconcile: ${reconciliation.totalAccountedLb} lb accounted for of ${context.offeredQuantityLb} lb offered.`,
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
