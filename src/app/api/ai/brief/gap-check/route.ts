import { aiGapCheckSchema } from "@/types/api/ai";
import { notImplemented, parseJson } from "@/app/api/_utils";

export async function POST(request: Request) {
  await parseJson(request, aiGapCheckSchema);
  return notImplemented("POST /api/ai/brief/gap-check");
}
