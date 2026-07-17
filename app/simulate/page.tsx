"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, Snowflake, Truck, UserX } from "lucide-react";
import { useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { DetailsAccordion } from "@/components/shared/details-accordion";
import { LoadingState } from "@/components/shared/loading-state";
import { Panel } from "@/components/shared/panel";
import { StickyActionBar } from "@/components/shared/sticky-action-bar";
import { scenario } from "@/data/seed/scenario";
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
  const searchParams = useSearchParams();
  const { state, hydrated, triggerDisruption, approveRecovery } = useDemoState();
  const planSet = useMemo(() => generatePlanSet(), []);
  const selectedCandidate = state.approvedPlan ?? state.planOverrides[state.selectedPlanId] ?? planSet.options.find((option) => option.id === state.selectedPlanId) ?? planSet.options[2];
  const original = selectedCandidate.allocations.some((allocation) => allocation.destinationId === "PAR-002") && selectedCandidate.allocations.some((allocation) => allocation.destinationId === "PAR-003") ? selectedCandidate : planSet.options[2];
  const recovery = state.disruption?.recoveryOption ?? createRecoveryOption(original);
  const disrupted = state.stage === "disrupted" || state.stage === "recovered";
  const recovered = state.stage === "recovered";
  const originalMission = state.missions["MSN-104"];
  const affectedStop = originalMission?.stops.find((stop) => stop.locationId === "PAR-002");
  const missionReady = Boolean(state.stage === "approved" && state.approvedPlan && originalMission && (originalMission.status === "assigned" || originalMission.status === "in_transit") && affectedStop?.status === "pending" && affectedStop.quantityDropoffLb > 0);
  const unavailableReason = !state.approvedPlan ? "Approve a mission first" : originalMission?.status === "delivered" ? "Mission already delivered" : "Cancellation is not available";
  const validation = validatePlanOption(recovery, scenarioValidationContext);
  const affectedQuantityLb = state.disruption?.affectedQuantityLb ?? original.allocations.filter((allocation) => allocation.destinationId === "PAR-002").reduce((total, allocation) => total + allocation.quantityLb, 0);
  const alternateQuantityLb = recovery.allocations.find((allocation) => allocation.destinationId === "PAR-004")?.quantityLb ?? 0;
  const originalMealKitLb = original.allocations.find((allocation) => allocation.destinationId === "PAR-003")?.quantityLb ?? 0;
  const recoveredMealKitLb = recovery.allocations.find((allocation) => allocation.destinationId === "PAR-003")?.quantityLb ?? 0;
  const mealKitIncreaseLb = recoveredMealKitLb - originalMealKitLb;
  const inspectionHoldIncreaseLb = recovery.inspectionHoldLb - original.inspectionHoldLb;
  const returnTo = searchParams.get("mission") === "MSN-104" ? "/missions/MSN-104" : "/missions/MSN-104";

  function approve() {
    if (!validation.approvable) return;
    approveRecovery();
    router.push("/missions/MSN-105");
  }

  if (!hydrated) return <LoadingState label="Loading disruption scenario…" />;

  return (
    <>
      <PageHeader title="Disruption recovery" subtitle="Review what changed, compare the replacement route, and approve the next action." breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Mission", href: returnTo }, { label: "Disruption recovery" }]} backHref={returnTo} backLabel="Back to Mission" status={<span className={`plain-status ${recovered ? "plain-status-green" : disrupted ? "plain-status-amber" : "plain-status-blue"}`}>{recovered ? "Recovery approved" : disrupted ? "Mission disrupted" : "Scenario ready"}</span>} />
      <div className="page-content simulate-page refactor-simulate-page">
        {!disrupted ? <>
          <Panel title="Report a disruption"><div className="disruption-primary-card"><div className="disruption-icon"><AlertTriangle size={22} aria-hidden="true" /></div><div><span className="section-eyebrow">Active demo scenario</span><h2>Partner canceled</h2><p>Eastside Community Pantry cannot receive its {affectedQuantityLb} lb allocation because receiving staff are unavailable.</p><span className="disruption-action-note">Almanac will draft a replacement plan; a human still approves it.</span></div><button className="button button-primary" type="button" disabled={!missionReady} onClick={triggerDisruption}>{missionReady ? "Run disruption scenario" : unavailableReason}<ArrowRight size={16} aria-hidden="true" /></button></div></Panel>
          <DetailsAccordion title="Other scenario previews"><div className="disruption-grid compact-disruption-grid">{previewDisruptions.map((item) => { const Icon = item.icon; return <button className="disruption-card" type="button" disabled key={item.label}><span className="disruption-icon neutral"><Icon aria-hidden="true" /></span><strong>{item.label}</strong><p>Preview only in the primary MVP flow.</p><span className="plain-status plain-status-blue">Preview</span></button>; })}</div></DetailsAccordion>
          <div className="guardrail-note"><CheckCircle2 size={18} aria-hidden="true" /><div><strong>Human approval remains mandatory</strong><span>No disruption can silently change an approved mission or contact a partner.</span></div></div>
        </> : <>
          <section className="disruption-alert" aria-labelledby="disruption-title"><AlertTriangle size={24} aria-hidden="true" /><div><strong id="disruption-title">Eastside Community Pantry canceled</strong><span>{affectedQuantityLb} lb affected · one receiving stop removed</span></div><span className="plain-status plain-status-red">Mission disrupted</span></section>
          {recovered ? <div className="inline-success"><CheckCircle2 size={18} aria-hidden="true" />Recovery is approved and the replacement route is active.<Link href="/missions/MSN-105">View mission</Link></div> : null}
          <section className="before-after-recovery" aria-label="Before and after recovery"><div><span>Before</span><strong>Eastside Community Pantry</strong><p>{affectedQuantityLb} lb · original route</p></div><div className="recovery-arrow" aria-hidden="true">→</div><div><span>After</span><strong>Northside Family Resource Center</strong><p>{alternateQuantityLb} lb redirected · {mealKitIncreaseLb > 0 ? `${mealKitIncreaseLb} lb added to Community Kitchen` : "capacity preserved"}</p></div></section>
          <div className="recovery-summary-grid"><Panel title="What changed"><div className="change-list"><div className="change-removed"><span>Removed</span><strong>Eastside Community Pantry</strong><b>−{affectedQuantityLb} lb</b></div><div className="change-added"><span>Added</span><strong>Northside Family Resource Center</strong><b>+{alternateQuantityLb} lb</b></div><div className="change-added"><span>Adjusted</span><strong>Community Kitchen staging</strong><b>+{mealKitIncreaseLb} lb</b></div>{inspectionHoldIncreaseLb > 0 ? <div className="change-added"><span>Held</span><strong>Refrigerated inspection hold</strong><b>+{inspectionHoldIncreaseLb} lb</b></div> : null}</div></Panel><Panel title="Recovery checks"><div className="check-list"><div><CheckCircle2 aria-hidden="true" /><span><strong>{accountedQuantityLb(recovery).toLocaleString()} lb planned allocation accounted for</strong><small>Quantity conservation passes.</small></span></div><div>{validation.approvable ? <CheckCircle2 aria-hidden="true" /> : <AlertTriangle aria-hidden="true" />}<span><strong>{validation.approvable ? "No capacity violations" : "Capacity review required"}</strong><small>{validation.approvable ? `Storage ${validation.capacity.warehouseStorage.plannedQuantityLb}/${validation.capacity.warehouseStorage.limitQuantityLb} lb · vehicle ${validation.capacity.vehiclePayload.plannedQuantityLb}/${validation.capacity.vehiclePayload.limitQuantityLb} lb.` : validation.errors[0]}</small></span></div><div><Clock3 aria-hidden="true" /><span><strong>{scenario.modeledReplanningSeconds}-second modeled replan</strong><small>Scenario interval; not measured compute time.</small></span></div></div></Panel></div>
          <DetailsAccordion title="View recovery allocation details"><div className="table-scroll"><table className="data-table recovery-table"><caption className="sr-only">Recovery allocation details</caption><thead><tr><th>Destination</th><th>Quantity</th><th>Arrival</th><th>Community need match</th><th>Capacity result</th></tr></thead><tbody>{recovery.allocations.map((allocation) => { const allocationFits = !validation.issues.some((issue) => issue.entityId === allocation.destinationId); return <tr key={allocation.id}><td><strong>{getDestinationName(allocation.destinationId)}</strong></td><td>{allocation.quantityLb.toLocaleString()} lb</td><td>{allocation.plannedArrivalAt.slice(11, 16)}</td><td>{allocation.score.total} / 100</td><td>{allocationFits ? <span className="fit-cell"><CheckCircle2 size={14} aria-hidden="true" />Within capacity</span> : <span className="conflict-cell"><AlertTriangle size={14} aria-hidden="true" />Review</span>}</td></tr>; })}</tbody><tfoot><tr><th>Total with inspection hold</th><th>1,200 lb</th><td colSpan={3}>{validation.approvable ? "Valid recovery option" : validation.errors[0]}</td></tr></tfoot></table></div><DetailsAccordion title="Technical details"><p>Recovery plan {recovery.id} · partner cancellation is recorded in the audit trail.</p></DetailsAccordion></DetailsAccordion>
          <StickyActionBar status={<><span className="sticky-status-icon">{validation.approvable ? <CheckCircle2 size={20} aria-hidden="true" /> : <AlertTriangle size={20} aria-hidden="true" />}</span><span><strong>{validation.approvable ? "Recovery plan ready for approval" : "Recovery plan needs review"}</strong><small>{validation.approvable ? "The replacement keeps quantities within the seeded constraints." : validation.errors[0]}</small></span></>}><Link className="button button-secondary" href={returnTo}>Back to Mission</Link>{recovered ? <Link className="button button-primary" href="/missions/MSN-105">Open recovery mission<ArrowRight size={16} aria-hidden="true" /></Link> : <button className="button button-primary" type="button" disabled={!validation.approvable} onClick={approve}>Approve recovery plan<ArrowRight size={16} aria-hidden="true" /></button>}</StickyActionBar>
        </>}
      </div>
    </>
  );
}
