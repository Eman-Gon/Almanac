import { describe, expect, it } from "vitest";
import {
  DonationOfferSchema,
  DonorSchema,
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
  partners,
  productLot,
  vehicles,
  warehouse,
} from "@/data/seed/scenario";

describe("seed schemas", () => {
  it("validates the primary donation and product lot", () => {
    expect(DonationOfferSchema.safeParse(donation).success).toBe(true);
    expect(ProductLotSchema.safeParse(productLot).success).toBe(true);
  });

  it("validates donor, warehouse, partner, and vehicle fixtures", () => {
    expect(DonorSchema.safeParse(donor).success).toBe(true);
    expect(WarehouseSchema.safeParse(warehouse).success).toBe(true);
    expect(partners.every((partner) => PartnerAgencySchema.safeParse(partner).success)).toBe(true);
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

  it("keeps dashboard context fixtures populated and display-only", () => {
    expect(backgroundMissions).toHaveLength(5);
    expect(new Set(backgroundMissions.map((mission) => mission.id)).size).toBe(backgroundMissions.length);
    expect(expirationRiskItems).toHaveLength(6);
    expect(expirationRiskItems.every((item) => item.quantityLb > 0)).toBe(true);
  });
});
