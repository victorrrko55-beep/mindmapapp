import { ok, route } from "@/app/api/_utils";
import { requireUser } from "@/lib/auth";
import { readinessService } from "@/server/services/readiness.service.impl";
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
    return ok(readinessService.computeReadiness(version));
  });
}
