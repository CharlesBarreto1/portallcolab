import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { summarizePeriod } from "@/lib/ponto";
import { formatMinutes } from "@/lib/utils";
import Link from "next/link";
import { Download } from "lucide-react";

export default async function PontosAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; userId?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasPermission(session.user.permissions, PERMISSIONS.PONTO_VER_TODOS)) redirect("/dashboard");

  const sp = await searchParams;
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth();
  if (sp.mes) {
    const [y, m] = sp.mes.split("-").map(Number);
    if (y && m) {
      year = y;
      month = m - 1;
    }
  }
  const periodStart = new Date(year, month, 1);
  const periodEnd = new Date(year, month + 1, 0, 23, 59, 59);

  const users = await prisma.user.findMany({
    where: { status: "ATIVO" },
    orderBy: { name: "asc" },
    include: {
      timeEntries: {
        where: { timestamp: { gte: periodStart, lte: periodEnd } },
        orderBy: { timestamp: "asc" },
        select: { id: true, timestamp: true, type: true },
      },
      jobRole: true,
      department: true,
    },
  });

  const expected = Number(process.env.PONTO_JORNADA_DIARIA_MIN ?? 480);
  const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;

  const rows = users.map((u) => {
    const sum = summarizePeriod(u.timeEntries, {
      from: periodStart,
      to: periodEnd,
      expectedMinutes: expected,
    });
    return {
      id: u.id,
      name: u.name,
      jobRole: u.jobRole?.name ?? "—",
      department: u.department?.name ?? "—",
      worked: sum.totals.workedMinutes,
      overtime50: sum.totals.overtime50Minutes,
      overtime100: sum.totals.overtime100Minutes,
      shortage: sum.totals.shortageMinutes,
      inconsistencies: sum.totals.inconsistencies,
    };
  });

  return (
    <>
      <Topbar title="Pontos de todos" subtitle="Visão consolidada do mês de todos os colaboradores." />
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <MonthPicker year={year} month={month + 1} />
          <Link href={`/api/relatorios/ponto?mes=${monthStr}&all=1`} className="btn-secondary">
            <Download className="h-4 w-4" /> Exportar CSV do mês
          </Link>
        </div>

        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/60">
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wide">
                <th className="py-3 px-4 font-medium">Colaborador</th>
                <th className="py-3 px-4 font-medium">Cargo</th>
                <th className="py-3 px-4 font-medium">Departamento</th>
                <th className="py-3 px-4 font-medium text-right">Trabalhado</th>
                <th className="py-3 px-4 font-medium text-right">HE 50%</th>
                <th className="py-3 px-4 font-medium text-right">HE 100%</th>
                <th className="py-3 px-4 font-medium text-right">Falta</th>
                <th className="py-3 px-4 font-medium text-center">Alertas</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50/50">
                  <td className="py-3 px-4 font-medium">{r.name}</td>
                  <td className="py-3 px-4 text-gray-700">{r.jobRole}</td>
                  <td className="py-3 px-4 text-gray-700">{r.department}</td>
                  <td className="py-3 px-4 text-right tabular-nums">{formatMinutes(r.worked)}</td>
                  <td className="py-3 px-4 text-right tabular-nums text-emerald-700">{formatMinutes(r.overtime50)}</td>
                  <td className="py-3 px-4 text-right tabular-nums text-purple-700">{formatMinutes(r.overtime100)}</td>
                  <td className="py-3 px-4 text-right tabular-nums text-amber-700">{formatMinutes(r.shortage)}</td>
                  <td className="py-3 px-4 text-center">
                    {r.inconsistencies > 0 ? <span className="badge-yellow">{r.inconsistencies}</span> : <span className="text-gray-400">—</span>}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={8} className="py-12 text-center text-gray-500">Nenhum colaborador ativo no período.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function MonthPicker({ year, month }: { year: number; month: number }) {
  const monthStr = `${year}-${String(month).padStart(2, "0")}`;
  return (
    <form method="GET" className="flex items-center gap-2">
      <label className="text-sm text-gray-500">Mês:</label>
      <input
        type="month"
        name="mes"
        defaultValue={monthStr}
        className="input w-44"
        onChange={(e) => (e.target.form as HTMLFormElement).submit()}
      />
    </form>
  );
}
