import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { UsuariosTable } from "./usuarios-table";

export default async function UsuariosPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasPermission(session.user.permissions, PERMISSIONS.ADMIN_USUARIOS)) {
    redirect("/dashboard");
  }

  const [users, roles, departments] = await Promise.all([
    prisma.user.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include: { jobRole: true, department: true },
    }),
    prisma.jobRole.findMany({ orderBy: { name: "asc" } }),
    prisma.department.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <>
      <Topbar
        title="Usuários"
        subtitle="Aprove cadastros, atribua cargos, departamentos e papel de sistema."
      />
      <div className="p-8">
        <UsuariosTable
          users={users.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            cpf: u.cpf,
            status: u.status,
            systemRole: u.systemRole,
            jobRoleId: u.jobRoleId,
            jobRoleName: u.jobRole?.name ?? null,
            departmentId: u.departmentId,
            departmentName: u.department?.name ?? null,
            createdAt: u.createdAt.toISOString(),
          }))}
          roles={roles}
          departments={departments}
        />
      </div>
    </>
  );
}
