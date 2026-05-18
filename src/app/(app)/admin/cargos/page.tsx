import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { hasPermission, PERMISSIONS, PERMISSION_CATALOG } from "@/lib/permissions";
import { CargosManager } from "./cargos-manager";

export default async function CargosPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasPermission(session.user.permissions, PERMISSIONS.ADMIN_CARGOS)) redirect("/dashboard");

  const roles = await prisma.jobRole.findMany({
    include: { permissions: true, _count: { select: { users: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <Topbar title="Cargos & Permissões" subtitle="Crie cargos e defina o que cada um pode fazer." />
      <div className="p-8">
        <CargosManager
          roles={roles.map((r) => ({
            id: r.id,
            name: r.name,
            description: r.description,
            permissionKeys: r.permissions.map((p) => p.key),
            usersCount: r._count.users,
          }))}
          catalog={PERMISSION_CATALOG}
        />
      </div>
    </>
  );
}
