import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import Link from "next/link";
import { Download } from "lucide-react";

export default async function RelatoriosPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasPermission(session.user.permissions, PERMISSIONS.PONTO_EXPORTAR)) redirect("/dashboard");

  const users = await prisma.user.findMany({
    where: { status: "ATIVO" },
    orderBy: { name: "asc" },
  });

  const now = new Date();
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  return (
    <>
      <Topbar title="Relatórios" subtitle="Exportações de ponto eletrônico." />
      <div className="p-8 space-y-6">
        <div className="card">
          <h3 className="font-semibold">Exportar ponto do mês (todos)</h3>
          <p className="text-sm text-gray-500 mb-4">
            CSV consolidado de todos os colaboradores no mês selecionado.
          </p>
          <form method="GET" action="/api/relatorios/ponto" className="flex flex-wrap items-end gap-3">
            <div>
              <label className="label">Mês</label>
              <input type="month" name="mes" defaultValue={monthStr} className="input w-44" required />
            </div>
            <input type="hidden" name="all" value="1" />
            <button type="submit" className="btn-primary">
              <Download className="h-4 w-4" /> Baixar CSV
            </button>
          </form>
        </div>

        <div className="card">
          <h3 className="font-semibold">Exportar ponto por colaborador</h3>
          <p className="text-sm text-gray-500 mb-4">CSV detalhado das batidas de um colaborador.</p>
          <form method="GET" action="/api/relatorios/ponto" className="flex flex-wrap items-end gap-3">
            <div>
              <label className="label">Colaborador</label>
              <select name="userId" className="input min-w-[240px]" required>
                <option value="">— selecione —</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Mês</label>
              <input type="month" name="mes" defaultValue={monthStr} className="input w-44" required />
            </div>
            <button type="submit" className="btn-primary">
              <Download className="h-4 w-4" /> Baixar CSV
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
