import { z } from "zod";

export const readinessResponseSchema = z.object({
  status: z.enum(["incomplete", "needs_refinement", "complete"]),
  score: z.number().int().min(0).max(100),
  missingFields: z.array(z.string()),
  warnings: z.array(z.string()),
  sectionScores: z.object({
    "project-basics": z.number().int().min(0).max(100),
    "business-objective": z.number().int().min(0).max(100),
    "market-context": z.number().int().min(0).max(100),
    "audience-hypothesis": z.number().int().min(0).max(100),
    "constraints-assumptions": z.number().int().min(0).max(100),
    "success-metrics": z.number().int().min(0).max(100),
  }),
});

export type ReadinessResponse = z.infer<typeof readinessResponseSchema>;
