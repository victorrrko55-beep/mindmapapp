import { prisma } from "@/lib/db";
import { NotFoundError } from "@/server/errors";
import {
  buildSummaryMarkdown,
  buildStructuredBrief,
  mapAssumption,
  mapBriefVersion,
  mapProject,
} from "@/server/mappers/brief.mapper";
import { readinessService } from "@/server/services/readiness.service.impl";
import type {
  CreateAssumptionInput,
  UpdateAssumptionInput,
  UpdateBriefStepInput,
} from "@/types/api/brief";

type VersionUpdateData = Record<string, unknown>;

function stepToUpdateData(input: UpdateBriefStepInput): VersionUpdateData {
  switch (input.step) {
    case "project-basics":
      return input.data;
    case "business-objective":
      return {
        ...input.data,
        decisionDeadline: input.data.decisionDeadline
          ? new Date(input.data.decisionDeadline)
          : null,
      };
    case "market-context":
    case "audience-hypothesis":
    case "constraints-assumptions":
    case "success-metrics":
      return input.data;
  }
}

export class PrismaBriefVersionService {
  private async findOwnedProject(projectId: string, ownerId: string) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, ownerId },
    });

    if (!project) throw new NotFoundError("Project not found");
    return project;
  }

  private async findOwnedVersion(
    projectId: string,
    versionId: string,
    ownerId: string,
  ) {
    await this.findOwnedProject(projectId, ownerId);

    const version = await prisma.briefVersion.findFirst({
      where: { id: versionId, projectId },
      include: { assumptions: true },
    });

    if (!version) throw new NotFoundError("Brief version not found");
    return version;
  }

  async listVersions(projectId: string, ownerId: string) {
    await this.findOwnedProject(projectId, ownerId);
    const versions = await prisma.briefVersion.findMany({
      where: { projectId },
      include: { assumptions: true },
      orderBy: { versionNumber: "desc" },
    });

    return versions.map(mapBriefVersion);
  }

  async createVersionFromCurrent(projectId: string, ownerId: string) {
    const project = await this.findOwnedProject(projectId, ownerId);
    const currentVersion = project.currentVersionId
      ? await prisma.briefVersion.findUnique({
          where: { id: project.currentVersionId },
          include: { assumptions: true },
        })
      : null;

    const maxVersion = await prisma.briefVersion.aggregate({
      where: { projectId },
      _max: { versionNumber: true },
    });
    const versionNumber = (maxVersion._max.versionNumber ?? 0) + 1;

    const version = await prisma.$transaction(async (tx) => {
      const next = await tx.briefVersion.create({
        data: {
          projectId,
          versionNumber,
          status: "DRAFT",
          productService: currentVersion?.productService,
          industryCategory: currentVersion?.industryCategory,
          geographyMarket: currentVersion?.geographyMarket,
          primaryGoal: currentVersion?.primaryGoal,
          whyNow: currentVersion?.whyNow,
          desiredOutcome: currentVersion?.desiredOutcome,
          timeline: currentVersion?.timeline,
          budgetRange: currentVersion?.budgetRange,
          decisionDeadline: currentVersion?.decisionDeadline,
          marketDescription: currentVersion?.marketDescription,
          trends: currentVersion?.trends ?? undefined,
          competitors: currentVersion?.competitors ?? undefined,
          currentPosition: currentVersion?.currentPosition,
          currentChallenges: currentVersion?.currentChallenges ?? undefined,
          opportunities: currentVersion?.opportunities ?? undefined,
          likelyTarget: currentVersion?.likelyTarget,
          customerKnowledge: currentVersion?.customerKnowledge,
          painPoints: currentVersion?.painPoints ?? undefined,
          buyingTriggers: currentVersion?.buyingTriggers ?? undefined,
          channelIdeas: currentVersion?.channelIdeas ?? undefined,
          budgetConstraints: currentVersion?.budgetConstraints ?? undefined,
          teamConstraints: currentVersion?.teamConstraints ?? undefined,
          operationalConstraints:
            currentVersion?.operationalConstraints ?? undefined,
          regulatoryConstraints:
            currentVersion?.regulatoryConstraints ?? undefined,
          primaryKpi: currentVersion?.primaryKpi,
          supportingKpis: currentVersion?.supportingKpis ?? undefined,
          minimumSuccessThreshold: currentVersion?.minimumSuccessThreshold,
          riskIndicators: currentVersion?.riskIndicators ?? undefined,
          failureConditions: currentVersion?.failureConditions ?? undefined,
        },
      });

      if (currentVersion?.assumptions.length) {
        await tx.assumption.createMany({
          data: currentVersion.assumptions.map((assumption) => ({
            briefVersionId: next.id,
            text: assumption.text,
            confidence: assumption.confidence,
          })),
        });
      }

      await tx.project.update({
        where: { id: projectId },
        data: { currentVersionId: next.id, status: "IN_PROGRESS" },
      });

      return tx.briefVersion.findUniqueOrThrow({
        where: { id: next.id },
        include: { assumptions: true },
      });
    });

    return mapBriefVersion(version);
  }

  async getVersion(projectId: string, versionId: string, ownerId: string) {
    return mapBriefVersion(await this.findOwnedVersion(projectId, versionId, ownerId));
  }

  async updateStep(
    projectId: string,
    versionId: string,
    ownerId: string,
    input: UpdateBriefStepInput,
  ) {
    await this.findOwnedVersion(projectId, versionId, ownerId);

    const version = await prisma.briefVersion.update({
      where: { id: versionId },
      data: {
        ...stepToUpdateData(input),
        status: "DRAFT",
      },
      include: { assumptions: true },
    });

    await prisma.project.update({
      where: { id: projectId },
      data: { status: "IN_PROGRESS", currentVersionId: versionId },
    });

    const mapped = mapBriefVersion(version);
    const readiness = readinessService.computeReadiness(mapped);

    const savedVersion = await prisma.briefVersion.update({
      where: { id: versionId },
      data: {
        readinessScore: readiness.score,
        qualityStatus: readiness.status,
      },
      include: { assumptions: true },
    });

    return {
      version: mapBriefVersion(savedVersion),
      readiness,
    };
  }

  async finalizeVersion(projectId: string, versionId: string, ownerId: string) {
    const projectRecord = await this.findOwnedProject(projectId, ownerId);
    const versionRecord = await this.findOwnedVersion(projectId, versionId, ownerId);

    const project = mapProject(projectRecord);
    const version = mapBriefVersion(versionRecord);
    const readiness = readinessService.computeReadiness(version);

    const structuredBrief = buildStructuredBrief(project, version);
    const summaryMarkdown = buildSummaryMarkdown(project, version);

    const savedVersion = await prisma.briefVersion.update({
      where: { id: versionId },
      data: {
        status: "FINAL",
        readinessScore: readiness.score,
        qualityStatus: readiness.status,
        structuredBrief: structuredBrief as object,
        summaryMarkdown,
      },
      include: { assumptions: true },
    });

    await prisma.project.update({
      where: { id: projectId },
      data: {
        currentVersionId: versionId,
        status: readiness.status === "complete" ? "READY_FOR_REVIEW" : "IN_PROGRESS",
      },
    });

    return {
      version: mapBriefVersion(savedVersion),
      readiness,
    };
  }

  async createAssumption(
    projectId: string,
    versionId: string,
    ownerId: string,
    input: CreateAssumptionInput,
  ) {
    await this.findOwnedVersion(projectId, versionId, ownerId);

    const assumption = await prisma.assumption.create({
      data: {
        briefVersionId: versionId,
        text: input.text,
        confidence: input.confidence,
      },
    });

    return mapAssumption(assumption);
  }

  async updateAssumption(
    projectId: string,
    versionId: string,
    assumptionId: string,
    ownerId: string,
    input: UpdateAssumptionInput,
  ) {
    await this.findOwnedVersion(projectId, versionId, ownerId);

    const assumption = await prisma.assumption.update({
      where: { id: assumptionId, briefVersionId: versionId },
      data: input,
    });

    return mapAssumption(assumption);
  }

  async deleteAssumption(
    projectId: string,
    versionId: string,
    assumptionId: string,
    ownerId: string,
  ) {
    await this.findOwnedVersion(projectId, versionId, ownerId);
    await prisma.assumption.delete({
      where: { id: assumptionId, briefVersionId: versionId },
    });
  }
}

export const briefVersionService = new PrismaBriefVersionService();
