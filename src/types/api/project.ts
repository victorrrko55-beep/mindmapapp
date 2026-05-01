import { z } from "zod";

import {
  nonEmptyString,
  optionalTrimmedString,
  projectStatusEnum,
} from "@/types/api/primitives";

export const createProjectSchema = z.object({
  name: nonEmptyString.min(2).max(120),
  companyName: nonEmptyString.min(2).max(120),
  projectType: nonEmptyString.min(2).max(80),
  description: optionalTrimmedString,
});

export const updateProjectSchema = z.object({
  name: nonEmptyString.min(2).max(120).optional(),
  companyName: nonEmptyString.min(2).max(120).optional(),
  projectType: nonEmptyString.min(2).max(80).optional(),
  description: z.string().trim().nullable().optional(),
  status: projectStatusEnum.optional(),
});

export const listProjectsQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: projectStatusEnum.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ListProjectsQuery = z.infer<typeof listProjectsQuerySchema>;
