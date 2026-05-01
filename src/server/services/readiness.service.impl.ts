import type { ReadinessResponse } from "@/types/api/readiness";
import type { BriefStepKey, BriefVersion } from "@/types/domain/brief";

function hasText(value?: string | null, minLength = 1) {
  return typeof value === "string" && value.trim().length >= minLength;
}

function hasItems(value?: string[] | null) {
  return Array.isArray(value) && value.length > 0;
}

function sectionScore(checks: boolean[]) {
  const passed = checks.filter(Boolean).length;
  return Math.round((passed / checks.length) * 100);
}

export class DefaultReadinessService {
  computeSectionScores(version: BriefVersion): Record<BriefStepKey, number> {
    return {
      "project-basics": sectionScore([
        hasText(version.productService),
        hasText(version.industryCategory),
        hasText(version.geographyMarket),
      ]),
      "business-objective": sectionScore([
        hasText(version.primaryGoal, 10),
        hasText(version.whyNow, 10),
        hasText(version.desiredOutcome),
        hasText(version.timeline),
        hasText(version.budgetRange),
      ]),
      "market-context": sectionScore([
        hasText(version.marketDescription, 10),
        hasItems(version.trends),
        hasItems(version.competitors),
        hasText(version.currentPosition),
        hasItems(version.currentChallenges),
        hasItems(version.opportunities),
      ]),
      "audience-hypothesis": sectionScore([
        hasText(version.likelyTarget),
        hasText(version.customerKnowledge),
        hasItems(version.painPoints),
        hasItems(version.buyingTriggers),
        hasItems(version.channelIdeas),
      ]),
      "constraints-assumptions": sectionScore([
        hasItems(version.budgetConstraints) ||
          hasItems(version.teamConstraints) ||
          hasItems(version.operationalConstraints) ||
          hasItems(version.regulatoryConstraints),
        version.assumptions.length > 0,
        version.assumptions.every((assumption) => hasText(assumption.text)),
      ]),
      "success-metrics": sectionScore([
        hasText(version.primaryKpi),
        hasItems(version.supportingKpis),
        hasText(version.minimumSuccessThreshold),
        hasItems(version.riskIndicators),
        hasItems(version.failureConditions),
      ]),
    };
  }

  computeReadiness(version: BriefVersion): ReadinessResponse {
    const sectionScores = this.computeSectionScores(version);
    const score = Math.round(
      sectionScores["project-basics"] * 0.15 +
        sectionScores["business-objective"] * 0.2 +
        sectionScores["market-context"] * 0.18 +
        sectionScores["audience-hypothesis"] * 0.17 +
        sectionScores["constraints-assumptions"] * 0.15 +
        sectionScores["success-metrics"] * 0.15,
    );

    const missingFields: string[] = [];
    const warnings: string[] = [];

    if (!hasText(version.productService)) missingFields.push("productService");
    if (!hasText(version.industryCategory)) missingFields.push("industryCategory");
    if (!hasText(version.geographyMarket)) missingFields.push("geographyMarket");
    if (!hasText(version.primaryGoal, 10)) missingFields.push("primaryGoal");
    if (!hasText(version.marketDescription, 10)) {
      missingFields.push("marketDescription");
    }
    if (!hasText(version.likelyTarget)) missingFields.push("likelyTarget");
    if (!hasText(version.primaryKpi)) missingFields.push("primaryKpi");
    if (!hasText(version.minimumSuccessThreshold)) {
      missingFields.push("minimumSuccessThreshold");
    }
    if (!version.assumptions.length) missingFields.push("assumptions");

    if (hasText(version.primaryGoal) && version.primaryGoal!.length < 30) {
      warnings.push("Primary goal may be too broad; add target, market, or outcome detail.");
    }
    if (!hasItems(version.competitors)) {
      warnings.push("No competitors are listed, which weakens market context.");
    }
    if (!hasItems(version.painPoints)) {
      warnings.push("No audience pain points are listed.");
    }
    if (
      !hasItems(version.budgetConstraints) &&
      !hasItems(version.teamConstraints) &&
      !hasItems(version.operationalConstraints) &&
      !hasItems(version.regulatoryConstraints)
    ) {
      warnings.push("No constraints are listed; strategy choices may be unrealistic.");
    }

    return {
      status:
        score >= 80 && missingFields.length === 0
          ? "complete"
          : score >= 50
            ? "needs_refinement"
            : "incomplete",
      score,
      missingFields,
      warnings,
      sectionScores,
    };
  }
}

export const readinessService = new DefaultReadinessService();
