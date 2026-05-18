import Link from "next/link";
import { CadastroForm } from "./cadastro-form";

export default function CadastroPage() {
  return (
    <div>
      <div className="lg:hidden mb-8 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-brand-600 text-white grid place-items-center font-black text-xl">
          Z
        </div>
        <span className="text-xl font-bold tracking-tight">Zux Portal</span>
      </div>
      <h2 className="text-2xl font-bold tracking-tight">Criar cadastro</h2>
      <p className="mt-1 text-sm text-gray-500">
        Após enviar, um administrador irá aprovar seu acesso e atribuir seu cargo.
      </p>
      <div className="mt-8">
        <CadastroForm />
      </div>
      <p className="mt-6 text-center text-sm text-gray-600">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-brand-600 hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
