import { createProjectSchema } from "@/types/api/project";
import { listProjectsQuerySchema } from "@/types/api/project";
import { ok, parseJson, parseSearchParams, route } from "@/app/api/_utils";
import { requireUser } from "@/lib/auth";
import { projectService } from "@/server/services/project.service.impl";

export async function GET(request: Request) {
  return route(async () => {
    const user = await requireUser(request);
    const query = parseSearchParams(request, listProjectsQuerySchema);
    const result = await projectService.listProjects(user.id, query);
    return ok(result);
  });
}

export async function POST(request: Request) {
  return route(async () => {
    const user = await requireUser(request);
    const input = await parseJson(request, createProjectSchema);
    const result = await projectService.createProject(input, user.id);
    return ok(result, 201);
  });
}
