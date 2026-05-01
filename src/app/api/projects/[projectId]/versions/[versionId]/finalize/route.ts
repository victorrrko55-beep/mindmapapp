import { ok, route } from "@/app/api/_utils";
import { requireUser } from "@/lib/auth";
import { briefVersionService } from "@/server/services/brief-version.service.impl";

type RouteContext = { params: Promise<{ projectId: string; versionId: string }> };

export async function POST(request: Request, context: RouteContext) {
  return route(async () => {
    const user = await requireUser(request);
    const { projectId, versionId } = await context.params;
    const result = await briefVersionService.finalizeVersion(
      projectId,
      versionId,
      user.id,
    );
    return ok(result);
  });
}
