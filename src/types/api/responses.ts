import { z } from "zod";

import { briefVersionDtoSchema } from "@/types/api/brief";
import { projectStatusEnum } from "@/types/api/primitives";
import { readinessResponseSchema } from "@/types/api/readiness";

export const projectDtoSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  name: z.string(),
  companyName: z.string(),
  projectType: z.string(),
  description: z.string().nullable().optional(),
  status: projectStatusEnum,
  currentVersionId: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const createProjectResponseSchema = z.object({
  project: projectDtoSchema,
  initialVersion: z.object({
    id: z.string(),
    versionNumber: z.number().int(),
    status: z.literal("DRAFT"),
  }),
});

export const listProjectsResponseSchema = z.object({
  items: z.array(
    projectDtoSchema.extend({
      currentVersion: z
        .object({
          id: z.string(),
          versionNumber: z.number().int(),
          readinessScore: z.number().int().nullable().optional(),
          qualityStatus: z.string().nullable().optional(),
          updatedAt: z.string(),
        })
        .nullable()
        .optional(),
    }),
  ),
  page: z.number().int(),
  pageSize: z.number().int(),
  total: z.number().int(),
});

export const projectDetailResponseSchema = z.object({
  project: projectDtoSchema,
  currentVersion: briefVersionDtoSchema.nullable(),
});

export const versionsListResponseSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      versionNumber: z.number().int(),
      status: z.string(),
      readinessScore: z.number().int().nullable().optional(),
      qualityStatus: z.string().nullable().optional(),
      createdAt: z.string(),
      updatedAt: z.string(),
      summaryMarkdown: z.string().nullable().optional(),
    }),
  ),
});

export const versionResponseSchema = z.object({
  version: briefVersionDtoSchema,
});

export const updateVersionResponseSchema = z.object({
  version: briefVersionDtoSchema,
  readiness: readinessResponseSchema,
});

export const assumptionResponseSchema = z.object({
  assumption: z.object({
    id: z.string(),
    briefVersionId: z.string(),
    text: z.string(),
    confidence: z.enum(["LOW", "MEDIUM", "HIGH"]),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
});

export const deleteSuccessResponseSchema = z.object({
  success: z.literal(true),
});
