import { ok, parseJson, route } from "@/app/api/_utils";
import { requireUser } from "@/lib/auth";
import { mindMapService } from "@/server/services/mind-map.service.impl";
import { createMindMapSchema } from "@/types/api/mind-map";

export async function GET(request: Request) {
  return route(async () => {
    const user = await requireUser(request);
    const result = await mindMapService.listMindMaps(user.id);
    return ok(result);
  });
}

export async function POST(request: Request) {
  return route(async () => {
    const user = await requireUser(request);
    const input = await parseJson(request, createMindMapSchema);
    const result = await mindMapService.createMindMap(user.id, input);
    return ok(result, 201);
  });
}
