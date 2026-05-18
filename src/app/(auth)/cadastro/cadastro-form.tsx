"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { cadastroAction } from "./actions";
import { CheckCircle2, Loader2 } from "lucide-react";

export function CadastroForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    cpf: "",
    phone: "",
    password: "",
    confirm: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.password !== form.confirm) {
      setError("As senhas não coincidem.");
      return;
    }
    startTransition(async () => {
      const result = await cadastroAction({
        name: form.name,
        email: form.email,
        cpf: form.cpf,
        phone: form.phone,
        password: form.password,
      });
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
      }
    });
  }

  if (success) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
        <h3 className="mt-3 font-semibold text-emerald-900">Cadastro enviado!</h3>
        <p className="mt-2 text-sm text-emerald-800">
          Seu acesso será liberado assim que o administrador aprovar.
        </p>
        <Link href="/login" className="btn-primary mt-6 inline-flex">
          Ir para login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="label">Nome completo</label>
        <input className="input" required value={form.name}
          onChange={(e) => update("name", e.target.value)} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">E-mail</label>
          <input className="input" type="email" required value={form.email}
            onChange={(e) => update("email", e.target.value)} />
        </div>
        <div>
          <label className="label">CPF</label>
          <input className="input" required value={form.cpf}
            placeholder="000.000.000-00"
            onChange={(e) => update("cpf", e.target.value)} />
        </div>
      </div>
      <div>
        <label className="label">Telefone</label>
        <input className="input" value={form.phone}
          placeholder="(11) 90000-0000"
          onChange={(e) => update("phone", e.target.value)} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Senha</label>
          <input className="input" type="password" required minLength={6} value={form.password}
            onChange={(e) => update("password", e.target.value)} />
        </div>
        <div>
          <label className="label">Confirmar senha</label>
          <input className="input" type="password" required minLength={6} value={form.confirm}
            onChange={(e) => update("confirm", e.target.value)} />
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <button type="submit" disabled={isPending} className="btn-primary w-full">
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Criar cadastro
      </button>
    </form>
  );
}
