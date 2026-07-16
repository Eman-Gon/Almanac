import Link from "next/link";
import { AlertTriangle, MapPinned, Snowflake, Truck } from "lucide-react";

export function NetworkSnapshot({
  partnerLocations,
  refrigeratedVehicles,
  capacityWarnings,
}: {
  partnerLocations: number;
  refrigeratedVehicles: number;
  capacityWarnings: number;
}) {
  return (
    <section className="network-snapshot" aria-labelledby="network-snapshot-title">
      <div className="network-snapshot-header">
        <div><span className="section-eyebrow">Network snapshot</span><h2 id="network-snapshot-title">Decision context at a glance</h2></div>
        <MapPinned size={20} aria-hidden="true" />
      </div>
      <div className="network-snapshot-grid">
        <div><MapPinned size={17} aria-hidden="true" /><strong>{partnerLocations}</strong><span>partner locations</span></div>
        <div><Truck size={17} aria-hidden="true" /><strong>{refrigeratedVehicles}</strong><span>refrigerated vehicle{refrigeratedVehicles === 1 ? "" : "s"} available</span></div>
        <div><AlertTriangle size={17} aria-hidden="true" /><strong>{capacityWarnings}</strong><span>capacity warning{capacityWarnings === 1 ? "" : "s"}</span></div>
      </div>
      <div className="network-snapshot-note"><Snowflake size={15} aria-hidden="true" /><span>Map layers connect demand, cold capacity, receiving windows, and route stops.</span></div>
      <Link className="button button-secondary" href="/map"><MapPinned size={16} aria-hidden="true" />Open network map</Link>
    </section>
  );
}
