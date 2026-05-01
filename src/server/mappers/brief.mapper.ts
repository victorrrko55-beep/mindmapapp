import type {
  Assumption as PrismaAssumption,
  BriefVersion as PrismaBriefVersion,
  Project as PrismaProject,
} from "@prisma/client";

import type { StructuredBrief } from "@/types/domain/brief";
import type { BriefVersion } from "@/types/domain/brief";
import type { Assumption, Project } from "@/types/domain/project";

type PrismaBriefWithAssumptions = PrismaBriefVersion & {
  assumptions: PrismaAssumption[];
};

function toIso(value: Date | string | null | undefined) {
  if (!value) return undefined;
  return value instanceof Date ? value.toISOString() : value;
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export function mapProject(project: PrismaProject): Project {
  return {
    id: project.id,
    ownerId: project.ownerId,
    name: project.name,
    companyName: project.companyName,
    projectType: project.projectType,
    description: project.description,
    status: project.status,
    currentVersionId: project.currentVersionId,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}

export function mapAssumption(assumption: PrismaAssumption): Assumption {
  return {
    id: assumption.id,
    briefVersionId: assumption.briefVersionId,
    text: assumption.text,
    confidence: assumption.confidence,
    createdAt: assumption.createdAt.toISOString(),
    updatedAt: assumption.updatedAt.toISOString(),
  };
}

export function mapBriefVersion(version: PrismaBriefWithAssumptions): BriefVersion {
  return {
    id: version.id,
    projectId: version.projectId,
    versionNumber: version.versionNumber,
    status: version.status,
    productService: version.productService,
    industryCategory: version.industryCategory,
    geographyMarket: version.geographyMarket,
    primaryGoal: version.primaryGoal,
    whyNow: version.whyNow,
    desiredOutcome: version.desiredOutcome,
    timeline: version.timeline,
    budgetRange: version.budgetRange,
    decisionDeadline: toIso(version.decisionDeadline),
    marketDescription: version.marketDescription,
    trends: stringArray(version.trends),
    competitors: stringArray(version.competitors),
    currentPosition: version.currentPosition,
    currentChallenges: stringArray(version.currentChallenges),
    opportunities: stringArray(version.opportunities),
    likelyTarget: version.likelyTarget,
    customerKnowledge: version.customerKnowledge,
    painPoints: stringArray(version.painPoints),
    buyingTriggers: stringArray(version.buyingTriggers),
    channelIdeas: stringArray(version.channelIdeas),
    budgetConstraints: stringArray(version.budgetConstraints),
    teamConstraints: stringArray(version.teamConstraints),
    operationalConstraints: stringArray(version.operationalConstraints),
    regulatoryConstraints: stringArray(version.regulatoryConstraints),
    primaryKpi: version.primaryKpi,
    supportingKpis: stringArray(version.supportingKpis),
    minimumSuccessThreshold: version.minimumSuccessThreshold,
    riskIndicators: stringArray(version.riskIndicators),
    failureConditions: stringArray(version.failureConditions),
    readinessScore: version.readinessScore,
    qualityStatus: version.qualityStatus,
    structuredBrief: version.structuredBrief,
    summaryMarkdown: version.summaryMarkdown,
    assumptions: version.assumptions.map(mapAssumption),
    createdAt: version.createdAt.toISOString(),
    updatedAt: version.updatedAt.toISOString(),
  };
}

export function buildStructuredBrief(
  project: Project,
  version: BriefVersion,
): StructuredBrief {
  return {
    overview: {
      projectName: project.name,
      companyName: project.companyName,
      projectType: project.projectType,
    },
    basics: {
      productService: version.productService,
      industryCategory: version.industryCategory,
      geographyMarket: version.geographyMarket,
    },
    objective: {
      primaryGoal: version.primaryGoal,
      whyNow: version.whyNow,
      desiredOutcome: version.desiredOutcome,
      timeline: version.timeline,
      budgetRange: version.budgetRange,
      decisionDeadline: version.decisionDeadline,
    },
    marketContext: {
      marketDescription: version.marketDescription,
      trends: version.trends ?? [],
      competitors: version.competitors ?? [],
      currentPosition: version.currentPosition,
      currentChallenges: version.currentChallenges ?? [],
      opportunities: version.opportunities ?? [],
    },
    audienceHypothesis: {
      likelyTarget: version.likelyTarget,
      customerKnowledge: version.customerKnowledge,
      painPoints: version.painPoints ?? [],
      buyingTriggers: version.buyingTriggers ?? [],
      channelIdeas: version.channelIdeas ?? [],
    },
    constraints: {
      budgetConstraints: version.budgetConstraints ?? [],
      teamConstraints: version.teamConstraints ?? [],
      operationalConstraints: version.operationalConstraints ?? [],
      regulatoryConstraints: version.regulatoryConstraints ?? [],
    },
    assumptions: version.assumptions.map((assumption) => ({
      text: assumption.text,
      confidence: assumption.confidence,
    })),
    successMetrics: {
      primaryKpi: version.primaryKpi,
      supportingKpis: version.supportingKpis ?? [],
      minimumSuccessThreshold: version.minimumSuccessThreshold,
      riskIndicators: version.riskIndicators ?? [],
      failureConditions: version.failureConditions ?? [],
    },
  };
}

export function buildSummaryMarkdown(project: Project, version: BriefVersion) {
  const lines = [
    `# ${project.name}`,
    "",
    `Company: ${project.companyName}`,
    `Project type: ${project.projectType}`,
    "",
    "## Strategic Objective",
    version.primaryGoal ?? "Not provided",
    "",
    "## Market Context",
    version.marketDescription ?? "Not provided",
    "",
    "## Audience Hypothesis",
    version.likelyTarget ?? "Not provided",
    "",
    "## Key Assumptions",
    ...(version.assumptions.length
      ? version.assumptions.map(
          (assumption) => `- ${assumption.text} (${assumption.confidence})`,
        )
      : ["- Not provided"]),
    "",
    "## Success Metrics",
    `Primary KPI: ${version.primaryKpi ?? "Not provided"}`,
    `Minimum threshold: ${version.minimumSuccessThreshold ?? "Not provided"}`,
  ];

  return lines.join("\n");
}
