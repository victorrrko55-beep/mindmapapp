import type { Assumption } from "@/types/domain/project";

export type StringList = string[];

export type BriefStepKey =
  | "project-basics"
  | "business-objective"
  | "market-context"
  | "audience-hypothesis"
  | "constraints-assumptions"
  | "success-metrics";

export type BriefVersion = {
  id: string;
  projectId: string;
  versionNumber: number;
  status: "DRAFT" | "FINAL";

  productService?: string | null;
  industryCategory?: string | null;
  geographyMarket?: string | null;

  primaryGoal?: string | null;
  whyNow?: string | null;
  desiredOutcome?: string | null;
  timeline?: string | null;
  budgetRange?: string | null;
  decisionDeadline?: string | null;

  marketDescription?: string | null;
  trends?: StringList | null;
  competitors?: StringList | null;
  currentPosition?: string | null;
  currentChallenges?: StringList | null;
  opportunities?: StringList | null;

  likelyTarget?: string | null;
  customerKnowledge?: string | null;
  painPoints?: StringList | null;
  buyingTriggers?: StringList | null;
  channelIdeas?: StringList | null;

  budgetConstraints?: StringList | null;
  teamConstraints?: StringList | null;
  operationalConstraints?: StringList | null;
  regulatoryConstraints?: StringList | null;

  primaryKpi?: string | null;
  supportingKpis?: StringList | null;
  minimumSuccessThreshold?: string | null;
  riskIndicators?: StringList | null;
  failureConditions?: StringList | null;

  readinessScore?: number | null;
  qualityStatus?: string | null;
  structuredBrief?: unknown;
  summaryMarkdown?: string | null;

  assumptions: Assumption[];
  createdAt: string;
  updatedAt: string;
};

export type StructuredBrief = {
  overview: {
    projectName: string;
    companyName: string;
    projectType: string;
  };
  basics: {
    productService?: string | null;
    industryCategory?: string | null;
    geographyMarket?: string | null;
  };
  objective: {
    primaryGoal?: string | null;
    whyNow?: string | null;
    desiredOutcome?: string | null;
    timeline?: string | null;
    budgetRange?: string | null;
    decisionDeadline?: string | null;
  };
  marketContext: {
    marketDescription?: string | null;
    trends: string[];
    competitors: string[];
    currentPosition?: string | null;
    currentChallenges: string[];
    opportunities: string[];
  };
  audienceHypothesis: {
    likelyTarget?: string | null;
    customerKnowledge?: string | null;
    painPoints: string[];
    buyingTriggers: string[];
    channelIdeas: string[];
  };
  constraints: {
    budgetConstraints: string[];
    teamConstraints: string[];
    operationalConstraints: string[];
    regulatoryConstraints: string[];
  };
  assumptions: {
    text: string;
    confidence: "LOW" | "MEDIUM" | "HIGH";
  }[];
  successMetrics: {
    primaryKpi?: string | null;
    supportingKpis: string[];
    minimumSuccessThreshold?: string | null;
    riskIndicators: string[];
    failureConditions: string[];
  };
};
