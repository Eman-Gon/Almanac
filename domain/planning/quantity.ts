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
  return allocatedQuantityLb(plan) + plan.inspectionHoldLb + plan.unallocatedLb;
}

export function quantityConserves(
  plan: PlanOption,
  availableInventoryQuantityLb: number,
): boolean {
  return Math.abs(accountedQuantityLb(plan) - availableInventoryQuantityLb) <= QUANTITY_TOLERANCE_LB;
}

export type QuantityReconciliation = {
  availableInventoryQuantityLb: number;
  outboundAllocatedLb: number;
  retainedLongTermLb: number;
  inspectionHoldLb: number;
  externalTransferLb: number;
  unallocatedLb: number;
  quantityPlannedOutboundInTimeLb: number;
  expectedSpoilageLb: number;
  totalAccountedLb: number;
  reconciles: boolean;
};

/** Reconciles physical buckets; expected spoilage is a non-exclusive risk metric. */
export function reconcilePlanQuantities(
  plan: PlanOption,
  availableInventoryQuantityLb: number,
): QuantityReconciliation {
  const externalTransferLb = plan.allocations
    .filter(
      (allocation) =>
        allocation.destinationType === "external_redirect" ||
        allocation.handling === "redirect",
    )
    .reduce((total, allocation) => total + Math.max(0, allocation.quantityLb), 0);
  const retainedLongTermLb = plan.allocations
    .filter(
      (allocation) =>
        allocation.destinationType === "warehouse" &&
        allocation.handling === "store",
    )
    .reduce((total, allocation) => total + Math.max(0, allocation.quantityLb), 0);
  const outboundAllocatedLb = plan.allocations
    .filter(
      (allocation) =>
        allocation.destinationType !== "warehouse" &&
        allocation.destinationType !== "external_redirect" &&
        allocation.handling !== "redirect",
    )
    .reduce((total, allocation) => total + Math.max(0, allocation.quantityLb), 0);
  const inspectionHoldLb = Math.max(0, plan.inspectionHoldLb);
  const unallocatedLb = Math.max(0, plan.unallocatedLb);
  const totalAccountedLb =
    outboundAllocatedLb +
    retainedLongTermLb +
    inspectionHoldLb +
    externalTransferLb +
    unallocatedLb;

  return {
    availableInventoryQuantityLb,
    outboundAllocatedLb,
    retainedLongTermLb,
    inspectionHoldLb,
    externalTransferLb,
    unallocatedLb,
    quantityPlannedOutboundInTimeLb:
      plan.metrics.quantityPlannedOutboundInTimeLb,
    expectedSpoilageLb: plan.metrics.expectedSpoilageLb,
    totalAccountedLb,
    reconciles:
      Math.abs(totalAccountedLb - availableInventoryQuantityLb) <=
      QUANTITY_TOLERANCE_LB,
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

  if (!Number.isFinite(plan.unallocatedLb) || plan.unallocatedLb < 0) {
    issues.push(
      quantityIssue({
        code: "INVALID_QUANTITY",
        entityId: plan.id,
        message: "Unallocated quantity must be finite and nonnegative.",
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

  if (!quantityConserves(plan, context.availableInventoryQuantityLb)) {
    const accountedLb = accountedQuantityLb(plan);
    issues.push(
      quantityIssue({
        code: "QUANTITY_MISMATCH",
        plannedQuantityLb: accountedLb,
        limitQuantityLb: context.availableInventoryQuantityLb,
        excessQuantityLb: Number.isFinite(accountedLb)
          ? Math.max(0, accountedLb - context.availableInventoryQuantityLb)
          : undefined,
        message: `Quantity mismatch: ${accountedLb} lb accounted for of ${context.availableInventoryQuantityLb} lb available.`,
      }),
    );
  }

  const reconciliation = reconcilePlanQuantities(
    plan,
    context.availableInventoryQuantityLb,
  );
  if (
    !reconciliation.reconciles ||
    Math.abs(
      reconciliation.quantityPlannedOutboundInTimeLb -
        reconciliation.outboundAllocatedLb,
    ) > QUANTITY_TOLERANCE_LB
  ) {
    issues.push(
      quantityIssue({
        code: "METRIC_QUANTITY_MISMATCH",
        plannedQuantityLb: reconciliation.totalAccountedLb,
        limitQuantityLb: context.availableInventoryQuantityLb,
        excessQuantityLb: Math.max(
          0,
          reconciliation.totalAccountedLb - context.availableInventoryQuantityLb,
        ),
        message: !reconciliation.reconciles
          ? `Inventory quantities do not reconcile: ${reconciliation.totalAccountedLb} lb accounted for of ${context.availableInventoryQuantityLb} lb available.`
          : `Planned outbound metric is ${reconciliation.quantityPlannedOutboundInTimeLb} lb but outbound allocations total ${reconciliation.outboundAllocatedLb} lb.`,
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
