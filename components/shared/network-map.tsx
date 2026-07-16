"use client";

import Link from "next/link";
import { Building2, MapPin, Package, Truck, Warehouse } from "lucide-react";
import { useDemoState } from "@/state/demo-state";

const points = {
  donor: { x: 24, y: 22 },
  warehouse: { x: 49, y: 49 },
  harbor: { x: 77, y: 27 },
  eastside: { x: 82, y: 73 },
  kitchen: { x: 27, y: 76 },
  alternate: { x: 62, y: 17 },
  vehicle: { x: 56, y: 55 },
};

export type MapVariant = "initial" | "recovery";
export type MapLayers = {
  routes: boolean;
  demand: boolean;
  capacity: boolean;
  vehicles: boolean;
};

const defaultLayers: MapLayers = {
  routes: true,
  demand: true,
  capacity: true,
  vehicles: true,
};

function Marker({
  point,
  tone,
  icon: Icon,
  label,
}: {
  point: { x: number; y: number };
  tone: string;
  icon: typeof MapPin;
  label: string;
}) {
  return (
    <span
      className={`map-marker marker-${tone}`}
      style={{ left: `${point.x}%`, top: `${point.y}%` }}
      aria-label={label}
    >
      <Icon size={15} strokeWidth={2.2} aria-hidden="true" />
    </span>
  );
}

export function NetworkMap({
  variant = "initial",
  showList = true,
  layers = defaultLayers,
}: {
  variant?: MapVariant;
  showList?: boolean;
  layers?: MapLayers;
}) {
  const { state } = useDemoState();
  const recovery = variant === "recovery";
  const eastsideCanceled = state.partnerStatusOverrides["PAR-002"] === "canceled";
  const route = recovery
    ? "24,22 49,49 77,27 62,17 27,76"
    : "24,22 49,49 77,27 82,73 27,76";

  return (
    <div className={`network-map-layout ${showList ? "with-list" : ""}`}>
      <div className="map-canvas" role="img" aria-label="Schematic route map for the current mission">
        <svg className="map-streets" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path d="M4 12 L96 82 M2 75 L89 8 M16 96 L82 2 M0 42 L100 48 M48 0 L45 100" />
          <path d="M8 28 C26 20 31 42 49 32 S74 23 96 30 M7 63 C31 55 43 72 61 61 S80 54 98 65" />
          {layers.routes ? <polyline className="map-route" data-testid="map-route-layer" points={route} /> : null}
        </svg>
        <Marker point={points.donor} tone="red" icon={Package} label="Market Street Grocery donor" />
        {layers.capacity ? <Marker point={points.warehouse} tone="purple" icon={Warehouse} label="South County Distribution Center warehouse" /> : null}
        {layers.demand ? <Marker point={points.harbor} tone="green" icon={Building2} label="Harbor Light Pantry partner" /> : null}
        {layers.demand && recovery ? (
          <Marker point={points.alternate} tone="green" icon={Building2} label="Northside Family Resource Center alternate partner" />
        ) : layers.demand ? (
          <Marker point={points.eastside} tone={eastsideCanceled ? "red" : "green"} icon={Building2} label={`Eastside Community Pantry partner${eastsideCanceled ? " canceled" : ""}`} />
        ) : null}
        {layers.demand ? <Marker point={points.kitchen} tone="green" icon={Building2} label="Community Kitchen partner" /> : null}
        {layers.vehicles ? <Marker point={points.vehicle} tone="blue" icon={Truck} label="Refrigerated vehicle on route" /> : null}
      </div>

      {showList ? (
        <div className="map-location-list" aria-label="Synchronized route locations">
          <div className="map-list-title">Route locations</div>
          <span><span className="legend-dot red" />Market Street Grocery</span>
          {layers.capacity ? <span><span className="legend-dot purple" />South County facility</span> : null}
          {layers.demand ? <Link href="/partners/PAR-001"><span className="legend-dot green" />Harbor Light Pantry</Link> : null}
          {layers.demand ? <Link href={recovery ? "/partners/PAR-004" : "/partners/PAR-002"}>
            <span className="legend-dot green" />
            {recovery ? "Northside Resource Center" : `Eastside Community Pantry${eastsideCanceled ? " · canceled" : ""}`}
          </Link> : null}
          {layers.demand ? <Link href="/partners/PAR-003"><span className="legend-dot green" />Community Kitchen</Link> : null}
          {layers.vehicles ? <span><span className="legend-dot blue" />Refrigerated vehicle</span> : null}
          <div className="map-sync-note">Map and list are synchronized</div>
        </div>
      ) : null}
    </div>
  );
}
