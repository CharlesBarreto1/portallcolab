"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Clock, Users, Briefcase, GraduationCap, Newspaper,
  FolderClosed, Settings, ChevronDown, ShieldCheck, FileText
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { PERMISSIONS } from "@/lib/permissions";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
  badge?: string;
};

const mainNav: NavItem[] = [
  { href: "/dashboard", label: "Início", icon: Home },
  { href: "/ponto", label: "Meu ponto", icon: Clock, permission: PERMISSIONS.PONTO_VER_PROPRIO },
  { href: "/rh", label: "RH", icon: Briefcase, permission: PERMISSIONS.RH_VER, badge: "em breve" },
  { href: "/faculdade", label: "Faculdade", icon: GraduationCap, permission: PERMISSIONS.FACULDADE_VER, badge: "em breve" },
  { href: "/novidades", label: "Novidades", icon: Newspaper, permission: PERMISSIONS.NOVIDADES_VER, badge: "em breve" },
  { href: "/documentos", label: "Documentos", icon: FolderClosed, permission: PERMISSIONS.DOCUMENTOS_VER_PROPRIOS, badge: "em breve" },
];

const adminNav: NavItem[] = [
  { href: "/admin/usuarios", label: "Usuários", icon: Users, permission: PERMISSIONS.ADMIN_USUARIOS },
  { href: "/admin/cargos", label: "Cargos & permissões", icon: ShieldCheck, permission: PERMISSIONS.ADMIN_CARGOS },
  { href: "/admin/departamentos", label: "Departamentos", icon: Briefcase, permission: PERMISSIONS.ADMIN_DEPARTAMENTOS },
  { href: "/admin/pontos", label: "Pontos de todos", icon: Clock, permission: PERMISSIONS.PONTO_VER_TODOS },
  { href: "/admin/relatorios", label: "Relatórios", icon: FileText, permission: PERMISSIONS.PONTO_EXPORTAR },
];

export function Sidebar({
  permissions,
  isAdmin,
  user,
}: {
  permissions: string[];
  isAdmin: boolean;
  user: { name?: string | null; email?: string | null; jobRoleName: string | null };
}) {
  const pathname = usePathname();
  const [openAdmin, setOpenAdmin] = useState(true);

  function canSee(item: NavItem) {
    if (!item.permission) return true;
    return permissions.includes(item.permission);
  }

  return (
    <aside className="w-64 shrink-0 border-r border-gray-100 bg-white flex flex-col">
      <div className="px-6 py-5 border-b border-gray-100">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-brand-600 text-white grid place-items-center font-black">Z</div>
          <span className="font-bold tracking-tight">Zux Portal</span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div className="space-y-1">
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Geral</p>
          {mainNav.filter(canSee).map((item) => (
            <NavLink key={item.href} item={item} active={pathname === item.href || pathname.startsWith(item.href + "/")} />
          ))}
        </div>

        {isAdmin && (
          <div className="space-y-1">
            <button
              onClick={() => setOpenAdmin((v) => !v)}
              className="px-3 w-full flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-600"
            >
              Administração
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", !openAdmin && "-rotate-90")} />
            </button>
            {openAdmin && adminNav.filter(canSee).map((item) => (
              <NavLink key={item.href} item={item} active={pathname.startsWith(item.href)} />
            ))}
          </div>
        )}
      </nav>

      <div className="border-t border-gray-100 p-4">
        <Link href="/perfil" className="flex items-center gap-3 rounded-lg p-2 hover:bg-gray-50">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 grid place-items-center text-white text-sm font-semibold">
            {(user.name ?? user.email ?? "?").slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{user.name ?? user.email}</p>
            <p className="text-xs text-gray-500 truncate">{user.jobRoleName ?? "Sem cargo"}</p>
          </div>
          <Settings className="h-4 w-4 text-gray-400 ml-auto shrink-0" />
        </Link>
      </div>
    </aside>
  );
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active ? "bg-brand-50 text-brand-700" : "text-gray-700 hover:bg-gray-50"
      )}
    >
      <Icon className={cn("h-4 w-4", active ? "text-brand-600" : "text-gray-400")} />
      <span className="flex-1">{item.label}</span>
      {item.badge && (
        <span className="text-[10px] uppercase tracking-wide text-amber-700 bg-amber-50 rounded px-1.5 py-0.5">
          {item.badge}
        </span>
      )}
    </Link>
  );
}
