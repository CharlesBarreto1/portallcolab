import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { PontoCard } from "./ponto-card";
import { PontoHistorico } from "./ponto-historico";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { summarizePeriod } from "@/lib/ponto";
import { formatMinutes } from "@/lib/utils";

export default async function PontoPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (!hasPermission(session.user.permissions, PERMISSIONS.PONTO_VER_PROPRIO)) {
    return (
      <>
        <Topbar title="Meu ponto" />
        <div className="p-8">
          <p className="text-sm text-gray-600">Você não tem permissão para visualizar o ponto.</p>
        </div>
      </>
    );
  }

  const sp = await searchParams;
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth(); // 0-11
  if (sp.mes) {
    const [y, m] = sp.mes.split("-").map(Number);
    if (y && m) {
      year = y;
      month = m - 1;
    }
  }
  const periodStart = new Date(year, month, 1);
  const periodEnd = new Date(year, month + 1, 0, 23, 59, 59);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [todayEntries, periodEntries, holidays] = await Promise.all([
    prisma.timeEntry.findMany({
      where: {
        userId: session.user.id,
        timestamp: { gte: todayStart, lte: todayEnd },
      },
      orderBy: { timestamp: "asc" },
    }),
    prisma.timeEntry.findMany({
      where: {
        userId: session.user.id,
        timestamp: { gte: periodStart, lte: periodEnd },
      },
      orderBy: { timestamp: "asc" },
    }),
    prisma.holiday.findMany({
      where: { date: { gte: periodStart, lte: periodEnd } },
    }),
  ]);

  const holidaySet = new Set(holidays.map((h) => h.date.toISOString().slice(0, 10)));
  const expectedDaily = Number(process.env.PONTO_JORNADA_DIARIA_MIN ?? 480);

  const summary = summarizePeriod(periodEntries, {
    from: periodStart,
    to: periodEnd,
    expectedMinutes: expectedDaily,
    holidays: holidaySet,
  });

  return (
    <>
      <Topbar title="Meu ponto" subtitle="Registre suas batidas e acompanhe seu histórico." />
      <div className="p-8 space-y-8">
        <PontoCard
          todayEntries={todayEntries.map((e) => ({
            id: e.id,
            type: e.type,
            timestamp: e.timestamp.toISOString(),
          }))}
        />

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Kpi label="Trabalhado no mês" value={formatMinutes(summary.totals.workedMinutes)} />
          <Kpi label="Horas extras (50%)" value={formatMinutes(summary.totals.overtime50Minutes)} />
          <Kpi label="Horas extras (100%)" value={formatMinutes(summary.totals.overtime100Minutes)} />
          <Kpi label="Faltas / atrasos" value={formatMinutes(summary.totals.shortageMinutes)} />
        </section>

        <PontoHistorico
          summary={summary}
          year={year}
          month={month + 1}
        />
      </div>
    </>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="card">
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold mt-2">{value}</p>
    </div>
  );
}
