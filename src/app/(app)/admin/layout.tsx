import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const isAdminLike =
    session.user.systemRole === "ADMIN" ||
    session.user.systemRole === "RH" ||
    session.user.permissions.some((p) => p.startsWith("admin.") || p === "ponto.ver_todos");

  if (!isAdminLike) redirect("/dashboard");

  return <>{children}</>;
}
