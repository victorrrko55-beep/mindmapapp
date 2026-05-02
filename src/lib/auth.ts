import { prisma } from "@/lib/db";

export type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
};

export async function requireUser(request: Request): Promise<AuthUser> {
  const emailHeader = request.headers.get("x-user-email")?.trim().toLowerCase();
  const name = request.headers.get("x-user-name")?.trim() || null;
  const idHeader = request.headers.get("x-user-id")?.trim();

  const user = emailHeader
    ? await prisma.user.upsert({
        where: { email: emailHeader },
        create: { email: emailHeader, name },
        update: { name },
      })
    : await prisma.user.upsert({
        where: { id: idHeader ?? "dev_user" },
        create: {
          id: idHeader ?? "dev_user",
          email: `${idHeader ?? "dev_user"}@project-brief-builder.local`,
          name,
        },
        update: { name },
      });

  return {
    id: user.id,
    email: user.email,
    name: user.name,
  };
}
