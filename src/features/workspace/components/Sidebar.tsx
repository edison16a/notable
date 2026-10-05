"use client";

import { LogoMark } from "@/components/icons/brand";
import { PlusIcon, SearchIcon, SidebarIcon } from "@/components/icons/interface";
import { IconButton } from "@/components/ui/IconButton";
import { TabTree } from "@/features/tabs/components/TabTree";
import { useTabsStore } from "@/features/tabs/store";
import { shortcutLabel } from "../shortcuts";
import { useUiStore } from "../uiStore";
import { SidebarFooter } from "./SidebarFooter";

interface SidebarProps {
  /** Phones show the sidebar as a drawer, where "hide" means close the drawer. */
  onClose(): void;
  onNavigate?(): void;
}

/** The left panel: app name, the tab tree, and the save status. */
export function Sidebar({ onClose, onNavigate }: SidebarProps) {
  const addTab = useTabsStore((state) => state.addTab);
  const setSwitcherOpen = useUiStore((state) => state.setSwitcherOpen);

  return (
    <div className="flex h-full flex-col bg-panel">
      <header className="flex items-center gap-1 px-3 pb-2 pt-3">
        <div className="flex min-w-0 flex-1 items-center gap-2 px-1">
          <LogoMark size={16} />
          <span className="truncate text-[13px] font-semibold tracking-tight">Notable</span>
        </div>
        <IconButton label={`Search docs (${shortcutLabel("K")})`} onClick={() => setSwitcherOpen(true)}>
          <SearchIcon />
        </IconButton>
        <IconButton
          label="New tab (Alt+N)"
          onClick={() => {
            addTab(null);
            onNavigate?.();
          }}
        >
          <PlusIcon />
        </IconButton>
        <IconButton label={`Hide sidebar (${shortcutLabel("\\")})`} onClick={onClose}>
          <SidebarIcon />
        </IconButton>
      </header>

      <nav className="min-h-0 flex-1 overflow-y-auto px-2 py-1">
        <TabTree onNavigate={onNavigate} />
      </nav>

      <SidebarFooter />
    </div>
  );
}
