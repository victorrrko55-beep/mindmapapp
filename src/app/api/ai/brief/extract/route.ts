import { aiExtractSchema } from "@/types/api/ai";
import { notImplemented, parseJson } from "@/app/api/_utils";

export async function POST(request: Request) {
  await parseJson(request, aiExtractSchema);
  return notImplemented("POST /api/ai/brief/extract");
}
