import { NextResponse } from "next/server";
import { ZodTypeAny } from "zod";

import { AppError } from "@/server/errors";

export async function parseJson<TSchema extends ZodTypeAny>(
  request: Request,
  schema: TSchema,
) {
  const json = await request.json();
  return schema.parse(json);
}

export function parseSearchParams<TSchema extends ZodTypeAny>(
  request: Request,
  schema: TSchema,
) {
  const url = new URL(request.url);
  return schema.parse(Object.fromEntries(url.searchParams.entries()));
}

export function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (
    error &&
    typeof error === "object" &&
    "name" in error &&
    error.name === "ZodError"
  ) {
    return NextResponse.json(
      { error: "Invalid request", details: error },
      { status: 400 },
    );
  }

  console.error(error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export async function route(handler: () => Promise<Response>) {
  try {
    return await handler();
  } catch (error) {
    return fail(error);
  }
}

export function notImplemented(name: string) {
  return NextResponse.json(
    {
      error: "Not implemented",
      route: name,
      message:
        "This is a starter contract route. Wire it to your auth, database, and services.",
    },
    { status: 501 },
  );
}
