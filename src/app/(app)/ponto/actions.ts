"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { nextEntryType, type Entry } from "@/lib/ponto";
import { TimeEntryType } from "@prisma/client";
import { z } from "zod";

const registrarSchema = z.object({
  type: z.nativeEnum(TimeEntryType).optional(),
});

export async function registrarPonto(input: { type?: TimeEntryType }) {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada." };
  if (!hasPermission(session.user.permissions, PERMISSIONS.PONTO_REGISTRAR)) {
    return { error: "Você não tem permissão para registrar ponto." };
  }

  const parsed = registrarSchema.safeParse(input);
  if (!parsed.success) return { error: "Tipo de batida inválido." };

  // Pegamos as batidas do dia para sugerir o próximo tipo caso o cliente não passe
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const today = await prisma.timeEntry.findMany({
    where: {
      userId: session.user.id,
      timestamp: { gte: todayStart, lte: todayEnd },
    },
    orderBy: { timestamp: "asc" },
  });

  const todayMapped: Entry[] = today.map((e) => ({
    id: e.id,
    type: e.type,
    timestamp: e.timestamp,
  }));
  const type = parsed.data.type ?? nextEntryType(todayMapped);

  // Bloqueia batidas duplicadas em janela de 30s
  const last = today[today.length - 1];
  if (last && Date.now() - last.timestamp.getTime() < 30_000) {
    return { error: "Aguarde alguns segundos antes de registrar outra batida." };
  }

  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    null;
  const userAgent = h.get("user-agent") ?? null;

  const entry = await prisma.timeEntry.create({
    data: {
      userId: session.user.id,
      type,
      timestamp: new Date(),
      source: "WEB",
      ipAddress: ip,
      userAgent,
    },
  });

  return {
    ok: true as const,
    entry: {
      id: entry.id,
      type: entry.type,
      timestamp: entry.timestamp.toISOString(),
    },
  };
}

// Ajuste manual (admin / RH)
const ajusteSchema = z.object({
  userId: z.string(),
  timestamp: z.string(), // ISO
  type: z.nativeEnum(TimeEntryType),
  note: z.string().min(1),
});

export async function ajustarPonto(input: z.infer<typeof ajusteSchema>) {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada." };
  if (!hasPermission(session.user.permissions, PERMISSIONS.PONTO_AJUSTAR)) {
    return { error: "Sem permissão para ajustar pontos." };
  }
  const parsed = ajusteSchema.safeParse(input);
  if (!parsed.success) return { error: "Dados inválidos." };

  await prisma.timeEntry.create({
    data: {
      userId: parsed.data.userId,
      type: parsed.data.type,
      timestamp: new Date(parsed.data.timestamp),
      source: "AJUSTE_MANUAL",
      note: parsed.data.note,
      adjustedById: session.user.id,
      adjustedAt: new Date(),
    },
  });
  return { ok: true as const };
}

export async function excluirPonto(id: string) {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada." };
  if (!hasPermission(session.user.permissions, PERMISSIONS.PONTO_AJUSTAR)) {
    return { error: "Sem permissão." };
  }
  await prisma.timeEntry.delete({ where: { id } });
  return { ok: true as const };
}
