"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

export async function loginAction(input: { email: string; password: string }) {
  try {
    await signIn("credentials", {
      email: input.email,
      password: input.password,
      redirect: false,
    });
    return { ok: true as const };
  } catch (e) {
    if (e instanceof AuthError) {
      const msg = (e.cause as { err?: Error })?.err?.message ?? e.message;
      if (msg.includes("aguardando aprovação")) {
        return { error: "Seu cadastro está aguardando aprovação do administrador." };
      }
      if (msg.includes("inativa")) {
        return { error: "Sua conta está inativa. Procure o administrador." };
      }
      return { error: "E-mail ou senha inválidos." };
    }
    return { error: "Erro inesperado ao entrar. Tente novamente." };
  }
}
