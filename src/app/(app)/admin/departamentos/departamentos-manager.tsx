"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { criarDepartamento, excluirDepartamento } from "./actions";

export function DepartamentosManager({
  departments,
}: {
  departments: { id: string; name: string; usersCount: number }[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleAdd() {
    if (!name.trim()) return;
    startTransition(async () => {
      await criarDepartamento(name);
      setName("");
      router.refresh();
    });
  }

  function handleDelete(id: string, usersCount: number) {
    if (usersCount > 0) return alert("Departamento possui colaboradores.");
    if (!confirm("Excluir departamento?")) return;
    startTransition(async () => {
      await excluirDepartamento(id);
      router.refresh();
    });
  }

  return (
    <div className="grid md:grid-cols-2 gap-6 max-w-3xl">
      <div className="card">
        <h3 className="font-semibold mb-3">Novo departamento</h3>
        <div className="flex gap-2">
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Tecnologia"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <button onClick={handleAdd} disabled={isPending} className="btn-primary">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Adicionar
          </button>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-3">Existentes</h3>
        {departments.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhum departamento cadastrado.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {departments.map((d) => (
              <li key={d.id} className="py-2 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{d.name}</p>
                  <p className="text-xs text-gray-500">{d.usersCount} colaborador(es)</p>
                </div>
                <button
                  onClick={() => handleDelete(d.id, d.usersCount)}
                  className="btn-ghost text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
