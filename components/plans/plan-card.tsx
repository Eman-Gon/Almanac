import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  HeartHandshake,
  MapPin,
  Snowflake,
  Sparkle,
  UsersRound,
} from "lucide-react";
import { validatePlanOption } from "@/domain/planning/quantity";
import type { PlanOption } from "@/domain/types";

const descriptions: Record<PlanOption["strategy"], string> = {
  warehouse_first: "Receive at the warehouse before outbound distribution.",
  direct_distribution: "Deliver directly to three partner agencies.",
  mixed: "Balance direct delivery, refrigerated staging, and inspection hold.",
  custom: "Custom staff-edited allocation strategy.",
};

const metricRows = [
  { key: "quantityDistributedInTimeLb", label: "In time", icon: Clock3, format: (value: number) => `${value.toLocaleString()} lb` },
  { key: "expectedSpoilageLb", label: "Hold / loss", icon: AlertTriangle, format: (value: number) => `${value.toLocaleString()} lb` },
  { key: "totalMiles", label: "Miles", icon: MapPin, format: (value: number) => `${value.toFixed(1)} mi` },
  { key: "staffMinutes", label: "Staff time", icon: UsersRound, format: (value: number) => `${value} min` },
  { key: "coldCapacityUtilizationPct", label: "Cold use", icon: Snowflake, format: (value: number) => `${value}%` },
  { key: "needMatchScore", label: "Need match", icon: HeartHandshake, format: (value: number) => `${value} / 100` },
] as const;

export function PlanCard({
  plan,
  selected,
  onSelect,
}: {
  plan: PlanOption;
  selected: boolean;
  onSelect: () => void;
}) {
  const validation = validatePlanOption(plan, 1_200);
  const recommended = plan.strategy === "mixed";

  return (
    <article className={`plan-card ${selected ? "plan-card-selected" : ""}`}>
      <div className="plan-card-heading">
        <h2>{plan.name}</h2>
        {recommended ? (
          <span className="plan-status recommended"><Sparkle size={14} aria-hidden="true" />Recommended</span>
        ) : validation.approvable ? (
          <span className="plan-status feasible"><CheckCircle2 size={14} aria-hidden="true" />Feasible</span>
        ) : (
          <span className="plan-status conflict"><AlertTriangle size={14} aria-hidden="true" />Capacity conflict</span>
        )}
      </div>
      <p className="plan-description">{descriptions[plan.strategy]}</p>
      <div className={`plan-risk ${validation.approvable ? "plan-risk-neutral" : "plan-risk-critical"}`}>
        {validation.approvable ? <CheckCircle2 size={15} aria-hidden="true" /> : <AlertTriangle size={15} aria-hidden="true" />}
        {plan.risks[0]?.message ?? "All hard constraints pass."}
      </div>
      <dl className="plan-metric-list">
        {metricRows.map((metric) => {
          const Icon = metric.icon;
          const value = plan.metrics[metric.key];
          return (
            <div key={metric.key}>
              <dt><Icon size={14} strokeWidth={1.8} aria-hidden="true" />{metric.label}</dt>
              <dd>{metric.format(value)}</dd>
            </div>
          );
        })}
      </dl>
      <button
        className={`button ${selected ? "button-primary" : "button-secondary"} plan-select-button`}
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
      >
        {selected ? `${plan.name} selected` : plan.strategy === "mixed" ? "Select Mixed Plan" : "Review plan"}
      </button>
    </article>
  );
}
