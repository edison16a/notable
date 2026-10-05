"use client";

import { cn } from "@/lib/cn";
import { useUiStore } from "../uiStore";
import { Sidebar } from "./Sidebar";

/** On phones the sidebar slides over the editor instead of taking a column. */
export function MobileDrawer() {
  const { drawerOpen, setDrawerOpen } = useUiStore();
  const close = () => setDrawerOpen(false);

  return (
    <div className={cn("fixed inset-0 z-40 md:hidden", !drawerOpen && "pointer-events-none")} aria-hidden={!drawerOpen}>
      <div
        onClick={close}
        className={cn("absolute inset-0 bg-black/25 transition-opacity", drawerOpen ? "opacity-100" : "opacity-0")}
      />
      <aside
        className={cn(
          "absolute inset-y-0 left-0 w-[min(300px,85vw)] border-r border-line pt-[env(safe-area-inset-top)] shadow-xl transition-transform duration-200",
          drawerOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <Sidebar onClose={close} onNavigate={close} />
      </aside>
    </div>
  );
}
