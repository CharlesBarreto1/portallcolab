"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2, Save } from "lucide-react";
import { criarCargo, atualizarCargo, excluirCargo } from "./actions";

type Role = {
  id: string;
  name: string;
  description: string | null;
  permissionKeys: string[];
  usersCount: number;
};

type CatalogItem = {
  key: string;
  label: string;
  description: string;
  module: string;
};

export function CargosManager({ roles, catalog }: { roles: Role[]; catalog: CatalogItem[] }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | "new" | null>(roles[0]?.id ?? null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [perms, setPerms] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const current = selectedId && selectedId !== "new"
    ? roles.find((r) => r.id === selectedId)
    : null;

  function select(id: string) {
    const r = roles.find((x) => x.id === id);
    if (r) {
      setSelectedId(r.id);
      setName(r.name);
      setDescription(r.description ?? "");
      setPerms(new Set(r.permissionKeys));
    }
  }

  function startNew() {
    setSelectedId("new");
    setName("");
    setDescription("");
    setPerms(new Set());
  }

  function togglePerm(key: string) {
    setPerms((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleModule(module: string) {
    const moduleKeys = catalog.filter((c) => c.module === module).map((c) => c.key);
    const allChecked = moduleKeys.every((k) => perms.has(k));
    setPerms((prev) => {
      const next = new Set(prev);
      if (allChecked) moduleKeys.forEach((k) => next.delete(k));
      else moduleKeys.forEach((k) => next.add(k));
      return next;
    });
  }

  function handleSave() {
    if (!name.trim()) return alert("Informe um nome.");
    const permArr = Array.from(perms);
    startTransition(async () => {
      if (selectedId === "new") {
        await criarCargo({ name, description, permissions: permArr });
      } else if (selectedId) {
        await atualizarCargo({ id: selectedId, name, description, permissions: permArr });
      }
      router.refresh();
    });
  }

  function handleDelete() {
    if (!current) return;
    if (current.usersCount > 0) return alert("Não é possível excluir um cargo com usuários atribuídos.");
    if (!confirm(`Excluir cargo "${current.name}"?`)) return;
    startTransition(async () => {
      await excluirCargo(current.id);
      setSelectedId(roles.find((r) => r.id !== current.id)?.id ?? null);
      router.refresh();
    });
  }

  const grouped = catalog.reduce((acc, c) => {
    (acc[c.module] ??= []).push(c);
    return acc;
  }, {} as Record<string, CatalogItem[]>);

  return (
    <div className="grid lg:grid-cols-[280px_1fr] gap-6">
      <aside className="card h-fit">
        <button onClick={startNew} className="btn-primary w-full mb-3">
          <Plus className="h-4 w-4" /> Novo cargo
        </button>
        <ul className="space-y-1">
          {roles.map((r) => (
            <li key={r.id}>
              <button
                onClick={() => select(r.id)}
                className={`w-full text-left rounded-lg px-3 py-2 text-sm flex items-center justify-between ${
                  selectedId === r.id ? "bg-brand-50 text-brand-700" : "hover:bg-gray-50"
                }`}
              >
                <span className="font-medium truncate">{r.name}</span>
                <span className="text-xs text-gray-500">{r.usersCount}</span>
              </button>
            </li>
          ))}
          {roles.length === 0 && (
            <p className="text-xs text-gray-500 text-center py-6">Nenhum cargo criado.</p>
          )}
        </ul>
      </aside>

      <div className="card">
        {!selectedId ? (
          <p className="text-sm text-gray-500">Selecione um cargo à esquerda ou crie um novo.</p>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Nome do cargo</label>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Analista de RH" />
              </div>
              <div>
                <label className="label">Descrição</label>
                <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Opcional" />
              </div>
            </div>

            <hr className="my-6 border-gray-100" />

            <h4 className="font-semibold mb-2">Permissões</h4>
            <p className="text-sm text-gray-500 mb-4">
              Marque o que este cargo pode fazer. As permissões somam-se às do papel de sistema do usuário.
            </p>

            <div className="space-y-5">
              {Object.entries(grouped).map(([module, items]) => {
                const allChecked = items.every((i) => perms.has(i.key));
                return (
                  <div key={module}>
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-sm font-semibold uppercase tracking-wide text-gray-500">{module}</h5>
                      <button
                        onClick={() => toggleModule(module)}
                        className="text-xs font-medium text-brand-600 hover:underline"
                      >
                        {allChecked ? "Desmarcar todos" : "Marcar todos"}
                      </button>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {items.map((p) => (
                        <label
                          key={p.key}
                          className={`flex items-start gap-2 rounded-lg border px-3 py-2 cursor-pointer transition-colors ${
                            perms.has(p.key) ? "border-brand-200 bg-brand-50/40" : "border-gray-100 hover:bg-gray-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={perms.has(p.key)}
                            onChange={() => togglePerm(p.key)}
                            className="mt-1"
                          />
                          <div>
                            <p className="text-sm font-medium">{p.label}</p>
                            <p className="text-xs text-gray-500">{p.description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              {current && (
                <button onClick={handleDelete} disabled={isPending} className="btn-ghost text-red-600 hover:bg-red-50">
                  <Trash2 className="h-4 w-4" /> Excluir
                </button>
              )}
              <button onClick={handleSave} disabled={isPending} className="btn-primary">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
