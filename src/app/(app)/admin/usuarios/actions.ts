"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

const aprovarSchema = z.object({
  userId: z.string(),
  jobRoleId: z.string(),
  departmentId: z.string().nullable(),
  systemRole: z.enum(["COLABORADOR", "GESTOR", "RH", "ADMIN"]),
});

export async function aprovarUsuario(input: z.infer<typeof aprovarSchema>) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.permissions, PERMISSIONS.ADMIN_USUARIOS)) {
    return { error: "Sem permissão." };
  }
  const parsed = aprovarSchema.safeParse(input);
  if (!parsed.success) return { error: "Dados inválidos." };

  await prisma.user.update({
    where: { id: parsed.data.userId },
    data: {
      status: "ATIVO",
      jobRoleId: parsed.data.jobRoleId,
      departmentId: parsed.data.departmentId,
      systemRole: parsed.data.systemRole,
      approvedAt: new Date(),
      approvedById: session.user.id,
    },
  });
  revalidatePath("/admin/usuarios");
  return { ok: true as const };
}

const updateSchema = z.object({
  userId: z.string(),
  jobRoleId: z.string().nullable(),
  departmentId: z.string().nullable(),
  systemRole: z.enum(["COLABORADOR", "GESTOR", "RH", "ADMIN"]),
});

export async function atualizarUsuario(input: z.infer<typeof updateSchema>) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.permissions, PERMISSIONS.ADMIN_USUARIOS)) {
    return { error: "Sem permissão." };
  }
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return { error: "Dados inválidos." };

  await prisma.user.update({
    where: { id: parsed.data.userId },
    data: {
      jobRoleId: parsed.data.jobRoleId,
      departmentId: parsed.data.departmentId,
      systemRole: parsed.data.systemRole,
    },
  });
  revalidatePath("/admin/usuarios");
  return { ok: true as const };
}

const statusSchema = z.object({
  userId: z.string(),
  status: z.enum(["ATIVO", "INATIVO", "BLOQUEADO", "PENDENTE"]),
});

export async function definirStatus(input: z.infer<typeof statusSchema>) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.permissions, PERMISSIONS.ADMIN_USUARIOS)) {
    return { error: "Sem permissão." };
  }
  const parsed = statusSchema.safeParse(input);
  if (!parsed.success) return { error: "Dados inválidos." };

  await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { status: parsed.data.status },
  });
  revalidatePath("/admin/usuarios");
  return { ok: true as const };
}
