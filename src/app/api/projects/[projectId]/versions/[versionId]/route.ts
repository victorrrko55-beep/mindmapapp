import { updateBriefStepSchema } from "@/types/api/brief";
import { ok, parseJson, route } from "@/app/api/_utils";
import { requireUser } from "@/lib/auth";
import { briefVersionService } from "@/server/services/brief-version.service.impl";

type RouteContext = { params: Promise<{ projectId: string; versionId: string }> };

export async function GET(request: Request, context: RouteContext) {
  return route(async () => {
    const user = await requireUser(request);
    const { projectId, versionId } = await context.params;
    const version = await briefVersionService.getVersion(
      projectId,
      versionId,
      user.id,
    );
    return ok({ version });
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  return route(async () => {
    const user = await requireUser(request);
    const { projectId, versionId } = await context.params;
    const input = await parseJson(request, updateBriefStepSchema);
    const result = await briefVersionService.updateStep(
      projectId,
      versionId,
      user.id,
      input,
    );
    return ok(result);
  });
}
