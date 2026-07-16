"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Snowflake,
  Truck,
  UserX,
} from "lucide-react";
import { useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { NetworkMap } from "@/components/shared/network-map";
import { Panel } from "@/components/shared/panel";
import { generatePlanSet, getDestinationName } from "@/domain/planning/generate-plans";
import { accountedQuantityLb, validatePlanOption } from "@/domain/planning/quantity";
import { scenarioValidationContext } from "@/domain/planning/scenario-context";
import { createRecoveryOption } from "@/domain/recovery/create-recovery";
import { useDemoState } from "@/state/demo-state";

const previewDisruptions = [
  { label: "Truck breakdown", icon: Truck },
  { label: "Cold capacity lost", icon: Snowflake },
  { label: "Driver unavailable", icon: UserX },
  { label: "Pickup deadline shortened", icon: Clock3 },
] as const;

export default function SimulatePage() {
  const router = useRouter();
  const { state, triggerDisruption, approveRecovery } = useDemoState();
  const planSet = useMemo(() => generatePlanSet(), []);
  const selectedCandidate =
    state.approvedPlan ??
    state.planOverrides[state.selectedPlanId] ??
    planSet.options.find((option) => option.id === state.selectedPlanId) ??
    planSet.options[2];
  const original =
    selectedCandidate.allocations.some((allocation) => allocation.destinationId === "PAR-002") &&
    selectedCandidate.allocations.some((allocation) => allocation.destinationId === "PAR-003")
      ? selectedCandidate
      : planSet.options[2];
  const recovery = state.disruption?.recoveryOption ?? createRecoveryOption(original);
  const disrupted = state.stage === "disrupted" || state.stage === "recovered";
  const recovered = state.stage === "recovered";
  const originalMission = state.missions["MSN-104"];
  const affectedStop = originalMission?.stops.find((stop) => stop.locationId === "PAR-002");
  const missionReady = Boolean(
    state.stage === "approved" &&
    state.approvedPlan &&
    originalMission &&
    (originalMission.status === "assigned" || originalMission.status === "in_transit") &&
    affectedStop?.status === "pending" &&
    affectedStop.quantityDropoffLb > 0,
  );
  const unavailableReason = !state.approvedPlan
    ? "Approve a mission first"
    : originalMission?.status === "delivered"
      ? "Mission already delivered"
      : "Cancellation is not available";
  const validation = validatePlanOption(recovery, scenarioValidationContext);
  const affectedQuantityLb =
    state.disruption?.affectedQuantityLb ??
    original.allocations
      .filter((allocation) => allocation.destinationId === "PAR-002")
      .reduce((total, allocation) => total + allocation.quantityLb, 0);
  const alternateQuantityLb =
    recovery.allocations.find((allocation) => allocation.destinationId === "PAR-004")
      ?.quantityLb ?? 0;
  const originalMealKitLb =
    original.allocations.find((allocation) => allocation.destinationId === "PAR-003")
      ?.quantityLb ?? 0;
  const recoveredMealKitLb =
    recovery.allocations.find((allocation) => allocation.destinationId === "PAR-003")
      ?.quantityLb ?? 0;
  const mealKitIncreaseLb = recoveredMealKitLb - originalMealKitLb;
  const inspectionHoldIncreaseLb = recovery.inspectionHoldLb - original.inspectionHoldLb;

  function approve() {
    if (!validation.approvable) return;
    approveRecovery();
    router.push("/missions/MSN-105");
  }

  return (
    <>
      <PageHeader
        title="Disruption Simulator"
        subtitle="Controlled scenario changes use the same deterministic planning rules."
        actions={<Link className="button button-ghost" href="/missions/MSN-104"><ArrowLeft size={16} aria-hidden="true" />Back to mission</Link>}
      />
      <div className="page-content simulate-page">
        {!disrupted ? (
          <>
            <Panel title="Choose a scenario">
              <div className="disruption-grid">
                <button className="disruption-card disruption-primary" type="button" disabled={!missionReady} onClick={triggerDisruption}>
                  <span className="disruption-icon"><AlertTriangle aria-hidden="true" /></span>
                  <strong>Partner canceled</strong>
                  <p>Eastside Community Pantry cannot receive its {affectedQuantityLb} lb allocation because staff are unavailable.</p>
                  <span className="disruption-action">{missionReady ? "Run scenario" : unavailableReason} <ArrowRight size={15} aria-hidden="true" /></span>
                </button>
                {previewDisruptions.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button className="disruption-card" type="button" disabled key={item.label}>
                      <span className="disruption-icon neutral"><Icon aria-hidden="true" /></span>
                      <strong>{item.label}</strong>
                      <p>Visible as a preview; not enabled in the primary MVP flow.</p>
                      <span className="plain-status plain-status-blue">Preview</span>
                    </button>
                  );
                })}
              </div>
            </Panel>
            <div className="guardrail-note"><CheckCircle2 size={18} aria-hidden="true" /><div><strong>Human approval remains mandatory</strong><span>No disruption can silently change an approved mission or contact a partner.</span></div></div>
          </>
        ) : (
          <>
            <section className="disruption-alert" aria-labelledby="disruption-title">
              <AlertTriangle size={24} aria-hidden="true" />
              <div><strong id="disruption-title">Eastside Community Pantry canceled</strong><span>Receiving staff unavailable · {affectedQuantityLb} lb and one route stop affected</span></div>
              <span className="plain-status plain-status-red">Mission disrupted</span>
            </section>

            {recovered ? <div className="inline-success"><CheckCircle2 size={18} aria-hidden="true" />Recovery is approved and MSN-105 has replaced the active route.<Link href="/missions/MSN-105">Open mission</Link></div> : null}

            <div className="recovery-summary-grid">
              <Panel title="What changed">
                <div className="change-list">
                  <div className="change-removed"><span>Removed</span><strong>Eastside Community Pantry</strong><b>−{affectedQuantityLb} lb</b></div>
                  <div className="change-added"><span>Added</span><strong>Northside Family Resource Center</strong><b>+{alternateQuantityLb} lb</b></div>
                  <div className="change-added"><span>Adjusted</span><strong>Community Kitchen staging</strong><b>+{mealKitIncreaseLb} lb</b></div>
                  {inspectionHoldIncreaseLb > 0 ? <div className="change-added"><span>Held</span><strong>Refrigerated inspection hold</strong><b>+{inspectionHoldIncreaseLb} lb</b></div> : null}
                </div>
              </Panel>
              <Panel title="Recovery checks">
                <div className="check-list">
                  <div><CheckCircle2 aria-hidden="true" /><span><strong>{accountedQuantityLb(recovery).toLocaleString()} lb accounted for</strong><small>Quantity conservation passes.</small></span></div>
                  <div>{validation.approvable ? <CheckCircle2 aria-hidden="true" /> : <AlertTriangle aria-hidden="true" />}<span><strong>{validation.approvable ? "No capacity violations" : "Capacity review required"}</strong><small>{validation.approvable ? `Storage ${validation.capacity.warehouseStorage.plannedQuantityLb}/${validation.capacity.warehouseStorage.limitQuantityLb} lb · staging ${validation.capacity.warehouseStaging.plannedQuantityLb}/${validation.capacity.warehouseStaging.limitQuantityLb} lb · vehicle ${validation.capacity.vehiclePayload.plannedQuantityLb}/${validation.capacity.vehiclePayload.limitQuantityLb} lb.` : validation.errors[0]}</small></span></div>
                  <div><Clock3 aria-hidden="true" /><span><strong>11-second modeled replan</strong><small>Scenario metric; calculation runs immediately.</small></span></div>
                </div>
              </Panel>
            </div>

            <div className="route-change-grid">
              <Panel title="Before · MSN-104"><NetworkMap variant="initial" showList={false} /></Panel>
              <Panel title="After · MSN-105"><NetworkMap variant="recovery" showList={false} /></Panel>
            </div>

            <Panel title="Recovered allocation">
              <div className="table-scroll">
                <table className="data-table recovery-table">
                  <thead><tr><th>Destination</th><th>Quantity</th><th>Arrival</th><th>Score</th><th>Constraint result</th></tr></thead>
                  <tbody>{recovery.allocations.map((allocation) => { const allocationFits = !validation.issues.some((issue) => issue.entityId === allocation.destinationId); return <tr key={allocation.id}><td><strong>{getDestinationName(allocation.destinationId)}</strong></td><td>{allocation.quantityLb.toLocaleString()} lb</td><td>{allocation.plannedArrivalAt.slice(11, 16)}</td><td>{allocation.score.total} / 100</td><td>{allocationFits ? <span className="fit-cell"><CheckCircle2 size={14} aria-hidden="true" />Fits</span> : <span className="conflict-cell"><AlertTriangle size={14} aria-hidden="true" />Review</span>}</td></tr>; })}</tbody>
                  <tfoot><tr><th>Total with inspection hold</th><th>1,200 lb</th><td colSpan={3}>{validation.approvable ? "Valid recovery option" : validation.errors[0]}</td></tr></tfoot>
                </table>
              </div>
            </Panel>

            <div className="sticky-action-rail">
              <div>{validation.approvable ? <CheckCircle2 size={20} aria-hidden="true" /> : <AlertTriangle size={20} aria-hidden="true" />}<span><strong>{validation.approvable ? `${recovery.name} ready` : "Recovery option needs revision"}</strong><small>{validation.approvable ? "Original MSN-104 remains in the audit history." : validation.errors[0]}</small></span></div>
              <div className="rail-actions">
                <Link className="button button-secondary" href="/missions/MSN-104">Keep reviewing</Link>
                {recovered ? <Link className="button button-primary" href="/missions/MSN-105">Open recovery mission<ArrowRight size={16} aria-hidden="true" /></Link> : <button className="button button-primary" type="button" disabled={!validation.approvable} onClick={approve}>Approve recovery<ArrowRight size={16} aria-hidden="true" /></button>}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
