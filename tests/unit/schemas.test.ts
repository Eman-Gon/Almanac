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
  donation,
  donor,
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
});
