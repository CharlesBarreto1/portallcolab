/**
 * Seed inicial do Zux Portal:
 * - Cria o catálogo de permissões
 * - Cria um Admin padrão
 * - Cria cargos básicos (Analista, Gestor RH, Desenvolvedor)
 * - Cria departamentos básicos
 * - Cria um colaborador de exemplo
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PERMISSION_CATALOG, PERMISSIONS } from "../src/lib/permissions";

const prisma = new PrismaClient();

async function main() {
  console.log("→ Sincronizando catálogo de permissões…");
  for (const p of PERMISSION_CATALOG) {
    await prisma.permission.upsert({
      where: { key: p.key },
      update: { label: p.label, description: p.description, module: p.module },
      create: { key: p.key, label: p.label, description: p.description, module: p.module },
    });
  }

  console.log("→ Criando departamentos…");
  const depts = [
    { name: "Diretoria" },
    { name: "RH" },
    { name: "Tecnologia" },
    { name: "Comercial" },
    { name: "Operações" },
  ];
  for (const d of depts) {
    await prisma.department.upsert({
      where: { name: d.name },
      update: {},
      create: d,
    });
  }

  console.log("→ Criando cargos padrão…");
  const allPerms = await prisma.permission.findMany();
  const byKey = new Map(allPerms.map((p) => [p.key, p]));

  async function upsertRole(name: string, description: string, keys: string[]) {
    const role = await prisma.jobRole.upsert({
      where: { name },
      update: { description },
      create: { name, description },
    });
    await prisma.jobRole.update({
      where: { id: role.id },
      data: {
        permissions: {
          set: keys.map((k) => ({ id: byKey.get(k)!.id })).filter(Boolean),
        },
      },
    });
    return role;
  }

  await upsertRole("Administrador", "Acesso total ao sistema", Object.values(PERMISSIONS));
  await upsertRole("Gestor de RH", "Gestão de RH, documentos e comunicação", [
    PERMISSIONS.PONTO_REGISTRAR,
    PERMISSIONS.PONTO_VER_PROPRIO,
    PERMISSIONS.PONTO_VER_TODOS,
    PERMISSIONS.PONTO_EXPORTAR,
    PERMISSIONS.PONTO_AJUSTAR,
    PERMISSIONS.RH_VER, PERMISSIONS.RH_UPLOAD, PERMISSIONS.RH_GERENCIAR,
    PERMISSIONS.NOVIDADES_VER, PERMISSIONS.NOVIDADES_PUBLICAR,
    PERMISSIONS.FACULDADE_VER, PERMISSIONS.FACULDADE_GERENCIAR,
    PERMISSIONS.DOCUMENTOS_VER_TODOS, PERMISSIONS.DOCUMENTOS_GERENCIAR,
  ]);
  await upsertRole("Gestor", "Gestor de equipe", [
    PERMISSIONS.PONTO_REGISTRAR,
    PERMISSIONS.PONTO_VER_PROPRIO,
    PERMISSIONS.PONTO_VER_TODOS,
    PERMISSIONS.PONTO_EXPORTAR,
    PERMISSIONS.RH_VER,
    PERMISSIONS.NOVIDADES_VER,
    PERMISSIONS.FACULDADE_VER,
    PERMISSIONS.DOCUMENTOS_VER_PROPRIOS,
  ]);
  await upsertRole("Colaborador", "Acesso padrão do colaborador", [
    PERMISSIONS.PONTO_REGISTRAR,
    PERMISSIONS.PONTO_VER_PROPRIO,
    PERMISSIONS.RH_VER,
    PERMISSIONS.NOVIDADES_VER,
    PERMISSIONS.FACULDADE_VER,
    PERMISSIONS.DOCUMENTOS_VER_PROPRIOS,
  ]);

  console.log("→ Criando usuário administrador…");
  const adminRole = await prisma.jobRole.findUnique({ where: { name: "Administrador" } });
  const diretoria = await prisma.department.findUnique({ where: { name: "Diretoria" } });

  const adminEmail = "admin@zux.com.br";
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: await bcrypt.hash("admin123", 10),
      name: "Administrador Zux",
      cpf: "00000000000",
      status: "ATIVO",
      systemRole: "ADMIN",
      jobRoleId: adminRole?.id,
      departmentId: diretoria?.id,
      hireDate: new Date(),
      approvedAt: new Date(),
    },
  });

  console.log("→ Criando colaborador de exemplo…");
  const colabRole = await prisma.jobRole.findUnique({ where: { name: "Colaborador" } });
  const tech = await prisma.department.findUnique({ where: { name: "Tecnologia" } });
  await prisma.user.upsert({
    where: { email: "colaborador@zux.com.br" },
    update: {},
    create: {
      email: "colaborador@zux.com.br",
      password: await bcrypt.hash("colab123", 10),
      name: "João da Silva",
      cpf: "12345678909",
      status: "ATIVO",
      systemRole: "COLABORADOR",
      jobRoleId: colabRole?.id,
      departmentId: tech?.id,
      hireDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365),
      approvedAt: new Date(),
    },
  });

  console.log("\n✓ Seed concluído!");
  console.log("\nAcessos de teste:");
  console.log("  Admin       → admin@zux.com.br        / admin123");
  console.log("  Colaborador → colaborador@zux.com.br  / colab123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
