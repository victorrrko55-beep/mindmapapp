import { ok, route } from "@/app/api/_utils";
import { requireUser } from "@/lib/auth";
import { briefVersionService } from "@/server/services/brief-version.service.impl";

type RouteContext = { params: Promise<{ projectId: string }> };

export async function GET(request: Request, context: RouteContext) {
  return route(async () => {
    const user = await requireUser(request);
    const { projectId } = await context.params;
    const items = await briefVersionService.listVersions(projectId, user.id);
    return ok({ items });
  });
}

export async function POST(request: Request, context: RouteContext) {
  return route(async () => {
    const user = await requireUser(request);
    const { projectId } = await context.params;
    const version = await briefVersionService.createVersionFromCurrent(
      projectId,
      user.id,
    );
    return ok({ version }, 201);
  });
}
