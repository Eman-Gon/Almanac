import { AlertTriangle, CheckCircle2, Clock3, MapPin, UsersRound } from "lucide-react";
import { donation } from "@/data/seed/scenario";
import { reconcilePlanQuantities, validatePlanOption } from "@/domain/planning/quantity";
import { scenarioValidationContext } from "@/domain/planning/scenario-context";
import type { PlanOption } from "@/domain/types";

const descriptions: Record<PlanOption["strategy"], string> = {
  warehouse_first: "Receive at the warehouse before outbound distribution.",
  direct_distribution: "Deliver directly to three partner agencies.",
  mixed: "Balance direct delivery, staging, and an inspection hold.",
  custom: "Custom staff-edited allocation strategy.",
};

function capacityLabel(plan: PlanOption): string {
  if (plan.metrics.coldCapacityUtilizationPct > 100) return "Over capacity";
  if (plan.metrics.coldCapacityUtilizationPct >= 80) return "Near capacity";
  return "Within capacity";
}

export function PlanCard({
  plan,
  selected,
  disabled = false,
  onSelect,
  onViewDetails,
}: {
  plan: PlanOption;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
  onViewDetails?: () => void;
}) {
  const validation = validatePlanOption(plan, scenarioValidationContext);
  const reconciliation = reconcilePlanQuantities(plan, donation.quantityLb);
  const recommended = plan.strategy === "mixed";
  const hasWarnings = plan.risks.some((risk) => !risk.blocking);
  const statusLabel = recommended
    ? "Recommended"
    : !validation.approvable
      ? "Infeasible"
      : hasWarnings
        ? "Feasible with warnings"
        : "Feasible";
  const StatusIcon = recommended || validation.approvable ? CheckCircle2 : AlertTriangle;

  return (
    <article className={`plan-card refactor-plan-card ${selected ? "plan-card-selected" : ""}`}>
      <div className="plan-card-heading">
        <div><h2>{plan.name}</h2><span className="need-match-badge"><UsersRound size={13} aria-hidden="true" />Community need match {plan.metrics.needMatchScore}/100</span></div>
        <span className={`plan-status ${recommended ? "recommended" : validation.approvable ? "feasible" : "conflict"}`}><StatusIcon size={14} aria-hidden="true" />{statusLabel}</span>
      </div>
      <p className="plan-description">{descriptions[plan.strategy]}</p>
      <div className={`plan-risk ${validation.approvable ? "plan-risk-neutral" : "plan-risk-critical"}`}>
        {validation.approvable ? <CheckCircle2 size={15} aria-hidden="true" /> : <AlertTriangle size={15} aria-hidden="true" />}
        <span>{validation.displayMessage ?? "All hard constraints pass."}</span>
      </div>
      <dl className="plan-metric-list refactor-plan-metrics">
        <div><dt><Clock3 size={14} aria-hidden="true" />Delivered before risk deadline</dt><dd>{reconciliation.deliveredBeforeRiskLb.toLocaleString()} lb</dd></div>
        <div><dt><AlertTriangle size={14} aria-hidden="true" />Inspection hold or expected loss</dt><dd>{reconciliation.holdOrLossLb.toLocaleString()} lb</dd></div>
        <div><dt><MapPin size={14} aria-hidden="true" />Total miles</dt><dd>{plan.metrics.totalMiles.toFixed(1)} mi</dd></div>
        <div><dt><UsersRound size={14} aria-hidden="true" />Estimated staff time</dt><dd>{plan.metrics.staffMinutes} min</dd></div>
      </dl>
      <div className="plan-capacity-language"><span>Cold-capacity use</span><strong>{capacityLabel(plan)}</strong></div>
      <div className="plan-card-actions">
        <button className="button button-secondary plan-select-button" type="button" onClick={onSelect} disabled={disabled || selected} aria-pressed={selected}>
          Select plan
        </button>
        <button className="text-button" type="button" onClick={onViewDetails}>View plan details</button>
      </div>
    </article>
  );
}
