import { z } from "zod";

import {
  briefStatusEnum,
  confidenceEnum,
  nonEmptyString,
  stringList,
} from "@/types/api/primitives";

export const projectBasicsStepSchema = z.object({
  productService: nonEmptyString.max(120),
  industryCategory: nonEmptyString.max(120),
  geographyMarket: nonEmptyString.max(120),
});

export const businessObjectiveStepSchema = z.object({
  primaryGoal: nonEmptyString.min(10).max(500),
  whyNow: nonEmptyString.min(10).max(1000),
  desiredOutcome: nonEmptyString.min(5).max(500),
  timeline: nonEmptyString.max(120),
  budgetRange: nonEmptyString.max(120),
  decisionDeadline: z.string().datetime().optional(),
});

export const marketContextStepSchema = z.object({
  marketDescription: nonEmptyString.min(10).max(2000),
  trends: stringList,
  competitors: stringList,
  currentPosition: nonEmptyString.max(1000),
  currentChallenges: stringList,
  opportunities: stringList,
});

export const audienceHypothesisStepSchema = z.object({
  likelyTarget: nonEmptyString.max(500),
  customerKnowledge: nonEmptyString.max(1000),
  painPoints: stringList,
  buyingTriggers: stringList,
  channelIdeas: stringList,
});

export const constraintsAssumptionsStepSchema = z.object({
  budgetConstraints: stringList,
  teamConstraints: stringList,
  operationalConstraints: stringList,
  regulatoryConstraints: stringList,
});

export const successMetricsStepSchema = z.object({
  primaryKpi: nonEmptyString.max(200),
  supportingKpis: stringList,
  minimumSuccessThreshold: nonEmptyString.max(500),
  riskIndicators: stringList,
  failureConditions: stringList,
});

export const assumptionSchema = z.object({
  id: z.string().optional(),
  text: nonEmptyString.min(5).max(500),
  confidence: confidenceEnum,
});

export const updateBriefStepSchema = z.discriminatedUnion("step", [
  z.object({
    step: z.literal("project-basics"),
    data: projectBasicsStepSchema,
  }),
  z.object({
    step: z.literal("business-objective"),
    data: businessObjectiveStepSchema,
  }),
  z.object({
    step: z.literal("market-context"),
    data: marketContextStepSchema,
  }),
  z.object({
    step: z.literal("audience-hypothesis"),
    data: audienceHypothesisStepSchema,
  }),
  z.object({
    step: z.literal("constraints-assumptions"),
    data: constraintsAssumptionsStepSchema,
  }),
  z.object({
    step: z.literal("success-metrics"),
    data: successMetricsStepSchema,
  }),
]);

export const createAssumptionSchema = z.object({
  text: nonEmptyString.min(5).max(500),
  confidence: confidenceEnum,
});

export const updateAssumptionSchema = z.object({
  text: nonEmptyString.min(5).max(500).optional(),
  confidence: confidenceEnum.optional(),
});

export const briefVersionDtoSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  versionNumber: z.number().int(),
  status: briefStatusEnum,

  productService: z.string().nullable().optional(),
  industryCategory: z.string().nullable().optional(),
  geographyMarket: z.string().nullable().optional(),

  primaryGoal: z.string().nullable().optional(),
  whyNow: z.string().nullable().optional(),
  desiredOutcome: z.string().nullable().optional(),
  timeline: z.string().nullable().optional(),
  budgetRange: z.string().nullable().optional(),
  decisionDeadline: z.string().nullable().optional(),

  marketDescription: z.string().nullable().optional(),
  trends: z.array(z.string()).optional(),
  competitors: z.array(z.string()).optional(),
  currentPosition: z.string().nullable().optional(),
  currentChallenges: z.array(z.string()).optional(),
  opportunities: z.array(z.string()).optional(),

  likelyTarget: z.string().nullable().optional(),
  customerKnowledge: z.string().nullable().optional(),
  painPoints: z.array(z.string()).optional(),
  buyingTriggers: z.array(z.string()).optional(),
  channelIdeas: z.array(z.string()).optional(),

  budgetConstraints: z.array(z.string()).optional(),
  teamConstraints: z.array(z.string()).optional(),
  operationalConstraints: z.array(z.string()).optional(),
  regulatoryConstraints: z.array(z.string()).optional(),

  primaryKpi: z.string().nullable().optional(),
  supportingKpis: z.array(z.string()).optional(),
  minimumSuccessThreshold: z.string().nullable().optional(),
  riskIndicators: z.array(z.string()).optional(),
  failureConditions: z.array(z.string()).optional(),

  readinessScore: z.number().int().nullable().optional(),
  qualityStatus: z.string().nullable().optional(),
  structuredBrief: z.unknown().optional(),
  summaryMarkdown: z.string().nullable().optional(),

  assumptions: z.array(
    z.object({
      id: z.string(),
      briefVersionId: z.string(),
      text: z.string(),
      confidence: confidenceEnum,
      createdAt: z.string(),
      updatedAt: z.string(),
    }),
  ),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type UpdateBriefStepInput = z.infer<typeof updateBriefStepSchema>;
export type CreateAssumptionInput = z.infer<typeof createAssumptionSchema>;
export type UpdateAssumptionInput = z.infer<typeof updateAssumptionSchema>;
export type BriefVersionDto = z.infer<typeof briefVersionDtoSchema>;
