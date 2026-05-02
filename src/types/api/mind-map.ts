import { z } from "zod";

import { nonEmptyString, optionalTrimmedString } from "@/types/api/primitives";

export const mindMapNodeSchema = z.object({
  id: nonEmptyString,
  label: nonEmptyString,
  parentId: z.string().trim().nullable(),
  x: z.number().finite().optional(),
  y: z.number().finite().optional(),
});

export const createMindMapSchema = z.object({
  title: nonEmptyString,
  nodes: z.array(mindMapNodeSchema).min(1),
});

export const updateMindMapSchema = z.object({
  title: optionalTrimmedString,
  nodes: z.array(mindMapNodeSchema).min(1).optional(),
});
