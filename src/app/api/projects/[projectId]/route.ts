import { updateProjectSchema } from "@/types/api/project";
import { ok, parseJson, route } from "@/app/api/_utils";
import { requireUser } from "@/lib/auth";
import { projectService } from "@/server/services/project.service.impl";

type RouteContext = { params: Promise<{ projectId: string }> };

export async function GET(request: Request, context: RouteContext) {
  return route(async () => {
    const user = await requireUser(request);
    const { projectId } = await context.params;
    const result = await projectService.getProject(projectId, user.id);
    return ok(result);
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  return route(async () => {
    const user = await requireUser(request);
    const { projectId } = await context.params;
    const input = await parseJson(request, updateProjectSchema);
    const project = await projectService.updateProject(projectId, user.id, input);
    return ok({ project });
  });
}
