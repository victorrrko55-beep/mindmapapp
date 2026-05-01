import { prisma } from "@/lib/db";

export type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
};

export async function requireUser(request: Request): Promise<AuthUser> {
  const id = request.headers.get("x-user-id") ?? "dev_user";
  const email =
    request.headers.get("x-user-email") ?? `${id}@project-brief-builder.local`;
  const name = request.headers.get("x-user-name");

  const user = await prisma.user.upsert({
    where: { id },
    create: { id, email, name },
    update: {
      email,
      name,
    },
  });

  return {
    id: user.id,
    email: user.email,
    name: user.name,
  };
}
