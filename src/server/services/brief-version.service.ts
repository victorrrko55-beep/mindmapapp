import type {
  CreateAssumptionInput,
  UpdateAssumptionInput,
  UpdateBriefStepInput,
} from "@/types/api/brief";
import type { ReadinessResponse } from "@/types/api/readiness";
import type { BriefVersion } from "@/types/domain/brief";
import type { Assumption } from "@/types/domain/project";

export interface BriefVersionService {
  listVersions(projectId: string, ownerId: string): Promise<BriefVersion[]>;
  createVersionFromCurrent(
    projectId: string,
    ownerId: string,
  ): Promise<BriefVersion>;
  getVersion(
    projectId: string,
    versionId: string,
    ownerId: string,
  ): Promise<BriefVersion>;
  updateStep(
    projectId: string,
    versionId: string,
    ownerId: string,
    input: UpdateBriefStepInput,
  ): Promise<{ version: BriefVersion; readiness: ReadinessResponse }>;
  finalizeVersion(
    projectId: string,
    versionId: string,
    ownerId: string,
  ): Promise<{ version: BriefVersion; readiness: ReadinessResponse }>;
  createAssumption(
    projectId: string,
    versionId: string,
    ownerId: string,
    input: CreateAssumptionInput,
  ): Promise<Assumption>;
  updateAssumption(
    projectId: string,
    versionId: string,
    assumptionId: string,
    ownerId: string,
    input: UpdateAssumptionInput,
  ): Promise<Assumption>;
  deleteAssumption(
    projectId: string,
    versionId: string,
    assumptionId: string,
    ownerId: string,
  ): Promise<void>;
}
