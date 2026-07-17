import type { ReactNode } from "react";

/**
 * Where a displayed value came from.
 *
 * The first three labels are mandated verbatim by docs/SCREEN_SPECIFICATIONS.md:433-437
 * ("Every result must show one of: Calculated from scenario / Simulated estimate /
 * Seeded assumption"). Which one a metric gets is fixed by
 * docs/API_AND_STATE_CONTRACTS.md:95, not by preference:
 *
 *   calculated — recalculated from the current allocation quantities. Responds to a
 *                staff edit. Planned outbound pounds, household-equivalents, long-term
 *                storage use, staging use.
 *   simulated  — a model over scenario inputs, not an observation. Expected spoilage.
 *   seeded     — a strategy-level scenario constant. Does NOT move when quantities are
 *                edited: route miles, staff minutes, need-match, equity, refusal risk.
 *   model      — RESERVED. An optional LLM explanation, permitted by
 *                docs/AI_AGENT_CONTRACTS.md:152 only "based on score components", and
 *                never authoritative. Nothing renders this today: the hero flow contains
 *                no model output. The channel exists so that if one is ever added it
 *                cannot arrive wearing the same clothes as a computed fact.
 */
export type Derivation = "calculated" | "simulated" | "seeded" | "model";

const labels: Record<Derivation, string> = {
  calculated: "Calculated from scenario",
  simulated: "Simulated estimate",
  seeded: "Seeded assumption",
  model: "Model explanation · advisory",
};

/**
 * The rule texture — solid / dashed / dotted — is the primary signal, not the hue.
 * DESIGN_SYSTEM.md:45 forbids relying on colour alone, and an operator must be able to
 * tell a computed fact from an estimate peripherally, without reading (constraint #1).
 */
export function Provenance({
  derivation,
  children,
  className = "",
}: {
  derivation: Derivation;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`prov prov-${derivation} ${className}`.trim()}>
      {children}
      <span className="prov-label">{labels[derivation]}</span>
    </div>
  );
}

/** The label alone, for table cells and other places a bordered block does not fit. */
export function ProvenanceTag({ derivation }: { derivation: Derivation }) {
  return <span className={`prov-tag prov-tag-${derivation}`}>{labels[derivation]}</span>;
}
