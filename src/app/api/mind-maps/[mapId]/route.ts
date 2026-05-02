import { ok, parseJson, route } from "@/app/api/_utils";
import { requireUser } from "@/lib/auth";
import { mindMapService } from "@/server/services/mind-map.service.impl";
import { updateMindMapSchema } from "@/types/api/mind-map";

type RouteContext = { params: Promise<{ mapId: string }> };

export async function GET(request: Request, context: RouteContext) {
  return route(async () => {
    const user = await requireUser(request);
    const { mapId } = await context.params;
    const result = await mindMapService.getMindMap(mapId, user.id);
    return ok(result);
  });
}

export async function PUT(request: Request, context: RouteContext) {
  return route(async () => {
    const user = await requireUser(request);
    const { mapId } = await context.params;
    const input = await parseJson(request, updateMindMapSchema);
    const result = await mindMapService.updateMindMap(mapId, user.id, input);
    return ok(result);
  });
}

export async function DELETE(request: Request, context: RouteContext) {
  return route(async () => {
    const user = await requireUser(request);
    const { mapId } = await context.params;
    const result = await mindMapService.deleteMindMap(mapId, user.id);
    return ok(result);
  });
}
