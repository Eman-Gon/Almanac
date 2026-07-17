import { z } from "zod";
import {
  EntityIdSchema,
  ISODateTimeSchema,
  ProductLotSchema,
  RiskLevelSchema,
  TemperatureClassSchema,
  TimeWindowSchema,
} from "@/domain/schemas/core";

const StorageHeadroomSchema = z.object({
  ambient: z.number().nonnegative(),
  refrigerated: z.number().nonnegative(),
  frozen: z.number().nonnegative(),
});

const PreviewDemandSchema = z.object({
  productLotId: EntityIdSchema,
  desiredQuantityLb: z.number().positive(),
  urgency: RiskLevelSchema,
  historyConfidence: z.enum(["high", "medium", "low", "unknown"]),
  source: z.literal("synthetic_aggregate"),
});

const PreviewPartnerSchema = z.object({
  id: EntityIdSchema,
  name: z.string().min(1),
  capacityLb: z.number().positive(),
  temperatureCapabilities: z.array(TemperatureClassSchema).min(1),
  receivingWindow: TimeWindowSchema,
  demands: z.array(PreviewDemandSchema).min(1),
});

export const MultiItemScenarioSchema = z.object({
  id: EntityIdSchema,
  name: z.string().min(1),
  version: z.literal("multi-item-preview-v1"),
  warehouseId: EntityIdSchema,
  warehouseName: z.string().min(1),
  referenceTime: ISODateTimeSchema,
  storageHeadroomLb: StorageHeadroomSchema,
  lots: z.array(ProductLotSchema).min(2),
  partners: z.array(PreviewPartnerSchema).min(1),
}).superRefine((fixture, context) => {
  const lotIds = new Set<string>();
  for (const [index, lot] of fixture.lots.entries()) {
    if (lotIds.has(lot.id)) {
      context.addIssue({
        code: "custom",
        message: `Duplicate product-lot ID ${lot.id}.`,
        path: ["lots", index, "id"],
      });
    }
    lotIds.add(lot.id);
    if (lot.currentLocationId !== fixture.warehouseId) {
      context.addIssue({
        code: "custom",
        message: "Every preview lot must already be at the scenario warehouse.",
        path: ["lots", index, "currentLocationId"],
      });
    }
  }

  const partnerIds = new Set<string>();
  for (const [partnerIndex, partner] of fixture.partners.entries()) {
    if (partnerIds.has(partner.id)) {
      context.addIssue({
        code: "custom",
        message: `Duplicate preview partner ID ${partner.id}.`,
        path: ["partners", partnerIndex, "id"],
      });
    }
    partnerIds.add(partner.id);

    const demandLotIds = new Set<string>();
    for (const [demandIndex, demand] of partner.demands.entries()) {
      if (!lotIds.has(demand.productLotId)) {
        context.addIssue({
          code: "custom",
          message: `Demand references unknown lot ${demand.productLotId}.`,
          path: ["partners", partnerIndex, "demands", demandIndex, "productLotId"],
        });
      }
      if (demandLotIds.has(demand.productLotId)) {
        context.addIssue({
          code: "custom",
          message: `Partner ${partner.id} has duplicate demand for ${demand.productLotId}.`,
          path: ["partners", partnerIndex, "demands", demandIndex, "productLotId"],
        });
      }
      demandLotIds.add(demand.productLotId);
    }
  }
});

export type MultiItemScenario = z.infer<typeof MultiItemScenarioSchema>;
export type PreviewProductLot = MultiItemScenario["lots"][number];
export type PreviewPartner = MultiItemScenario["partners"][number];

export const MULTI_ITEM_URGENCY_CONFIG = {
  ruleset: "inventory-urgency-v1",
  weights: {
    deadlinePressure: 0.55,
    riskSignal: 0.3,
    storagePressure: 0.15,
  },
  deadlinePressure: {
    passed: 100,
    sixHours: 95,
    twelveHours: 85,
    twentyFourHours: 70,
    fortyEightHours: 60,
    seventyTwoHours: 40,
    later: 15,
  },
  riskSignal: {
    low: 10,
    medium: 40,
    high: 75,
    critical: 100,
  },
} as const;

