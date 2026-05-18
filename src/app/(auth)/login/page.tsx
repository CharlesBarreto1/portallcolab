import Link from "next/link";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div>
      <div className="lg:hidden mb-8 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-brand-600 text-white grid place-items-center font-black text-xl">
          Z
        </div>
        <span className="text-xl font-bold tracking-tight">Zux Portal</span>
      </div>
      <h2 className="text-2xl font-bold tracking-tight">Entrar na sua conta</h2>
      <p className="mt-1 text-sm text-gray-500">
        Use o e-mail cadastrado para acessar o portal.
      </p>
      <div className="mt-8">
        <LoginForm />
      </div>
      <p className="mt-6 text-center text-sm text-gray-600">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="font-medium text-brand-600 hover:underline">
          Criar cadastro
        </Link>
      </p>
    </div>
  );
}
