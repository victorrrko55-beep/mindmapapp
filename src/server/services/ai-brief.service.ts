import type {
  AiExtractInput,
  AiGapCheckInput,
  AiRefineInput,
  AiSummarizeInput,
} from "@/types/api/ai";

export interface AiBriefService {
  extractFields(input: AiExtractInput): Promise<Record<string, unknown>>;
  refineSection(input: AiRefineInput): Promise<Record<string, unknown>>;
  summarizeVersion(input: AiSummarizeInput): Promise<string>;
  gapCheck(input: AiGapCheckInput): Promise<{
    missingFields: string[];
    warnings: string[];
    suggestions: string[];
  }>;
}
