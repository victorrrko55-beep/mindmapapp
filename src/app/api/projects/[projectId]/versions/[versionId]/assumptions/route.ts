import { createAssumptionSchema } from "@/types/api/brief";
import { ok, parseJson, route } from "@/app/api/_utils";
import { requireUser } from "@/lib/auth";
import { briefVersionService } from "@/server/services/brief-version.service.impl";

type RouteContext = { params: Promise<{ projectId: string; versionId: string }> };

export async function POST(request: Request, context: RouteContext) {
  return route(async () => {
    const user = await requireUser(request);
    const { projectId, versionId } = await context.params;
    const input = await parseJson(request, createAssumptionSchema);
    const assumption = await briefVersionService.createAssumption(
      projectId,
      versionId,
      user.id,
      input,
    );
    return ok({ assumption }, 201);
  });
}
