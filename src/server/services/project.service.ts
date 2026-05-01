import type {
  CreateProjectInput,
  ListProjectsQuery,
  UpdateProjectInput,
} from "@/types/api/project";
import type { BriefVersion } from "@/types/domain/brief";
import type { Project } from "@/types/domain/project";

export interface ProjectListItem extends Project {
  currentVersion?: Pick<
    BriefVersion,
    "id" | "versionNumber" | "readinessScore" | "qualityStatus" | "updatedAt"
  > | null;
}

export interface ProjectService {
  createProject(input: CreateProjectInput, ownerId: string): Promise<{
    project: Project;
    initialVersion: Pick<BriefVersion, "id" | "versionNumber" | "status">;
  }>;
  listProjects(ownerId: string, query: ListProjectsQuery): Promise<{
    items: ProjectListItem[];
    page: number;
    pageSize: number;
    total: number;
  }>;
  getProject(
    projectId: string,
    ownerId: string,
  ): Promise<{ project: Project; currentVersion: BriefVersion | null }>;
  updateProject(
    projectId: string,
    ownerId: string,
    input: UpdateProjectInput,
  ): Promise<Project>;
}
