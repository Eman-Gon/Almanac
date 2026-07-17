import type {
  PartnerAgency,
  PlanOption,
  ProductLot,
  Vehicle,
  Warehouse,
} from "@/domain/types";

export type WarehouseWithStagingCapacity = Warehouse & {
  refrigeratedStagingCapacityAvailableLb: number;
};

export type PlanValidationContext = {
  availableInventoryQuantityLb: number;
  productLot: ProductLot;
  warehouse: WarehouseWithStagingCapacity;
  partners: readonly PartnerAgency[];
  vehicle: Vehicle;
};

export type CapacityConstraint =
  | "warehouse_status"
  | "warehouse_storage"
  | "warehouse_staging"
  | "warehouse_window"
  | "partner_status"
  | "partner_category"
  | "partner_capacity"
  | "partner_demand"
  | "partner_window"
  | "vehicle_status"
  | "vehicle_temperature"
  | "vehicle_payload";

export type CapacityIssueCode =
  | "WAREHOUSE_UNAVAILABLE"
  | "WAREHOUSE_STORAGE_CAPACITY_EXCEEDED"
  | "WAREHOUSE_STAGING_CAPACITY_EXCEEDED"
  | "WAREHOUSE_WINDOW_INFEASIBLE"
  | "PARTNER_NOT_FOUND"
  | "PARTNER_UNAVAILABLE"
  | "PARTNER_CATEGORY_INCOMPATIBLE"
  | "PARTNER_CAPACITY_EXCEEDED"
  | "PARTNER_DEMAND_MISSING"
  | "PARTNER_DEMAND_EXPIRED"
  | "PARTNER_DEMAND_EXCEEDED"
  | "PARTNER_WINDOW_INFEASIBLE"
  | "VEHICLE_UNAVAILABLE"
  | "VEHICLE_TEMPERATURE_INCOMPATIBLE"
  | "VEHICLE_CAPACITY_EXCEEDED";

export type CapacityValidationIssue = {
  code: CapacityIssueCode;
  constraint: CapacityConstraint;
  message: string;
  entityId?: string;
  plannedQuantityLb?: number;
  limitQuantityLb?: number;
  excessQuantityLb?: number;
  blocking: true;
  source: "calculated";
};

export type CapacityUsage = {
  plannedQuantityLb: number;
  limitQuantityLb: number;
  excessQuantityLb: number;
};

export type PartnerCapacityUsage = {
  partnerId: string;
  allocatedQuantityLb: number;
  compatibleCapacityLb: number;
  activeDemandLb: number | null;
};

export type CapacityAssessment = {
  issues: CapacityValidationIssue[];
  warehouseStorage: CapacityUsage;
  warehouseStaging: CapacityUsage;
  partnerCapacity: PartnerCapacityUsage[];
  vehiclePayload: CapacityUsage;
};

type PartnerAllocationGroup = {
  partnerId: string;
  allocatedQuantityLb: number;
  allocations: PlanOption["allocations"];
};

