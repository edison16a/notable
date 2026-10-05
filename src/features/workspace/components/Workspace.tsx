"use client";

import { DocEditor } from "@/features/editor/components/DocEditor";
import { QuickSwitcher } from "@/features/switcher/components/QuickSwitcher";
import { useTabsStore } from "@/features/tabs/store";
import { VoiceDock } from "@/features/voice-dock/VoiceDock";
import { useWorkspaceBoot } from "../hooks/useWorkspaceBoot";
import { useWorkspaceShortcuts } from "../hooks/useWorkspaceShortcuts";
import { useUiStore } from "../uiStore";
import { MobileDrawer } from "./MobileDrawer";
import { ResizeHandle } from "./ResizeHandle";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

/** The whole app: sidebar on the left, the editor filling the rest of the screen. */
export function Workspace() {
  useWorkspaceBoot();
  useWorkspaceShortcuts();
  const ready = useTabsStore((state) => state.ready);
  const activeId = useTabsStore((state) => state.activeId);
  const { sidebarWidth, sidebarHidden, toggleSidebar } = useUiStore();

  return (
    <div className="flex h-dvh w-full overflow-hidden">
      {!sidebarHidden && (
        <aside style={{ width: sidebarWidth }} className="relative hidden shrink-0 border-r border-line md:block">
          <Sidebar onClose={toggleSidebar} />
          <ResizeHandle />
        </aside>
      )}
      <MobileDrawer />

      <main className="relative flex min-w-0 flex-1 flex-col">
        <TopBar />
        <div className="min-h-0 flex-1 overflow-y-auto" data-editor-scroll>
          <div className="mx-auto w-full max-w-[700px] px-5 pt-4 md:px-12 md:pt-16">
            {ready && activeId && <DocEditor key={activeId} docId={activeId} />}
          </div>
        </div>
        <VoiceDock />
      </main>
      <QuickSwitcher />
    </div>
  );
}
