"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, PERMISSIONS, PERMISSION_CATALOG } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

async function ensureCanManage() {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada." as const };
  if (!hasPermission(session.user.permissions, PERMISSIONS.ADMIN_CARGOS)) {
    return { error: "Sem permissão." as const };
  }
  return { ok: true as const };
}

async function syncPermissionsCatalog() {
  // Garante que todas as keys do catálogo existam no banco
  for (const p of PERMISSION_CATALOG) {
    await prisma.permission.upsert({
      where: { key: p.key },
      update: { label: p.label, description: p.description, module: p.module },
      create: { key: p.key, label: p.label, description: p.description, module: p.module },
    });
  }
}

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  permissions: z.array(z.string()),
});

export async function criarCargo(input: z.infer<typeof createSchema>) {
  const guard = await ensureCanManage();
  if ("error" in guard) return guard;
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { error: "Dados inválidos." };

  await syncPermissionsCatalog();

  const perms = await prisma.permission.findMany({
    where: { key: { in: parsed.data.permissions } },
  });

  await prisma.jobRole.create({
    data: {
      name: parsed.data.name.trim(),
      description: parsed.data.description?.trim() || null,
      permissions: { connect: perms.map((p) => ({ id: p.id })) },
    },
  });
  revalidatePath("/admin/cargos");
  revalidatePath("/admin/usuarios");
  return { ok: true as const };
}

const updateSchema = createSchema.extend({ id: z.string() });

export async function atualizarCargo(input: z.infer<typeof updateSchema>) {
  const guard = await ensureCanManage();
  if ("error" in guard) return guard;
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return { error: "Dados inválidos." };

  await syncPermissionsCatalog();

  const perms = await prisma.permission.findMany({
    where: { key: { in: parsed.data.permissions } },
  });

  await prisma.jobRole.update({
    where: { id: parsed.data.id },
    data: {
      name: parsed.data.name.trim(),
      description: parsed.data.description?.trim() || null,
      permissions: { set: perms.map((p) => ({ id: p.id })) },
    },
  });
  revalidatePath("/admin/cargos");
  revalidatePath("/admin/usuarios");
  return { ok: true as const };
}

export async function excluirCargo(id: string) {
  const guard = await ensureCanManage();
  if ("error" in guard) return guard;

  await prisma.jobRole.delete({ where: { id } });
  revalidatePath("/admin/cargos");
  return { ok: true as const };
}
