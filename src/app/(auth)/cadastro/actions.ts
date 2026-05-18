"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isValidCPF, onlyDigits } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  cpf: z.string(),
  phone: z.string().optional(),
  password: z.string().min(6),
});

export async function cadastroAction(input: z.infer<typeof schema>) {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: "Dados inválidos." };

  const cpf = onlyDigits(parsed.data.cpf);
  if (!isValidCPF(cpf)) return { error: "CPF inválido." };

  const email = parsed.data.email.toLowerCase();

  const exists = await prisma.user.findFirst({
    where: { OR: [{ email }, { cpf }] },
  });
  if (exists) return { error: "Já existe um cadastro com esse e-mail ou CPF." };

  const hash = await bcrypt.hash(parsed.data.password, 10);

  await prisma.user.create({
    data: {
      name: parsed.data.name.trim(),
      email,
      cpf,
      phone: parsed.data.phone?.trim() || null,
      password: hash,
      status: "PENDENTE",
      systemRole: "COLABORADOR",
    },
  });

  return { ok: true as const };
}