function nonnegativeFiniteQuantity(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function usage(plannedQuantityLb: number, limitQuantityLb: number): CapacityUsage {
  return {
    plannedQuantityLb,
    limitQuantityLb,
    excessQuantityLb: Math.max(0, plannedQuantityLb - limitQuantityLb),
  };
}

function availableWarehouseStorageLb(
  warehouse: Warehouse,
  temperatureClass: ProductLot["temperatureClass"],
): number {
  if (temperatureClass === "ambient") {
    return Math.max(0, warehouse.dryCapacityLb - warehouse.occupiedDryLb);
  }
  if (temperatureClass === "frozen") {
    return Math.max(0, warehouse.frozenCapacityLb - warehouse.occupiedFrozenLb);
  }
  return Math.max(
    0,
    warehouse.refrigeratedCapacityLb - warehouse.occupiedRefrigeratedLb,
  );
}

function compatiblePartnerCapacityLb(
  partner: PartnerAgency,
  temperatureClass: ProductLot["temperatureClass"],
): number {
  if (temperatureClass === "ambient") return partner.dryCapacityAvailableLb;
  if (temperatureClass === "frozen") return partner.frozenCapacityAvailableLb;
  return partner.refrigeratedCapacityAvailableLb;
}

function timestamp(value: string): number | null {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function occursWithinWindow(
  value: string,
  windows: Array<{ start: string; end: string }>,
): boolean {
  const time = timestamp(value);
  if (time === null) return false;
  return windows.some((window) => {
    const start = timestamp(window.start);
    const end = timestamp(window.end);
    return start !== null && end !== null && time >= start && time <= end;
  });
}

function aggregatePartnerAllocations(plan: PlanOption): PartnerAllocationGroup[] {
  const groups = new Map<string, PartnerAllocationGroup>();

  for (const allocation of plan.allocations) {
    if (
      allocation.destinationType !== "partner" &&
      allocation.destinationType !== "packing_program"
    ) {
      continue;
    }

    const current = groups.get(allocation.destinationId) ?? {
      partnerId: allocation.destinationId,
      allocatedQuantityLb: 0,
      allocations: [],
    };
    current.allocatedQuantityLb += nonnegativeFiniteQuantity(
      allocation.quantityLb,
    );
    current.allocations.push(allocation);
    groups.set(allocation.destinationId, current);
  }

  return [...groups.values()];
}

function makeIssue(
  issue: Omit<CapacityValidationIssue, "blocking" | "source">,
): CapacityValidationIssue {
  return { ...issue, blocking: true, source: "calculated" };
}

export function assessPlanCapacity(
  plan: PlanOption,
  context: PlanValidationContext,
): CapacityAssessment {
  const { productLot, warehouse, partners, vehicle } = context;
  const issues: CapacityValidationIssue[] = [];
  const temperatureLabel = productLot.temperatureClass;

  const warehouseStoredQuantityLb = plan.allocations
    .filter(
      (allocation) =>
        allocation.destinationId === warehouse.id &&
        allocation.handling === "store",
    )
    .reduce(
      (total, allocation) =>
        total + nonnegativeFiniteQuantity(allocation.quantityLb),
      nonnegativeFiniteQuantity(plan.inspectionHoldLb),
    );
  const warehouseStorage = usage(
    warehouseStoredQuantityLb,
    availableWarehouseStorageLb(warehouse, productLot.temperatureClass),
  );

  const stagedQuantityLb = plan.allocations
    .filter((allocation) => allocation.handling === "pack")
    .reduce(
      (total, allocation) =>
        total + nonnegativeFiniteQuantity(allocation.quantityLb),
      0,
    );
  const stagingLimitLb =
    productLot.temperatureClass === "refrigerated"
      ? Math.max(0, warehouse.refrigeratedStagingCapacityAvailableLb)
      : 0;
  const warehouseStaging = usage(stagedQuantityLb, stagingLimitLb);
  const outboundQuantityLb = plan.allocations
    .filter((allocation) => allocation.destinationType !== "warehouse")
    .reduce(
      (total, allocation) =>
        total + nonnegativeFiniteQuantity(allocation.quantityLb),
      0,
    );

  if (
    (warehouseStoredQuantityLb > 0 || outboundQuantityLb > 0) &&
    !warehouse.active
  ) {
    issues.push(
      makeIssue({
        code: "WAREHOUSE_UNAVAILABLE",
        constraint: "warehouse_status",
        entityId: warehouse.id,
        message: `${warehouse.name} is unavailable.`,
      }),
    );
  }

  if (warehouseStorage.excessQuantityLb > 0) {
    issues.push(
      makeIssue({
        code: "WAREHOUSE_STORAGE_CAPACITY_EXCEEDED",
        constraint: "warehouse_storage",
        entityId: warehouse.id,
        plannedQuantityLb: warehouseStorage.plannedQuantityLb,
        limitQuantityLb: warehouseStorage.limitQuantityLb,
        excessQuantityLb: warehouseStorage.excessQuantityLb,
        message: `Exceeds ${temperatureLabel} capacity by ${warehouseStorage.excessQuantityLb} lb.`,
      }),
    );
  }

  if (warehouseStaging.excessQuantityLb > 0) {
    issues.push(
      makeIssue({
        code: "WAREHOUSE_STAGING_CAPACITY_EXCEEDED",
        constraint: "warehouse_staging",
        entityId: warehouse.id,
        plannedQuantityLb: warehouseStaging.plannedQuantityLb,
        limitQuantityLb: warehouseStaging.limitQuantityLb,
        excessQuantityLb: warehouseStaging.excessQuantityLb,
        message: `${warehouse.name} exceeds refrigerated staging capacity by ${warehouseStaging.excessQuantityLb} lb (${warehouseStaging.plannedQuantityLb} lb planned; ${warehouseStaging.limitQuantityLb} lb available).`,
      }),
    );
  }

  for (const allocation of plan.allocations) {
    if (
      allocation.destinationId === warehouse.id &&
      allocation.handling === "store" &&
      !occursWithinWindow(allocation.plannedArrivalAt, warehouse.dockWindows)
    ) {
      issues.push(
        makeIssue({
          code: "WAREHOUSE_WINDOW_INFEASIBLE",
          constraint: "warehouse_window",
          entityId: warehouse.id,
          message: `${warehouse.name} cannot receive allocation ${allocation.id} at ${allocation.plannedArrivalAt}.`,
        }),
      );
    }
  }

  const partnerCapacity: PartnerCapacityUsage[] = [];
  for (const group of aggregatePartnerAllocations(plan)) {
    const partner = partners.find((candidate) => candidate.id === group.partnerId);
    if (!partner) {
      issues.push(
        makeIssue({
          code: "PARTNER_NOT_FOUND",
          constraint: "partner_status",
          entityId: group.partnerId,
          message: `Partner ${group.partnerId} was not found.`,
        }),
      );
      continue;
    }

    const compatibleCapacityLb = compatiblePartnerCapacityLb(
      partner,
      productLot.temperatureClass,
    );
    const matchingDemand = partner.demandSignals.filter(
      (signal) => signal.category === productLot.category,
    );
    const validArrivalTimes = group.allocations
      .map((allocation) => timestamp(allocation.plannedArrivalAt))
      .filter((value): value is number => value !== null);
    const latestArrivalTime = validArrivalTimes.length
      ? Math.max(...validArrivalTimes)
      : null;
    const activeDemand =
      latestArrivalTime === null
        ? []
        : matchingDemand.filter((signal) => {
            const validUntil = timestamp(signal.validUntil);
            return validUntil !== null && validUntil >= latestArrivalTime;
          });
    const activeDemandLb = activeDemand.length
      ? activeDemand.reduce(
          (total, signal) => total + signal.desiredQuantityLb,
          0,
        )
      : null;

    partnerCapacity.push({
      partnerId: partner.id,
      allocatedQuantityLb: group.allocatedQuantityLb,
      compatibleCapacityLb,
      activeDemandLb,
    });

    if (partner.status === "unavailable" || partner.status === "canceled") {
      issues.push(
        makeIssue({
          code: "PARTNER_UNAVAILABLE",
          constraint: "partner_status",
          entityId: partner.id,
          message: `${partner.name} is ${partner.status} and cannot receive an allocation.`,
        }),
      );
    }

    if (!partner.acceptedCategories.includes(productLot.category)) {
      issues.push(
        makeIssue({
          code: "PARTNER_CATEGORY_INCOMPATIBLE",
          constraint: "partner_category",
          entityId: partner.id,
          message: `${partner.name} does not accept ${productLot.category}.`,
        }),
      );
    }

    if (group.allocatedQuantityLb > compatibleCapacityLb) {
      const excessQuantityLb = group.allocatedQuantityLb - compatibleCapacityLb;
      issues.push(
        makeIssue({
          code: "PARTNER_CAPACITY_EXCEEDED",
          constraint: "partner_capacity",
          entityId: partner.id,
          plannedQuantityLb: group.allocatedQuantityLb,
          limitQuantityLb: compatibleCapacityLb,
          excessQuantityLb,
          message: `${partner.name} exceeds ${temperatureLabel} capacity by ${excessQuantityLb} lb (${group.allocatedQuantityLb} lb planned; ${compatibleCapacityLb} lb available).`,
        }),
      );
    }

    if (matchingDemand.length === 0) {
      issues.push(
        makeIssue({
          code: "PARTNER_DEMAND_MISSING",
          constraint: "partner_demand",
          entityId: partner.id,
          message: `${partner.name} has no confirmed ${productLot.category} demand.`,
        }),
      );
    } else if (activeDemand.length === 0) {
      issues.push(
        makeIssue({
          code: "PARTNER_DEMAND_EXPIRED",
          constraint: "partner_demand",
          entityId: partner.id,
          message: `${partner.name}'s ${productLot.category} demand expires before the planned arrival.`,
        }),
      );
    } else if (
      activeDemandLb !== null &&
      group.allocatedQuantityLb > activeDemandLb
    ) {
      const excessQuantityLb = group.allocatedQuantityLb - activeDemandLb;
      issues.push(
        makeIssue({
          code: "PARTNER_DEMAND_EXCEEDED",
          constraint: "partner_demand",
          entityId: partner.id,
          plannedQuantityLb: group.allocatedQuantityLb,
          limitQuantityLb: activeDemandLb,
          excessQuantityLb,
          message: `${partner.name} exceeds confirmed ${productLot.category} demand by ${excessQuantityLb} lb (${group.allocatedQuantityLb} lb planned; ${activeDemandLb} lb confirmed).`,
        }),
      );
    }

    for (const allocation of group.allocations) {
      if (
        !occursWithinWindow(
          allocation.plannedArrivalAt,
          partner.receivingWindows,
        )
      ) {
        issues.push(
          makeIssue({
            code: "PARTNER_WINDOW_INFEASIBLE",
            constraint: "partner_window",
            entityId: partner.id,
            message: `${partner.name} cannot receive allocation ${allocation.id} at ${allocation.plannedArrivalAt}.`,
          }),
        );
      }
    }
  }

  const vehiclePayload = usage(outboundQuantityLb, vehicle.capacityLb);

  if (vehicle.status === "unavailable" || vehicle.status === "maintenance") {
    issues.push(
      makeIssue({
        code: "VEHICLE_UNAVAILABLE",
        constraint: "vehicle_status",
        entityId: vehicle.id,
        message: `${vehicle.name} is ${vehicle.status} and cannot carry the plan.`,
      }),
    );
  }

  if (!vehicle.temperatureCapability.includes(productLot.temperatureClass)) {
    issues.push(
      makeIssue({
        code: "VEHICLE_TEMPERATURE_INCOMPATIBLE",
        constraint: "vehicle_temperature",
        entityId: vehicle.id,
        message: `${vehicle.name} cannot carry ${temperatureLabel} product.`,
      }),
    );
  }

  if (vehiclePayload.excessQuantityLb > 0) {
    issues.push(
      makeIssue({
        code: "VEHICLE_CAPACITY_EXCEEDED",
        constraint: "vehicle_payload",
        entityId: vehicle.id,
        plannedQuantityLb: vehiclePayload.plannedQuantityLb,
        limitQuantityLb: vehiclePayload.limitQuantityLb,
        excessQuantityLb: vehiclePayload.excessQuantityLb,
        message: `${vehicle.name} exceeds payload capacity by ${vehiclePayload.excessQuantityLb} lb (${vehiclePayload.plannedQuantityLb} lb planned; ${vehiclePayload.limitQuantityLb} lb available).`,
      }),
    );
  }

  return {
    issues,
    warehouseStorage,
    warehouseStaging,
    partnerCapacity,
    vehiclePayload,
  };
}
