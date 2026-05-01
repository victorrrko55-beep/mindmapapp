import { prisma } from "@/lib/db";
import { NotFoundError } from "@/server/errors";
import {
  buildSummaryMarkdown,
  buildStructuredBrief,
  mapBriefVersion,
  mapProject,
} from "@/server/mappers/brief.mapper";
import type {
  CreateProjectInput,
  ListProjectsQuery,
  UpdateProjectInput,
} from "@/types/api/project";
import type { BriefVersion } from "@/types/domain/brief";
import type { Project } from "@/types/domain/project";

export class PrismaProjectService {
  async createProject(input: CreateProjectInput, ownerId: string) {
    const result = await prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          ownerId,
          name: input.name,
          companyName: input.companyName,
          projectType: input.projectType,
          description: input.description,
          status: "DRAFT",
        },
      });

      const initialVersion = await tx.briefVersion.create({
        data: {
          projectId: project.id,
          versionNumber: 1,
          status: "DRAFT",
        },
        include: { assumptions: true },
      });

      const updatedProject = await tx.project.update({
        where: { id: project.id },
        data: { currentVersionId: initialVersion.id },
      });

      await tx.projectActivity.create({
        data: {
          projectId: project.id,
          actorId: ownerId,
          type: "PROJECT_CREATED",
          message: "Project and initial brief version created.",
        },
      });

      return { project: updatedProject, initialVersion };
    });

    return {
      project: mapProject(result.project),
      initialVersion: {
        id: result.initialVersion.id,
        versionNumber: result.initialVersion.versionNumber,
        status: result.initialVersion.status,
      },
    };
  }

  async listProjects(ownerId: string, query: ListProjectsQuery) {
    const where = {
      ownerId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: "insensitive" as const } },
              {
                companyName: {
                  contains: query.search,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.project.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.project.count({ where }),
    ]);

    const versions = await prisma.briefVersion.findMany({
      where: {
        id: {
          in: items.flatMap((item) =>
            item.currentVersionId ? [item.currentVersionId] : [],
          ),
        },
      },
      include: { assumptions: true },
    });
    const versionsById = new Map(
      versions.map((version) => [version.id, mapBriefVersion(version)]),
    );

    return {
      items: items.map((item) => {
        const project = mapProject(item);
        const currentVersion = project.currentVersionId
          ? versionsById.get(project.currentVersionId)
          : null;

        return {
          ...project,
          currentVersion: currentVersion
            ? {
                id: currentVersion.id,
                versionNumber: currentVersion.versionNumber,
                readinessScore: currentVersion.readinessScore,
                qualityStatus: currentVersion.qualityStatus,
                updatedAt: currentVersion.updatedAt,
              }
            : null,
        };
      }),
      page: query.page,
      pageSize: query.pageSize,
      total,
    };
  }

  async getProject(projectId: string, ownerId: string) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, ownerId },
    });

    if (!project) throw new NotFoundError("Project not found");

    const currentVersion = project.currentVersionId
      ? await prisma.briefVersion.findUnique({
          where: { id: project.currentVersionId },
          include: { assumptions: true },
        })
      : null;

    return {
      project: mapProject(project),
      currentVersion: currentVersion ? mapBriefVersion(currentVersion) : null,
    };
  }

  async updateProject(
    projectId: string,
    ownerId: string,
    input: UpdateProjectInput,
  ): Promise<Project> {
    await this.getProject(projectId, ownerId);

    const project = await prisma.project.update({
      where: { id: projectId },
      data: input,
    });

    return mapProject(project);
  }

  buildFinalBrief(project: Project, version: BriefVersion) {
    return {
      structuredBrief: buildStructuredBrief(project, version),
      summaryMarkdown: buildSummaryMarkdown(project, version),
    };
  }
}

export const projectService = new PrismaProjectService();
