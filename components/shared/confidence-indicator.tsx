import { AlertCircle, CheckCircle2, CircleHelp } from "lucide-react";
import type { Confidence } from "@/domain/types";

const labels: Record<Confidence, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
  unknown: "Unknown",
};

export function ConfidenceIndicator({ confidence }: { confidence: Confidence }) {
  const Icon =
    confidence === "high"
      ? CheckCircle2
      : confidence === "unknown"
        ? CircleHelp
        : AlertCircle;
  return (
    <span className={`confidence confidence-${confidence}`} role="status" aria-label={`${labels[confidence]} confidence`}>
      <Icon size={14} strokeWidth={2} aria-hidden="true" />
      {labels[confidence]}
    </span>
  );
}
