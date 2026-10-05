"use client";

import { useEffect } from "react";
import { useTabsStore } from "@/features/tabs/store";
import { hasModifier } from "../shortcuts";
import { useUiStore } from "../uiStore";

/**
 * App-wide keys. Alt+N adds a top-level tab and Alt+Shift+N adds a subtab of
 * the current one. We match on `event.code` because Alt changes the produced
 * character on a Mac (Alt+N types "˜").
 */
export function useWorkspaceShortcuts() {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const ui = useUiStore.getState();
      const tabs = useTabsStore.getState();

      if (hasModifier(event) && event.code === "KeyK") {
        event.preventDefault();
        ui.setSwitcherOpen(!ui.switcherOpen);
      } else if (hasModifier(event) && event.code === "Backslash") {
        event.preventDefault();
        ui.toggleSidebar();
      } else if (event.altKey && !event.metaKey && !event.ctrlKey && event.code === "KeyN") {
        event.preventDefault();
        tabs.addTab(event.shiftKey ? tabs.activeId : null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
