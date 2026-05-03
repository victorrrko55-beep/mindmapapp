import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { ForbiddenError, NotFoundError } from "@/server/errors";

type MindMapNode = {
  id: string;
  label: string;
  parentId: string | null;
  x?: number;
  y?: number;
};

type MindMapEdge = {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  controlX?: number;
  controlY?: number;
};

type CreateMindMapInput = {
  title: string;
  nodes: MindMapNode[];
  edges: MindMapEdge[];
};

type UpdateMindMapInput = {
  title?: string;
  nodes?: MindMapNode[];
  edges?: MindMapEdge[];
};

function serializeDocument(nodes: MindMapNode[], edges: MindMapEdge[]) {
  return {
    nodes,
    edges,
  } as Prisma.InputJsonValue;
}

function deserializeDocument(value: Prisma.JsonValue) {
  if (Array.isArray(value)) {
    return {
      nodes: value,
      edges: [],
    };
  }

  if (value && typeof value === "object" && "nodes" in value) {
    const document = value as {
      nodes?: Prisma.JsonValue;
      edges?: Prisma.JsonValue;
    };

    return {
      nodes: Array.isArray(document.nodes) ? document.nodes : [],
      edges: Array.isArray(document.edges) ? document.edges : [],
    };
  }

  return {
    nodes: [],
    edges: [],
  };
}

function deserializeTypedDocument(value: Prisma.JsonValue): {
  nodes: MindMapNode[];
  edges: MindMapEdge[];
} {
  const document = deserializeDocument(value);

  return {
    nodes: document.nodes as MindMapNode[],
    edges: document.edges as MindMapEdge[],
  };
}

function mapMindMap(item: {
  id: string;
  title: string;
  nodes: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
}) {
  const document = deserializeTypedDocument(item.nodes);

  return {
    id: item.id,
    title: item.title,
    nodes: document.nodes,
    edges: document.edges,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

type MindMapRecord = {
  id: string;
  ownerId: string;
  title: string;
  nodes: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
};

type MindMapModel = {
  findMany(args: { where: { ownerId: string }; orderBy: { updatedAt: "desc" } }): Promise<
    MindMapRecord[]
  >;
  create(args: {
    data: { ownerId: string; title: string; nodes: Prisma.InputJsonValue };
  }): Promise<MindMapRecord>;
  findUnique(args: { where: { id: string } }): Promise<MindMapRecord | null>;
  update(args: {
    where: { id: string };
    data: { title?: string; nodes?: Prisma.InputJsonValue };
  }): Promise<MindMapRecord>;
  delete(args: { where: { id: string } }): Promise<MindMapRecord>;
};

const mindMapModel = (prisma as typeof prisma & { mindMap: MindMapModel }).mindMap;

export class PrismaMindMapService {
  async listMindMaps(ownerId: string) {
    const items = await mindMapModel.findMany({
      where: { ownerId },
      orderBy: { updatedAt: "desc" },
    });

    return {
      items: items.map((item) => ({
        id: item.id,
        title: item.title,
        updatedAt: item.updatedAt.toISOString(),
      })),
    };
  }

  async createMindMap(ownerId: string, input: CreateMindMapInput) {
    const item = await mindMapModel.create({
      data: {
        ownerId,
        title: input.title,
        nodes: serializeDocument(input.nodes, input.edges),
      },
    });

    return { map: mapMindMap(item) };
  }

  async getMindMap(mapId: string, ownerId: string) {
    const item = await mindMapModel.findUnique({
      where: { id: mapId },
    });

    if (!item) {
      throw new NotFoundError("Mind map not found");
    }

    if (item.ownerId !== ownerId) {
      throw new ForbiddenError();
    }

    return { map: mapMindMap(item) };
  }

  async updateMindMap(mapId: string, ownerId: string, input: UpdateMindMapInput) {
    const current = await this.getMindMap(mapId, ownerId);

    const item = await mindMapModel.update({
      where: { id: mapId },
      data: {
        ...(input.title ? { title: input.title } : {}),
        ...(input.nodes || input.edges
          ? {
              nodes: serializeDocument(input.nodes ?? current.map.nodes, input.edges ?? current.map.edges),
            }
          : {}),
      },
    });

    return { map: mapMindMap(item) };
  }

  async deleteMindMap(mapId: string, ownerId: string) {
    await this.getMindMap(mapId, ownerId);

    await mindMapModel.delete({
      where: { id: mapId },
    });

    return { success: true };
  }
}

export const mindMapService = new PrismaMindMapService();
