import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { formatCPF } from "@/lib/utils";
import { PERMISSION_CATALOG } from "@/lib/permissions";

export default async function PerfilPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { jobRole: true, department: true },
  });
  if (!user) redirect("/login");

  const myPerms = new Set(session.user.permissions);

  return (
    <>
      <Topbar title="Meu perfil" subtitle="Seus dados, cargo e permissões." />
      <div className="p-8 grid lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 grid place-items-center text-white text-3xl font-semibold">
              {user.name.slice(0, 1).toUpperCase()}
            </div>
            <h3 className="mt-4 font-semibold text-lg">{user.name}</h3>
            <p className="text-sm text-gray-500">{user.email}</p>
            <span className="badge-blue mt-3">{user.jobRole?.name ?? user.systemRole}</span>
          </div>
          <dl className="mt-6 space-y-3 text-sm">
            <Row label="CPF" value={formatCPF(user.cpf)} />
            <Row label="Telefone" value={user.phone ?? "—"} />
            <Row label="Departamento" value={user.department?.name ?? "—"} />
            <Row label="Admissão" value={user.hireDate ? user.hireDate.toLocaleDateString("pt-BR") : "—"} />
            <Row label="Status" value={user.status} />
          </dl>
        </div>

        <div className="card lg:col-span-2">
          <h3 className="font-semibold mb-2">Minhas permissões</h3>
          <p className="text-sm text-gray-500 mb-4">
            Permissões herdadas do seu cargo e papel de sistema.
          </p>
          <div className="grid sm:grid-cols-2 gap-2">
            {PERMISSION_CATALOG.map((p) => (
              <div
                key={p.key}
                className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
                  myPerms.has(p.key) ? "border-emerald-100 bg-emerald-50/40" : "border-gray-100 bg-gray-50/40 opacity-60"
                }`}
              >
                <span className={`mt-1 h-2 w-2 rounded-full shrink-0 ${myPerms.has(p.key) ? "bg-emerald-500" : "bg-gray-300"}`} />
                <div>
                  <p className="font-medium text-gray-800">{p.label}</p>
                  <p className="text-xs text-gray-500">{p.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-800">{value}</dd>
    </div>
  );
}
