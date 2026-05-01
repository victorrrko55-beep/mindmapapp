import { updateAssumptionSchema } from "@/types/api/brief";
import { ok, parseJson, route } from "@/app/api/_utils";
import { requireUser } from "@/lib/auth";
import { briefVersionService } from "@/server/services/brief-version.service.impl";

type RouteContext = {
  params: Promise<{ projectId: string; versionId: string; assumptionId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  return route(async () => {
    const user = await requireUser(request);
    const { projectId, versionId, assumptionId } = await context.params;
    const input = await parseJson(request, updateAssumptionSchema);
    const assumption = await briefVersionService.updateAssumption(
      projectId,
      versionId,
      assumptionId,
      user.id,
      input,
    );
    return ok({ assumption });
  });
}

export async function DELETE(request: Request, context: RouteContext) {
  return route(async () => {
    const user = await requireUser(request);
    const { projectId, versionId, assumptionId } = await context.params;
    await briefVersionService.deleteAssumption(
      projectId,
      versionId,
      assumptionId,
      user.id,
    );
    return ok({ success: true });
  });
}
