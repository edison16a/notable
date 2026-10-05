"use client";

import type { ReactNode } from "react";
import { MenuIcon, SidebarIcon } from "@/components/icons/interface";
import { IconButton } from "@/components/ui/IconButton";
import { ancestorIds } from "@/features/tabs/lib/tree";
import { displayTitle } from "@/features/tabs/lib/title";
import { useTabsStore } from "@/features/tabs/store";
import { shortcutLabel } from "../shortcuts";
import { useUiStore } from "../uiStore";

/**
 * The thin bar above the editor. On phones it holds the drawer button and the
 * parent tab's name, so you know where you are in the tree. On desktop it is
 * empty unless the sidebar is hidden. `actions` sits on the right.
 */
export function TopBar({ actions }: { actions?: ReactNode }) {
  const { sidebarHidden, toggleSidebar, setDrawerOpen } = useUiStore();
  const parentTitle = useTabsStore((state) => {
    if (!state.activeId) return null;
    const parentId = ancestorIds(state.tabs, state.activeId).at(-1);
    const parent = state.tabs.find((tab) => tab.id === parentId);
    return parent ? displayTitle(parent.title) : null;
  });

  return (
    <div className="flex h-12 shrink-0 items-center gap-1 px-3 pt-[env(safe-area-inset-top)] md:h-14 md:px-4">
      <div className="flex items-center gap-1 md:hidden">
        <IconButton label="Open sidebar" onClick={() => setDrawerOpen(true)}>
          <MenuIcon />
        </IconButton>
        <span className="truncate text-[13px] text-muted">{parentTitle ?? "Notable"}</span>
      </div>
      {sidebarHidden && (
        <IconButton label={`Show sidebar (${shortcutLabel("\\")})`} onClick={toggleSidebar} className="max-md:hidden">
          <SidebarIcon />
        </IconButton>
      )}
      <div className="ml-auto flex items-center gap-1">{actions}</div>
    </div>
  );
}
