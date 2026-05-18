"use client";

import { Bell, LogOut } from "lucide-react";
import { signOutAction } from "./actions";

export function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="border-b border-gray-100 bg-white px-8 py-4 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        <button className="btn-ghost h-9 w-9 p-0">
          <Bell className="h-4 w-4" />
        </button>
        <form action={signOutAction}>
          <button type="submit" className="btn-ghost">
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </form>
      </div>
    </header>
  );
}