export type RankedPortfolioLot = {
  lot: PreviewProductLot;
  urgencyScore: number;
  urgencyBand: "low" | "medium" | "high" | "critical";
  hoursUntilRisk: number;
  compatibleStorageHeadroomLb: number;
  overflowLb: number;
  planningBlocked: boolean;
  reasons: string[];
};

export type MultiItemAllocation = {
  id: string;
  productLotId: string;
  destinationId: string;
  quantityLb: number;
  demandHistoryConfidence: "high" | "medium" | "low" | "unknown";
};

export type MultiItemDisposition = {
  productLotId: string;
  retainedQuantityLb: number;
  inspectionHoldLb: number;
};

export type LotReconciliation = {
  productLotId: string;
  availableQuantityLb: number;
  allocatedQuantityLb: number;
  retainedQuantityLb: number;
  inspectionHoldLb: number;
  accountedQuantityLb: number;
  reconciles: boolean;
};

export type MultiItemReconciliation = {
  perLot: LotReconciliation[];
  totalAvailableQuantityLb: number;
  totalAccountedQuantityLb: number;
  reconciles: boolean;
  issues: string[];
};

export type PartnerOutreachGroup = {
  partnerId: string;
  partnerName: string;
  receivingWindow: PreviewPartner["receivingWindow"];
  capacityLb: number;
  allocatedQuantityLb: number;
  lineItems: Array<{
    productLotId: string;
    productName: string;
    quantityLb: number;
    historyConfidence: MultiItemAllocation["demandHistoryConfidence"];
  }>;
  draft: string;
};

export type MultiItemPlanPreview = {
  id: "PLN-MULTI-201";
  ruleset: "multi-item-match-v1";
  status: "preview";
  rankedLots: RankedPortfolioLot[];
  allocations: MultiItemAllocation[];
  dispositions: MultiItemDisposition[];
  outreachGroups: PartnerOutreachGroup[];
  reconciliation: MultiItemReconciliation;
  plannedOutboundQuantityLb: number;
  retainedQuantityLb: number;
  inspectionHoldLb: number;
};

function deadlinePressure(hoursUntilRisk: number): number {
  const bands = MULTI_ITEM_URGENCY_CONFIG.deadlinePressure;
  if (hoursUntilRisk <= 0) return bands.passed;
  if (hoursUntilRisk <= 6) return bands.sixHours;
  if (hoursUntilRisk <= 12) return bands.twelveHours;
  if (hoursUntilRisk <= 24) return bands.twentyFourHours;
  if (hoursUntilRisk <= 48) return bands.fortyEightHours;
  if (hoursUntilRisk <= 72) return bands.seventyTwoHours;
  return bands.later;
}

function storagePressure(overflowPct: number): number {
  if (overflowPct >= 80) return 100;
  if (overflowPct >= 60) return 75;
  if (overflowPct >= 30) return 40;
  if (overflowPct > 0) return 15;
  return 0;
}

function urgencyBand(score: number): RankedPortfolioLot["urgencyBand"] {
  if (score >= 80) return "critical";
  if (score >= 60) return "high";
  if (score >= 35) return "medium";
  return "low";
}

