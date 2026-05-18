"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatCPF } from "@/lib/utils";
import { CheckCircle2, Loader2, UserCheck, UserX } from "lucide-react";
import { aprovarUsuario, atualizarUsuario, definirStatus } from "./actions";

type UserRow = {
  id: string;
  name: string;
  email: string;
  cpf: string | null;
  status: string;
  systemRole: string;
  jobRoleId: string | null;
  jobRoleName: string | null;
  departmentId: string | null;
  departmentName: string | null;
  createdAt: string;
};

type Role = { id: string; name: string };
type Department = { id: string; name: string };

export function UsuariosTable({
  users,
  roles,
  departments,
}: {
  users: UserRow[];
  roles: Role[];
  departments: Department[];
}) {
  const [filter, setFilter] = useState<"PENDENTE" | "ATIVO" | "INATIVO" | "TODOS">("PENDENTE");
  const filtered = users.filter((u) => filter === "TODOS" || u.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {(["PENDENTE", "ATIVO", "INATIVO", "TODOS"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              filter === f ? "bg-brand-600 text-white" : "bg-white border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {f === "PENDENTE" ? "Pendentes" : f === "ATIVO" ? "Ativos" : f === "INATIVO" ? "Inativos" : "Todos"}
            <span className={`ml-2 text-xs ${filter === f ? "text-white/80" : "text-gray-500"}`}>
              {f === "TODOS" ? users.length : users.filter((u) => u.status === f).length}
            </span>
          </button>
        ))}
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50/60">
            <tr className="text-left text-xs text-gray-500 uppercase tracking-wide">
              <th className="py-3 px-4 font-medium">Colaborador</th>
              <th className="py-3 px-4 font-medium">CPF</th>
              <th className="py-3 px-4 font-medium">Cargo</th>
              <th className="py-3 px-4 font-medium">Departamento</th>
              <th className="py-3 px-4 font-medium">Papel</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-gray-500">
                  Nenhum usuário neste filtro.
                </td>
              </tr>
            )}
            {filtered.map((u) => (
              <UsuarioRow key={u.id} user={u} roles={roles} departments={departments} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UsuarioRow({
  user,
  roles,
  departments,
}: {
  user: UserRow;
  roles: Role[];
  departments: Department[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(user.status === "PENDENTE");
  const [jobRoleId, setJobRoleId] = useState(user.jobRoleId ?? "");
  const [departmentId, setDepartmentId] = useState(user.departmentId ?? "");
  const [systemRole, setSystemRole] = useState(user.systemRole);
  const [isPending, startTransition] = useTransition();

  function handleApprove() {
    if (!jobRoleId) {
      alert("Atribua um cargo antes de aprovar.");
      return;
    }
    startTransition(async () => {
      await aprovarUsuario({
        userId: user.id,
        jobRoleId,
        departmentId: departmentId || null,
        systemRole,
      });
      router.refresh();
    });
  }

  function handleSave() {
    startTransition(async () => {
      await atualizarUsuario({
        userId: user.id,
        jobRoleId: jobRoleId || null,
        departmentId: departmentId || null,
        systemRole,
      });
      setEditing(false);
      router.refresh();
    });
  }

  function handleStatus(status: "ATIVO" | "INATIVO" | "BLOQUEADO") {
    startTransition(async () => {
      await definirStatus({ userId: user.id, status });
      router.refresh();
    });
  }

  return (
    <tr className="border-t border-gray-100">
      <td className="py-3 px-4">
        <div className="font-medium">{user.name}</div>
        <div className="text-xs text-gray-500">{user.email}</div>
      </td>
      <td className="py-3 px-4 text-gray-700">{formatCPF(user.cpf)}</td>
      <td className="py-3 px-4">
        {editing ? (
          <select className="input py-1" value={jobRoleId} onChange={(e) => setJobRoleId(e.target.value)}>
            <option value="">— sem cargo —</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        ) : (
          user.jobRoleName ?? <span className="text-gray-400">—</span>
        )}
      </td>
      <td className="py-3 px-4">
        {editing ? (
          <select className="input py-1" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
            <option value="">—</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        ) : (
          user.departmentName ?? <span className="text-gray-400">—</span>
        )}
      </td>
      <td className="py-3 px-4">
        {editing ? (
          <select className="input py-1" value={systemRole} onChange={(e) => setSystemRole(e.target.value)}>
            <option value="COLABORADOR">Colaborador</option>
            <option value="GESTOR">Gestor</option>
            <option value="RH">RH</option>
            <option value="ADMIN">Admin</option>
          </select>
        ) : (
          <span className="badge-blue">{user.systemRole}</span>
        )}
      </td>
      <td className="py-3 px-4">
        <StatusBadge status={user.status} />
      </td>
      <td className="py-3 px-4 text-right">
        <div className="flex items-center gap-2 justify-end">
          {user.status === "PENDENTE" ? (
            <>
              <button onClick={handleApprove} disabled={isPending} className="btn-primary py-1.5 px-3">
                {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserCheck className="h-3.5 w-3.5" />}
                Aprovar
              </button>
              <button
                onClick={() => handleStatus("BLOQUEADO")}
                disabled={isPending}
                className="btn-ghost py-1.5 px-3 text-red-600 hover:bg-red-50"
              >
                <UserX className="h-3.5 w-3.5" />
                Recusar
              </button>
            </>
          ) : editing ? (
            <>
              <button onClick={handleSave} disabled={isPending} className="btn-primary py-1.5 px-3">
                {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                Salvar
              </button>
              <button onClick={() => setEditing(false)} className="btn-ghost py-1.5 px-3">
                Cancelar
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)} className="btn-secondary py-1.5 px-3">
                Editar
              </button>
              {user.status === "ATIVO" ? (
                <button
                  onClick={() => handleStatus("INATIVO")}
                  disabled={isPending}
                  className="btn-ghost py-1.5 px-3 text-gray-600"
                >
                  Inativar
                </button>
              ) : (
                <button
                  onClick={() => handleStatus("ATIVO")}
                  disabled={isPending}
                  className="btn-ghost py-1.5 px-3 text-emerald-700"
                >
                  Reativar
                </button>
              )}
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "ATIVO": return <span className="badge-green">Ativo</span>;
    case "PENDENTE": return <span className="badge-yellow">Pendente</span>;
    case "INATIVO": return <span className="badge-gray">Inativo</span>;
    case "BLOQUEADO": return <span className="badge-red">Bloqueado</span>;
    default: return <span className="badge-gray">{status}</span>;
  }
}
