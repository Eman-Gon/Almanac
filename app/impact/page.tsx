"use client";

import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Gauge,
  Route,
  Scale,
  UsersRound,
} from "lucide-react";
import { useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Panel } from "@/components/shared/panel";
import { baselineAuditEvents, donation, scenario } from "@/data/seed/scenario";
import { createApprovalAuditEvent, createMission } from "@/domain/execution/create-execution";
import { spoilageAvoidancePct, totalRouteMiles } from "@/domain/metrics/calculate";
import { generatePlanSet, getDestinationName } from "@/domain/planning/generate-plans";
import { createRecoveryAuditEvents, createRecoveryOption } from "@/domain/recovery/create-recovery";
import { useDemoState } from "@/state/demo-state";

const stageRank = { initial: 0, plans_generated: 1, approved: 2, disrupted: 3, recovered: 4 } as const;

export default function ImpactPage() {
  const { state } = useDemoState();
  const original = useMemo(() => generatePlanSet().options[2], []);
  const recovered = state.stage === "recovered";
  const plan = recovered ? createRecoveryOption(original) : original;
  const mission = createMission(plan, recovered ? "MSN-105" : "MSN-104");
  const spoilagePct = spoilageAvoidancePct(scenario.baselineExpectedSpoilageLb, plan.metrics.expectedSpoilageLb) ?? 0;
  const events = [
    ...baselineAuditEvents,
    ...(stageRank[state.stage] >= 2 ? [createApprovalAuditEvent(state.approvalReason)] : []),
    ...(recovered ? createRecoveryAuditEvents() : []),
  ];

  const metrics = [
    { label: "Pounds offered", value: "1,200 lb", detail: "Simulated input", icon: Scale, tone: "blue" },
    { label: "Assigned in time", value: `${plan.metrics.quantityDistributedInTimeLb.toLocaleString()} lb`, detail: "Calculated from scenario", icon: CheckCircle2, tone: "green" },
    { label: "Households supported", value: String(plan.metrics.estimatedHouseholdsSupported), detail: "Simulated estimate · 3 lb each", icon: UsersRound, tone: "purple" },
    { label: "Modeled spoilage avoided", value: `${spoilagePct}%`, detail: "Calculated estimate", icon: Gauge, tone: "green" },
    { label: "Route miles", value: `${totalRouteMiles(mission.routeLegs).toFixed(1)} mi`, detail: "Seeded distance matrix", icon: Route, tone: "blue" },
    { label: "Replanning time", value: recovered ? "11 sec" : "—", detail: recovered ? "Simulated scenario interval" : "No recovery approved", icon: Clock3, tone: "amber" },
  ] as const;

  return (
    <>
      <PageHeader title="Impact & Audit" subtitle={`${recovered ? "MSN-105" : "MSN-104"} · Calculated outcomes and decision history`} actions={<Link className="button button-ghost" href={recovered ? "/missions/MSN-105" : "/missions/MSN-104"}><ArrowLeft size={16} aria-hidden="true" />Back to mission</Link>} />
      <div className="page-content impact-page">
        <div className="evidence-banner"><CheckCircle2 size={18} aria-hidden="true" /><div><strong>All values use synthetic scenario data</strong><span>Operational metrics are calculated by deterministic services; no LLM supplies quantities, routes, or impact.</span></div></div>

        <section className="impact-metric-grid" aria-label="Scenario impact metrics">
          {metrics.map((metric) => { const Icon = metric.icon; return <article className={`impact-card impact-${metric.tone}`} key={metric.label}><Icon aria-hidden="true" /><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.detail}</small></article>; })}
        </section>

        {recovered ? <Panel title="Before & after recovery"><div className="before-after-grid"><div><span>Original mission · MSN-104</span><strong>Eastside Pantry · 320 lb</strong><small>24.8 mi · Route disrupted</small></div><div className="change-arrow">→</div><div><span>Replacement mission · MSN-105</span><strong>Northside 260 lb · Kitchen +60 lb</strong><small>28.6 mi · All hard constraints pass</small></div></div></Panel> : null}

        <div className="impact-grid">
          <Panel title="Allocation by destination">
            <div className="allocation-bars">
              {plan.allocations.map((allocation) => <div key={allocation.id}><span>{getDestinationName(allocation.destinationId)}</span><div><i style={{ width: `${(allocation.quantityLb / donation.quantityLb) * 100}%` }} /></div><strong>{allocation.quantityLb} lb</strong></div>)}
              <div><span>Supervisor inspection hold</span><div><i className="hold-bar" style={{ width: `${(plan.inspectionHoldLb / donation.quantityLb) * 100}%` }} /></div><strong>{plan.inspectionHoldLb} lb</strong></div>
            </div>
          </Panel>
          <Panel title="Metric assumptions">
            <div className="assumption-list impact-assumptions">
              <p><strong>Household estimate</strong>1,140 distributed lb ÷ 3 lb per household</p>
              <p><strong>Spoilage model</strong>(1,000 baseline lb − 60 expected lb) ÷ 1,000</p>
              <p><strong>Route miles</strong>Sum of precomputed route-leg distances</p>
              <p><strong>Human overrides</strong>0 · Approval is not counted as an override</p>
            </div>
          </Panel>
        </div>

        <Panel title="Audit history">
          <div className="table-scroll"><table className="data-table audit-table"><thead><tr><th>Time</th><th>Event</th><th>Actor</th><th>Entity</th><th>Reason or result</th></tr></thead><tbody>{events.map((event) => <tr key={event.id}><td>{event.occurredAt.slice(11, 19)}</td><td><strong>{event.eventType.replaceAll("_", " ")}</strong></td><td>{event.actorType} · {event.actorId}</td><td>{event.entityId}</td><td>{event.reason ?? "Baseline scenario event"}</td></tr>)}</tbody></table></div>
        </Panel>
      </div>
    </>
  );
}
