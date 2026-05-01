import { z } from "zod";

export const briefStepKeySchema = z.enum([
  "project-basics",
  "business-objective",
  "market-context",
  "audience-hypothesis",
  "constraints-assumptions",
  "success-metrics",
]);

export const aiExtractSchema = z.object({
  rawNotes: z.string().trim().min(20).max(8000),
  targetStep: briefStepKeySchema,
});

export const aiRefineSchema = z.object({
  step: briefStepKeySchema,
  input: z.record(z.unknown()),
});

export const aiSummarizeSchema = z.object({
  projectId: z.string(),
  versionId: z.string(),
});

export const aiGapCheckSchema = z.object({
  projectId: z.string(),
  versionId: z.string(),
});

export type AiExtractInput = z.infer<typeof aiExtractSchema>;
export type AiRefineInput = z.infer<typeof aiRefineSchema>;
export type AiSummarizeInput = z.infer<typeof aiSummarizeSchema>;
export type AiGapCheckInput = z.infer<typeof aiGapCheckSchema>;
