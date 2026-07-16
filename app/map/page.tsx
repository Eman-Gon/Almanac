"use client";

import Link from "next/link";
import { CheckCircle2, Filter, Snowflake } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { NetworkMap } from "@/components/shared/network-map";
import { Panel } from "@/components/shared/panel";
import { partners } from "@/data/seed/scenario";
import { useDemoState } from "@/state/demo-state";

export default function MapPage() {
  const { state } = useDemoState();
  const [layers, setLayers] = useState({ routes: true, demand: true, capacity: true, vehicles: true });
  const recovery = state.stage === "recovered";

  return (
    <>
      <PageHeader title="Demand & Capacity Map" subtitle="Operational context behind the current allocation and route." actions={<Link className="button button-secondary" href={recovery ? "/missions/MSN-105" : "/missions/MSN-104"}>Open mission</Link>} />
      <div className="page-content map-page">
        <Panel className="map-control-panel">
          <div className="map-controls" aria-label="Map layers">
            <span><Filter size={16} aria-hidden="true" />Layers</span>
            {Object.entries(layers).map(([key, value]) => <label key={key}><input type="checkbox" checked={value} onChange={() => setLayers((current) => ({ ...current, [key]: !current[key as keyof typeof current] }))} />{key[0].toUpperCase() + key.slice(1)}</label>)}
            <span className="map-control-note"><Snowflake size={15} aria-hidden="true" />Refrigerated product fit</span>
          </div>
        </Panel>
        <Panel title={recovery ? "Replanned network" : "Current network"} className="full-map-panel"><NetworkMap variant={recovery ? "recovery" : "initial"} layers={layers} /></Panel>
        <Panel title="Partner capacity and receiving windows">
          <div className="table-scroll">
            <table className="data-table partner-map-table"><thead><tr><th>Partner</th><th>Status</th><th>Produce demand</th><th>Refrigerated capacity</th><th>Receiving window</th><th>Product fit</th></tr></thead><tbody>{partners.slice(0, 6).map((partner) => { const status = state.partnerStatusOverrides[partner.id] ?? partner.status; return <tr key={partner.id}><td><Link href={`/partners/${partner.id}`}><strong>{partner.name}</strong><span>{partner.location.city}</span></Link></td><td><span className={`plain-status plain-status-${status === "available" ? "green" : status === "limited" ? "amber" : "red"}`}>{status}</span></td><td>{partner.demandSignals[0].desiredQuantityLb} lb · {partner.demandSignals[0].urgency}</td><td>{partner.refrigeratedCapacityAvailableLb} lb</td><td>9:30 AM – 1:00 PM</td><td>{status === "canceled" || status === "unavailable" ? <span className="conflict-cell">Unavailable today</span> : <span className="fit-cell"><CheckCircle2 size={14} aria-hidden="true" />Compatible</span>}</td></tr>; })}</tbody></table>
          </div>
        </Panel>
      </div>
    </>
  );
}
