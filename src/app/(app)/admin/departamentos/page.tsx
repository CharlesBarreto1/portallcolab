import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { DepartamentosManager } from "./departamentos-manager";

export default async function DepartamentosPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasPermission(session.user.permissions, PERMISSIONS.ADMIN_DEPARTAMENTOS)) redirect("/dashboard");

  const departments = await prisma.department.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { users: true } } },
  });

  return (
    <>
      <Topbar title="Departamentos" subtitle="Organize seu time por áreas." />
      <div className="p-8">
        <DepartamentosManager
          departments={departments.map((d) => ({
            id: d.id,
            name: d.name,
            usersCount: d._count.users,
          }))}
        />
      </div>
    </>
  );
}
