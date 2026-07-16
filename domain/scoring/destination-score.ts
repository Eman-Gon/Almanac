import type { DestinationScore } from "@/domain/types";

export const SCORE_CONFIG_VERSION = "score-v1";

export const scoreWeights = {
  documentedNeed: 0.3,
  usabilityMatch: 0.2,
  receivingWindowFit: 0.15,
  availableCapacity: 0.15,
  recentServiceGap: 0.1,
  equityPriority: 0.1,
} as const;

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
    input.equityPriority * scoreWeights.equityPriority;

  const penalties =
    input.travelPenalty + input.spoilagePenalty + input.refusalRiskPenalty;

  return {
    ...input,
    total: Math.round(Math.min(100, Math.max(0, positive - penalties))),
  };
}
