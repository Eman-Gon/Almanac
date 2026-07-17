import { describe, expect, it } from "vitest";
import {
  DonationOfferSchema,
  DonorSchema,
  AgencyAcceptanceHistorySchema,
  PartnerAgencySchema,
  ProductLotSchema,
  VehicleSchema,
  WarehouseSchema,
} from "@/domain/schemas/core";
import {
  backgroundMissions,
  donation,
  donor,
  expirationRiskItems,
  historicalDonationOffers,
  historicalInventoryLots,
  partners,
  productLot,
  vehicles,
  warehouse,
} from "@/data/seed/scenario";

describe("seed schemas", () => {
  it("validates the compatibility donation and primary existing-inventory lot", () => {
    expect(DonationOfferSchema.safeParse(donation).success).toBe(true);
    expect(ProductLotSchema.safeParse(productLot).success).toBe(true);
    expect(productLot).toMatchObject({
      id: "LOT-104",
      sourceType: "existing_inventory",
      availableQuantityLb: 1_200,
      currentLocationId: "WH-001",
      conditionStatus: "staff_cleared",
      status: "available",
    });
  });

  it("validates donor, warehouse, partner, and vehicle fixtures", () => {
    expect(DonorSchema.safeParse(donor).success).toBe(true);
    expect(WarehouseSchema.safeParse(warehouse).success).toBe(true);
    expect(partners.every((partner) => PartnerAgencySchema.safeParse(partner).success)).toBe(true);
    expect(
      partners.every((partner) =>
        partner.acceptanceHistory.every(
          (history) => AgencyAcceptanceHistorySchema.safeParse(history).success,
        ),
      ),
    ).toBe(true);
    expect(vehicles.every((vehicle) => VehicleSchema.safeParse(vehicle).success)).toBe(true);
    expect(warehouse.refrigeratedStagingCapacityAvailableLb).toBe(500);
    expect(partners.find((partner) => partner.id === "PAR-003")).toMatchObject({
      refrigeratedCapacityAvailableLb: 500,
      demandSignals: [expect.objectContaining({ desiredQuantityLb: 460 })],
    });
  });

  it("rejects a negative donation quantity", () => {
    const invalid = DonationOfferSchema.safeParse({ ...donation, quantityLb: -1 });
    expect(invalid.success).toBe(false);
  });

  it("rejects missing inventory facts and available pounds above the physical lot", () => {
    const missingRiskDeadline = { ...productLot, riskDeadline: undefined };
    expect(ProductLotSchema.safeParse(missingRiskDeadline).success).toBe(false);
    expect(
      ProductLotSchema.safeParse({
        ...productLot,
        availableQuantityLb: productLot.quantityLb + 1,
      }).success,
    ).toBe(false);
  });

  it("rejects acceptance history whose counts, sample, or rate do not reconcile", () => {
    const history = partners[0].acceptanceHistory[0];
    expect(
      AgencyAcceptanceHistorySchema.safeParse({
        ...history,
        refusedCount: history.refusedCount + 1,
      }).success,
    ).toBe(false);
    expect(
      AgencyAcceptanceHistorySchema.safeParse({
        ...history,
        acceptanceRatePct: history.acceptanceRatePct - 1,
      }).success,
    ).toBe(false);
  });

  it("keeps mock donation history positive, unique, and non-operational", () => {
    const ids = historicalDonationOffers.map((offer) => offer.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(historicalDonationOffers.every((offer) => offer.quantityLb > 0)).toBe(true);
    expect(
      historicalDonationOffers.every((offer) =>
        ["closed", "redirected", "declined"].includes(offer.status),
      ),
    ).toBe(true);
    expect(ids).not.toContain(donation.id);
  });

  it("keeps display-only inventory history distinct from the executable lot", () => {
    const ids = historicalInventoryLots.map((lot) => lot.id);
    expect(ids).toHaveLength(18);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).not.toContain(productLot.id);
    expect(historicalInventoryLots.every((lot) => lot.quantityLb > 0)).toBe(true);
  });

  it("keeps dashboard context fixtures populated and display-only", () => {
    expect(backgroundMissions).toHaveLength(10);
    expect(new Set(backgroundMissions.map((mission) => mission.id)).size).toBe(backgroundMissions.length);
    expect(expirationRiskItems).toHaveLength(12);
    expect(expirationRiskItems.every((item) => item.quantityLb > 0)).toBe(true);
  });
});