export function rankMultiItemLots(
  input: Pick<MultiItemScenario, "lots" | "referenceTime" | "storageHeadroomLb">,
): RankedPortfolioLot[] {
  const referenceMs = Date.parse(input.referenceTime);
  return input.lots
    .map((lot) => {
      const hoursUntilRisk = (Date.parse(lot.riskDeadline) - referenceMs) / (60 * 60 * 1_000);
      const compatibleStorageHeadroomLb = input.storageHeadroomLb[lot.temperatureClass];
      const overflowLb = Math.max(0, lot.availableQuantityLb - compatibleStorageHeadroomLb);
      const overflowPct = lot.availableQuantityLb === 0
        ? 0
        : (overflowLb / lot.availableQuantityLb) * 100;
      const score = Math.round(
        deadlinePressure(hoursUntilRisk) * MULTI_ITEM_URGENCY_CONFIG.weights.deadlinePressure
        + MULTI_ITEM_URGENCY_CONFIG.riskSignal[lot.riskLevel]
          * MULTI_ITEM_URGENCY_CONFIG.weights.riskSignal
        + storagePressure(overflowPct) * MULTI_ITEM_URGENCY_CONFIG.weights.storagePressure,
      );
      const planningBlocked = lot.conditionStatus !== "staff_cleared";
      const reasons = [
        `${Math.max(0, Math.round(hoursUntilRisk))} hours to the seeded operational risk deadline`,
        overflowLb > 0
          ? `${overflowLb.toLocaleString()} lb exceeds compatible long-term storage headroom`
          : "Compatible long-term storage headroom covers this lot",
        planningBlocked
          ? "Staff confirmation is required before release planning"
          : "Staff condition status is cleared for preview planning",
      ];
      return {
        lot,
        urgencyScore: score,
        urgencyBand: urgencyBand(score),
        hoursUntilRisk,
        compatibleStorageHeadroomLb,
        overflowLb,
        planningBlocked,
        reasons,
      };
    })
    .sort((left, right) =>
      right.urgencyScore - left.urgencyScore
      || Date.parse(left.lot.riskDeadline) - Date.parse(right.lot.riskDeadline)
      || left.lot.id.localeCompare(right.lot.id),
    );
}

export function reconcileMultiItemPlan(
  lots: PreviewProductLot[],
  allocations: MultiItemAllocation[],
  dispositions: MultiItemDisposition[],
): MultiItemReconciliation {
  const knownLotIds = new Set(lots.map((lot) => lot.id));
  const issues: string[] = [];
  for (const allocation of allocations) {
    if (!knownLotIds.has(allocation.productLotId)) {
      issues.push(`Allocation ${allocation.id} references unknown lot ${allocation.productLotId}.`);
    }
    if (allocation.quantityLb < 0) {
      issues.push(`Allocation ${allocation.id} has a negative quantity.`);
    }
  }

  const dispositionByLotId = new Map(
    dispositions.map((disposition) => [disposition.productLotId, disposition]),
  );
  const perLot = lots.map((lot): LotReconciliation => {
    const allocatedQuantityLb = allocations
      .filter((allocation) => allocation.productLotId === lot.id)
      .reduce((sum, allocation) => sum + allocation.quantityLb, 0);
    const disposition = dispositionByLotId.get(lot.id);
    const retainedQuantityLb = disposition?.retainedQuantityLb ?? 0;
    const inspectionHoldLb = disposition?.inspectionHoldLb ?? 0;
    const accountedQuantityLb = allocatedQuantityLb + retainedQuantityLb + inspectionHoldLb;
    const reconciles = accountedQuantityLb === lot.availableQuantityLb;
    if (!reconciles) {
      issues.push(
        `${lot.id} accounts for ${accountedQuantityLb} of ${lot.availableQuantityLb} available lb.`,
      );
    }
    if (lot.conditionStatus !== "staff_cleared" && allocatedQuantityLb > 0) {
      issues.push(`${lot.id} cannot be allocated before staff condition confirmation.`);
    }
    return {
      productLotId: lot.id,
      availableQuantityLb: lot.availableQuantityLb,
      allocatedQuantityLb,
      retainedQuantityLb,
      inspectionHoldLb,
      accountedQuantityLb,
      reconciles,
    };
  });

  const totalAvailableQuantityLb = perLot.reduce(
    (sum, lot) => sum + lot.availableQuantityLb,
    0,
  );
  const totalAccountedQuantityLb = perLot.reduce(
    (sum, lot) => sum + lot.accountedQuantityLb,
    0,
  );
  return {
    perLot,
    totalAvailableQuantityLb,
    totalAccountedQuantityLb,
    reconciles: issues.length === 0 && totalAvailableQuantityLb === totalAccountedQuantityLb,
    issues,
  };
}

