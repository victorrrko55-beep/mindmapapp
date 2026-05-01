import { aiRefineSchema } from "@/types/api/ai";
import { notImplemented, parseJson } from "@/app/api/_utils";

export async function POST(request: Request) {
  await parseJson(request, aiRefineSchema);
  return notImplemented("POST /api/ai/brief/refine");
}
