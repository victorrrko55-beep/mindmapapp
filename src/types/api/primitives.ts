import { z } from "zod";

export const nonEmptyString = z.string().trim().min(1);
export const optionalTrimmedString = z.string().trim().optional();
export const stringList = z.array(z.string().trim().min(1)).default([]);

export const confidenceEnum = z.enum(["LOW", "MEDIUM", "HIGH"]);
export const projectStatusEnum = z.enum([
  "DRAFT",
  "IN_PROGRESS",
  "READY_FOR_REVIEW",
  "FINALIZED",
]);
export const briefStatusEnum = z.enum(["DRAFT", "FINAL"]);
