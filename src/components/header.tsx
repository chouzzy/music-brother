"use client";

import { History, LogOut } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { logout } from "@/app/actions";
import { HistoryDrawer } from "./history-drawer";

export function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between px-5 py-4 backdrop-blur-md">
        <Link href="/" className="group flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-violet-500 shadow-[0_0_20px_-4px_rgba(52,211,153,0.6)] transition-transform group-hover:scale-105">
            <span className="text-base font-bold text-zinc-950">♪</span>
          </div>
          <span className="text-base font-semibold tracking-tight">
            music <span className="gradient-text">brother</span>
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-100"
            title="Histórico"
          >
            <History className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">histórico</span>
          </button>
          <form action={logout}>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-100"
              title="Sair"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">sair</span>
            </button>
          </form>
        </div>
      </header>
      <HistoryDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
