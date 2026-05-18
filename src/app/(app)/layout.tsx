import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const isAdmin = session.user.systemRole === "ADMIN";

  return (
    <div className="min-h-screen flex">
      <Sidebar
        permissions={session.user.permissions}
        isAdmin={isAdmin}
        user={{
          name: session.user.name,
          email: session.user.email,
          jobRoleName: session.user.jobRoleName,
        }}
      />
      <main className="flex-1 flex flex-col min-w-0">{children}</main>
    </div>
  );
}
