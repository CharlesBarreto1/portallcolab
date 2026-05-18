import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { summarizePeriod, typeLabel } from "@/lib/ponto";
import { formatMinutes } from "@/lib/utils";

function csvEscape(value: string | number): string {
  const s = String(value);
  if (s.includes(",") || s.includes("\"") || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function rowsToCsv(rows: (string | number)[][]): string {
  return rows.map((r) => r.map(csvEscape).join(",")).join("\n");
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const mes = url.searchParams.get("mes"); // YYYY-MM
  const userId = url.searchParams.get("userId");
  const all = url.searchParams.get("all") === "1";

  if (!mes) return NextResponse.json({ error: "mes obrigatorio" }, { status: 400 });
  const [y, m] = mes.split("-").map(Number);
  if (!y || !m) return NextResponse.json({ error: "mes invalido" }, { status: 400 });

  // Permissões
  const wantsOthers = all || (userId && userId !== session.user.id);
  if (wantsOthers && !hasPermission(session.user.permissions, PERMISSIONS.PONTO_VER_TODOS)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (!wantsOthers && !hasPermission(session.user.permissions, PERMISSIONS.PONTO_VER_PROPRIO)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const from = new Date(y, m - 1, 1);
  const to = new Date(y, m, 0, 23, 59, 59);
  const expected = Number(process.env.PONTO_JORNADA_DIARIA_MIN ?? 480);

  // Quais usuários
  let userIds: string[] = [];
  if (all) {
    const users = await prisma.user.findMany({ where: { status: "ATIVO" }, select: { id: true } });
    userIds = users.map((u) => u.id);
  } else if (userId) {
    userIds = [userId];
  } else {
    userIds = [session.user.id];
  }

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    include: {
      jobRole: true,
      department: true,
      timeEntries: {
        where: { timestamp: { gte: from, lte: to } },
        orderBy: { timestamp: "asc" },
      },
    },
  });

  // Geramos um CSV consolidado: uma linha por dia por colaborador
  const header = [
    "colaborador",
    "cargo",
    "departamento",
    "data",
    "batidas",
    "trabalhado_min",
    "trabalhado_hhmm",
    "esperado_min",
    "extra_min",
    "extra_hhmm",
    "extra_taxa",
    "falta_min",
    "inconsistencias",
  ];

  const rows: (string | number)[][] = [header];

  for (const u of users) {
    const summary = summarizePeriod(u.timeEntries, {
      from, to, expectedMinutes: expected,
    });
    for (const d of summary.days) {
      const batidas = d.entries.length === 0
        ? ""
        : d.entries.map((e) =>
            `${typeLabel(e.type)} ${new Date(e.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
          ).join(" | ");

      rows.push([
        u.name,
        u.jobRole?.name ?? "",
        u.department?.name ?? "",
        d.date,
        batidas,
        d.workedMinutes,
        formatMinutes(d.workedMinutes),
        d.expectedMinutes,
        d.overtimeMinutes,
        formatMinutes(d.overtimeMinutes),
        `${Math.round(d.overtimeRate * 100)}%`,
        d.shortageMinutes,
        d.inconsistencies.join(" / "),
      ]);
    }
    // Linha de totais
    rows.push([
      u.name + " — TOTAL",
      "",
      "",
      `${y}-${String(m).padStart(2, "0")}`,
      "",
      summary.totals.workedMinutes,
      formatMinutes(summary.totals.workedMinutes),
      "",
      summary.totals.overtimeMinutes,
      formatMinutes(summary.totals.overtimeMinutes),
      `50%: ${formatMinutes(summary.totals.overtime50Minutes)} / 100%: ${formatMinutes(summary.totals.overtime100Minutes)}`,
      summary.totals.shortageMinutes,
      summary.totals.inconsistencies,
    ]);
  }

  const csv = "﻿" + rowsToCsv(rows); // BOM para Excel reconhecer UTF-8
  const filename = all
    ? `ponto-${mes}-todos.csv`
    : userId
    ? `ponto-${mes}-${userId.slice(0, 8)}.csv`
    : `ponto-${mes}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
