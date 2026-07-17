import { describe, expect, it } from "vitest";
import {
  boundsCenter,
  boundsOf,
  fitZoom,
  MIN_TILE_ZOOM,
  project,
  unproject,
  visibleTiles,
  windowState,
  worldSize,
} from "@/components/map/projection";

const sanJose = { latitude: 37.3018, longitude: -121.8737 };

describe("web mercator projection", () => {
  it("round-trips project and unproject", () => {
    for (const zoom of [10, 12, 16]) {
      const world = project(sanJose, zoom);
      const back = unproject(world, zoom);
      expect(back.latitude).toBeCloseTo(sanJose.latitude, 6);
      expect(back.longitude).toBeCloseTo(sanJose.longitude, 6);
    }
  });

  it("projects the equator/prime-meridian origin to the world center", () => {
    const world = project({ latitude: 0, longitude: 0 }, 12);
    expect(world.x).toBeCloseTo(worldSize(12) / 2, 6);
    expect(world.y).toBeCloseTo(worldSize(12) / 2, 6);
  });

  it("keeps northern latitudes above southern ones in pixel space", () => {
    const north = project({ latitude: 37.43, longitude: -121.9 }, 12);
    const south = project({ latitude: 37.22, longitude: -121.9 }, 12);
    expect(north.y).toBeLessThan(south.y);
  });
});

describe("fitZoom", () => {
  const bounds = {
    minLatitude: 37.2248,
    maxLatitude: 37.4323,
    minLongitude: -121.9405,
    maxLongitude: -121.7419,
  };

  it("selects a zoom whose projected span fits the padded viewport", () => {
    const zoom = fitZoom(bounds, 900, 600);
    const northWest = project({ latitude: bounds.maxLatitude, longitude: bounds.minLongitude }, zoom);
    const southEast = project({ latitude: bounds.minLatitude, longitude: bounds.maxLongitude }, zoom);
    expect(southEast.x - northWest.x).toBeLessThanOrEqual(900 - 112);
    expect(southEast.y - northWest.y).toBeLessThanOrEqual(600 - 112);
  });

  it("never returns less than the minimum tile zoom", () => {
    expect(fitZoom(bounds, 10, 10)).toBe(MIN_TILE_ZOOM);
  });
});

describe("visibleTiles", () => {
  it("covers the viewport with a one-tile buffer ring", () => {
    const center = project(sanJose, 12);
    const tiles = visibleTiles(center, 12, 512, 512);
    const columns = Math.ceil(512 / 256) + 1 + 2;
    expect(tiles.length).toBeGreaterThanOrEqual(columns * columns - columns);
    for (const tile of tiles) {
      expect(tile.z).toBe(12);
      expect(tile.x).toBeGreaterThanOrEqual(0);
      expect(tile.y).toBeGreaterThanOrEqual(0);
      expect(tile.x).toBeLessThan(2 ** 12);
      expect(tile.y).toBeLessThan(2 ** 12);
    }
  });
});

describe("windowState against the scenario clock", () => {
  const window = { start: "2026-07-15T09:00:00-07:00", end: "2026-07-15T12:00:00-07:00" };

  it("reports remaining fraction and minutes while open", () => {
    const state = windowState(window, "2026-07-15T11:18:00-07:00");
    expect(state.kind).toBe("open");
    if (state.kind === "open") {
      expect(state.minutesRemaining).toBe(42);
      expect(state.fractionRemaining).toBeCloseTo(42 / 180, 5);
    }
  });

  it("reports closed at or after the end", () => {
    expect(windowState(window, "2026-07-15T12:00:00-07:00").kind).toBe("closed");
    expect(windowState(window, "2026-07-15T13:00:00-07:00").kind).toBe("closed");
  });

  it("reports upcoming before the start", () => {
    const state = windowState(window, "2026-07-15T08:30:00-07:00");
    expect(state.kind).toBe("upcoming");
    if (state.kind === "upcoming") expect(state.minutesUntilOpen).toBe(30);
  });
});

describe("boundsOf", () => {
  it("returns null for empty input and a center for seeded points", () => {
    expect(boundsOf([])).toBeNull();
    const bounds = boundsOf([sanJose, { latitude: 37.43, longitude: -121.75 }]);
    expect(bounds).not.toBeNull();
    if (bounds) {
      const center = boundsCenter(bounds);
      expect(center.latitude).toBeCloseTo((37.3018 + 37.43) / 2, 6);
      expect(center.longitude).toBeCloseTo((-121.8737 + -121.75) / 2, 6);
    }
  });
});