function buildOutreachGroups(
  fixture: MultiItemScenario,
  allocations: MultiItemAllocation[],
): PartnerOutreachGroup[] {
  const lotById = new Map(fixture.lots.map((lot) => [lot.id, lot]));
  return fixture.partners.flatMap((partner) => {
    const partnerAllocations = allocations.filter(
      (allocation) => allocation.destinationId === partner.id,
    );
    if (partnerAllocations.length === 0) return [];
    const lineItems = partnerAllocations.map((allocation) => {
      const lot = lotById.get(allocation.productLotId);
      if (!lot) throw new Error(`Unknown preview lot ${allocation.productLotId}.`);
      return {
        productLotId: lot.id,
        productName: lot.productName,
        quantityLb: allocation.quantityLb,
        historyConfidence: allocation.demandHistoryConfidence,
      };
    });
    const allocatedQuantityLb = lineItems.reduce((sum, line) => sum + line.quantityLb, 0);
    const itemSummary = lineItems
      .map((line) => `${line.quantityLb.toLocaleString()} lb ${line.productName.toLowerCase()}`)
      .join(" and ");
    return [{
      partnerId: partner.id,
      partnerName: partner.name,
      receivingWindow: partner.receivingWindow,
      capacityLb: partner.capacityLb,
      allocatedQuantityLb,
      lineItems,
      draft: `Almanac preview: Can your team receive ${itemSummary} from ${fixture.warehouseName}? This is a draft only; no inventory is reserved and no commitment is recorded.`,
    }];
  });
}

export function buildMultiItemPlanPreview(
  input: MultiItemScenario,
): MultiItemPlanPreview {
  const fixture = MultiItemScenarioSchema.parse(input);
  const rankedLots = rankMultiItemLots(fixture);
  const partnerUsedLb = new Map(fixture.partners.map((partner) => [partner.id, 0]));
  const allocations: MultiItemAllocation[] = [];
  const dispositions: MultiItemDisposition[] = [];

  for (const ranked of rankedLots) {
    const lot = ranked.lot;
    if (ranked.planningBlocked) {
      dispositions.push({
        productLotId: lot.id,
        retainedQuantityLb: 0,
        inspectionHoldLb: lot.availableQuantityLb,
      });
      continue;
    }

    let remainingQuantityLb = lot.availableQuantityLb;
    for (const partner of fixture.partners) {
      if (remainingQuantityLb === 0) break;
      if (!partner.temperatureCapabilities.includes(lot.temperatureClass)) continue;
      const demand = partner.demands.find((item) => item.productLotId === lot.id);
      if (!demand) continue;
      const usedQuantityLb = partnerUsedLb.get(partner.id) ?? 0;
      const capacityRemainingLb = Math.max(0, partner.capacityLb - usedQuantityLb);
      const quantityLb = Math.min(
        remainingQuantityLb,
        demand.desiredQuantityLb,
        capacityRemainingLb,
      );
      if (quantityLb === 0) continue;
      allocations.push({
        id: `MAL-${String(allocations.length + 1).padStart(3, "0")}`,
        productLotId: lot.id,
        destinationId: partner.id,
        quantityLb,
        demandHistoryConfidence: demand.historyConfidence,
      });
      partnerUsedLb.set(partner.id, usedQuantityLb + quantityLb);
      remainingQuantityLb -= quantityLb;
    }

    dispositions.push({
      productLotId: lot.id,
      retainedQuantityLb: remainingQuantityLb,
      inspectionHoldLb: 0,
    });
  }

  const reconciliation = reconcileMultiItemPlan(
    fixture.lots,
    allocations,
    dispositions,
  );
  if (!reconciliation.reconciles) {
    throw new Error(reconciliation.issues.join(" "));
  }

  return {
    id: "PLN-MULTI-201",
    ruleset: "multi-item-match-v1",
    status: "preview",
    rankedLots,
    allocations,
    dispositions,
    outreachGroups: buildOutreachGroups(fixture, allocations),
    reconciliation,
    plannedOutboundQuantityLb: allocations.reduce(
      (sum, allocation) => sum + allocation.quantityLb,
      0,
    ),
    retainedQuantityLb: dispositions.reduce(
      (sum, disposition) => sum + disposition.retainedQuantityLb,
      0,
    ),
    inspectionHoldLb: dispositions.reduce(
      (sum, disposition) => sum + disposition.inspectionHoldLb,
      0,
    ),
  };
}
