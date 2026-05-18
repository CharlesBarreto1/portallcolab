import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Topbar } from "@/components/layout/topbar";
import { formatMinutes } from "@/lib/utils";
import { summarizePeriod } from "@/lib/ponto";
import Link from "next/link";
import { Clock, Users, AlertCircle, TrendingUp } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) return null;

  // KPIs do mês corrente para o colaborador
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [myEntries, pendingApprovals] = await Promise.all([
    prisma.timeEntry.findMany({
      where: {
        userId: session.user.id,
        timestamp: { gte: monthStart, lte: monthEnd },
      },
      orderBy: { timestamp: "asc" },
      select: { id: true, timestamp: true, type: true },
    }),
    session.user.systemRole === "ADMIN"
      ? prisma.user.count({ where: { status: "PENDENTE" } })
      : Promise.resolve(0),
  ]);

  const expectedDaily = Number(process.env.PONTO_JORNADA_DIARIA_MIN ?? 480);
  const summary = summarizePeriod(myEntries, {
    from: monthStart,
    to: monthEnd,
    expectedMinutes: expectedDaily,
  });

  return (
    <>
      <Topbar
        title={`Olá, ${session.user.name?.split(" ")[0] ?? "colaborador"}!`}
        subtitle="Aqui está um resumo do seu mês."
      />
      <div className="p-8 space-y-8">
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            icon={<Clock className="h-5 w-5 text-brand-600" />}
            label="Horas trabalhadas"
            value={formatMinutes(summary.totals.workedMinutes)}
            hint="No mês corrente"
          />
          <KpiCard
            icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
            label="Horas extras"
            value={formatMinutes(summary.totals.overtimeMinutes)}
            hint={`50%: ${formatMinutes(summary.totals.overtime50Minutes)} · 100%: ${formatMinutes(summary.totals.overtime100Minutes)}`}
          />
          <KpiCard
            icon={<AlertCircle className="h-5 w-5 text-amber-600" />}
            label="Inconsistências"
            value={String(summary.totals.inconsistencies)}
            hint="Batidas com problema"
          />
          {session.user.systemRole === "ADMIN" && (
            <KpiCard
              icon={<Users className="h-5 w-5 text-purple-600" />}
              label="Cadastros pendentes"
              value={String(pendingApprovals)}
              hint="Aguardando aprovação"
              href="/admin/usuarios"
            />
          )}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card lg:col-span-2">
            <h3 className="font-semibold mb-1">Bater ponto agora</h3>
            <p className="text-sm text-gray-500 mb-4">Registre sua entrada, intervalo ou saída.</p>
            <Link href="/ponto" className="btn-primary">
              <Clock className="h-4 w-4" /> Ir para meu ponto
            </Link>
          </div>
          <div className="card">
            <h3 className="font-semibold mb-1">Seu cargo</h3>
            <p className="text-sm text-gray-500 mb-4">Cargo atual e permissões.</p>
            <p className="font-medium">{session.user.jobRoleName ?? "Sem cargo atribuído"}</p>
            <p className="text-xs text-gray-500 mt-1">{session.user.permissions.length} permissões ativas</p>
          </div>
        </section>
      </div>
    </>
  );
}

function KpiCard({
  icon,
  label,
  value,
  hint,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  href?: string;
}) {
  const content = (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-gray-50 grid place-items-center">{icon}</div>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
      <p className="text-2xl font-bold mt-3">{value}</p>
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}
