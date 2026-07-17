import type {
  AgencyAcceptanceHistory,
  DestinationScore,
  PartnerAgency,
  ProductCategory,
} from "@/domain/types";

export const SCORE_CONFIG_VERSION = "score-v1";

export const scoreWeights = {
  documentedNeed: 0.25,
  usabilityMatch: 0.15,
  receivingWindowFit: 0.15,
  availableCapacity: 0.15,
  recentServiceGap: 0.1,
  equityPriority: 0.05,
  historicalAcceptance: 0.15,
} as const;

export const MIN_HISTORY_SAMPLE_SIZE = 5;

export type AcceptanceHistoryConfidence =
  | "high"
  | "medium"
  | "low"
  | "unknown";

export type AcceptanceHistorySignal = {
  history: AgencyAcceptanceHistory | null;
  score: number;
  confidence: AcceptanceHistoryConfidence;
};

export function acceptanceHistorySignal(
  partner: PartnerAgency,
  category: ProductCategory,
): AcceptanceHistorySignal {
  const history =
    partner.acceptanceHistory.find((candidate) => candidate.category === category) ??
    null;
  if (!history) return { history: null, score: 0, confidence: "unknown" };
  if (history.sampleSize < MIN_HISTORY_SAMPLE_SIZE) {
    return { history, score: 0, confidence: "low" };
  }
  return {
    history,
    score: history.acceptanceRatePct,
    confidence: history.sampleSize >= 15 ? "high" : "medium",
  };
}

export type DestinationScoreInput = Omit<DestinationScore, "total">;

export function calculateDestinationScore(
  input: DestinationScoreInput,
): DestinationScore {
  const positive =
    input.documentedNeed * scoreWeights.documentedNeed +
    input.usabilityMatch * scoreWeights.usabilityMatch +
    input.receivingWindowFit * scoreWeights.receivingWindowFit +
    input.availableCapacity * scoreWeights.availableCapacity +
    input.recentServiceGap * scoreWeights.recentServiceGap +
    input.equityPriority * scoreWeights.equityPriority +
    input.historicalAcceptance * scoreWeights.historicalAcceptance;

  const penalties =
    input.travelPenalty + input.spoilagePenalty + input.refusalRiskPenalty;

  return {
    ...input,
    total: Math.round(Math.min(100, Math.max(0, positive - penalties))),
  };
}
