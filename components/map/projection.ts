export type LatLng = { latitude: number; longitude: number };
export type WorldPoint = { x: number; y: number };
export type GeoBounds = {
  minLatitude: number;
  maxLatitude: number;
  minLongitude: number;
  maxLongitude: number;
};

export const TILE_SIZE = 256;
export const MIN_TILE_ZOOM = 10;
export const MAX_TILE_ZOOM = 16;

export function worldSize(zoom: number): number {
  return TILE_SIZE * 2 ** zoom;
}

/** Web Mercator projection into world pixel space at an integer tile zoom. */
export function project(point: LatLng, zoom: number): WorldPoint {
  const size = worldSize(zoom);
  const clampedLatitude = Math.min(85.051129, Math.max(-85.051129, point.latitude));
  const sinLatitude = Math.sin((clampedLatitude * Math.PI) / 180);
  return {
    x: ((point.longitude + 180) / 360) * size,
    y: (0.5 - Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (4 * Math.PI)) * size,
  };
}

export function unproject(point: WorldPoint, zoom: number): LatLng {
  const size = worldSize(zoom);
  const longitude = (point.x / size) * 360 - 180;
  const n = Math.PI - 2 * Math.PI * (point.y / size);
  const latitude = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  return { latitude, longitude };
}

export function boundsOf(points: LatLng[]): GeoBounds | null {
  if (!points.length) return null;
  return {
    minLatitude: Math.min(...points.map((point) => point.latitude)),
    maxLatitude: Math.max(...points.map((point) => point.latitude)),
    minLongitude: Math.min(...points.map((point) => point.longitude)),
    maxLongitude: Math.max(...points.map((point) => point.longitude)),
  };
}

export function boundsCenter(bounds: GeoBounds): LatLng {
  return {
    latitude: (bounds.minLatitude + bounds.maxLatitude) / 2,
    longitude: (bounds.minLongitude + bounds.maxLongitude) / 2,
  };
}

/** Largest integer zoom whose projected bounds fit inside the padded viewport. */
export function fitZoom(
  bounds: GeoBounds,
  width: number,
  height: number,
  padding = 56,
): number {
  for (let zoom = MAX_TILE_ZOOM; zoom > MIN_TILE_ZOOM; zoom -= 1) {
    const northWest = project({ latitude: bounds.maxLatitude, longitude: bounds.minLongitude }, zoom);
    const southEast = project({ latitude: bounds.minLatitude, longitude: bounds.maxLongitude }, zoom);
    const fitsX = southEast.x - northWest.x <= Math.max(0, width - padding * 2);
    const fitsY = southEast.y - northWest.y <= Math.max(0, height - padding * 2);
    if (fitsX && fitsY) return zoom;
  }
  return MIN_TILE_ZOOM;
}

export type TileAddress = { z: number; x: number; y: number };

/** Tiles covering the viewport around a world-pixel center, with a prefetch ring. */
export function visibleTiles(
  centerWorld: WorldPoint,
  zoom: number,
  width: number,
  height: number,
  buffer = 1,
): TileAddress[] {
  const tileCount = 2 ** zoom;
  const minX = Math.floor((centerWorld.x - width / 2) / TILE_SIZE) - buffer;
  const maxX = Math.floor((centerWorld.x + width / 2) / TILE_SIZE) + buffer;
  const minY = Math.max(0, Math.floor((centerWorld.y - height / 2) / TILE_SIZE) - buffer);
  const maxY = Math.min(tileCount - 1, Math.floor((centerWorld.y + height / 2) / TILE_SIZE) + buffer);
  const tiles: TileAddress[] = [];
  for (let x = minX; x <= maxX; x += 1) {
    for (let y = minY; y <= maxY; y += 1) {
      tiles.push({ z: zoom, x: ((x % tileCount) + tileCount) % tileCount, y });
    }
  }
  return tiles;
}

export type WindowState =
  | { kind: "open"; fractionRemaining: number; minutesRemaining: number }
  | { kind: "upcoming"; minutesUntilOpen: number }
  | { kind: "closed" };

/** Receiving-window position relative to the deterministic scenario clock. */
export function windowState(
  window: { start: string; end: string },
  scenarioNowIso: string,
): WindowState {
  const now = Date.parse(scenarioNowIso);
  const start = Date.parse(window.start);
  const end = Date.parse(window.end);
  if (now >= end) return { kind: "closed" };
  if (now < start) return { kind: "upcoming", minutesUntilOpen: Math.round((start - now) / 60_000) };
  return {
    kind: "open",
    fractionRemaining: Math.min(1, Math.max(0, (end - now) / (end - start))),
    minutesRemaining: Math.round((end - now) / 60_000),
  };
}
