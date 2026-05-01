import type { ReadinessResponse } from "@/types/api/readiness";
import type { BriefStepKey, BriefVersion } from "@/types/domain/brief";

export interface ReadinessService {
  computeReadiness(version: BriefVersion): ReadinessResponse;
  computeSectionScores(version: BriefVersion): Record<BriefStepKey, number>;
}
