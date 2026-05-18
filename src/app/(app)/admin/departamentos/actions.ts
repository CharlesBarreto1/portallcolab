"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

export async function criarDepartamento(name: string) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.permissions, PERMISSIONS.ADMIN_DEPARTAMENTOS)) {
    return { error: "Sem permissão." };
  }
  const trimmed = name.trim();
  if (!trimmed) return { error: "Nome obrigatório." };
  await prisma.department.create({ data: { name: trimmed } });
  revalidatePath("/admin/departamentos");
  revalidatePath("/admin/usuarios");
  return { ok: true as const };
}

export async function excluirDepartamento(id: string) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.permissions, PERMISSIONS.ADMIN_DEPARTAMENTOS)) {
    return { error: "Sem permissão." };
  }
  await prisma.department.delete({ where: { id } });
  revalidatePath("/admin/departamentos");
  return { ok: true as const };
}
