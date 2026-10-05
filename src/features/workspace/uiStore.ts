import { create } from "zustand";
import { getMeta, setMeta } from "@/features/storage/repository";

export const SIDEBAR_MIN = 200;
export const SIDEBAR_MAX = 440;
const SIDEBAR_DEFAULT = 248;
const UI_KEY = "ui";

interface SavedUi {
  sidebarWidth: number;
  sidebarHidden: boolean;
}

/** Layout state that is not about docs: sidebar size and visibility, drawers, and overlays. */
interface UiState extends SavedUi {
  /** The slide-over sidebar on phones. Never persisted, it always starts closed. */
  drawerOpen: boolean;
  switcherOpen: boolean;
  hydrate(): Promise<void>;
  setSidebarWidth(width: number): void;
  toggleSidebar(): void;
  setDrawerOpen(open: boolean): void;
  setSwitcherOpen(open: boolean): void;
}

const clampWidth = (width: number) => Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, Math.round(width)));

export const useUiStore = create<UiState>((set, get) => {
  const persist = () => {
    const { sidebarWidth, sidebarHidden } = get();
    void setMeta(UI_KEY, { sidebarWidth, sidebarHidden } satisfies SavedUi);
  };

  return {
    sidebarWidth: SIDEBAR_DEFAULT,
    sidebarHidden: false,
    drawerOpen: false,
    switcherOpen: false,

    async hydrate() {
      const saved = await getMeta<SavedUi>(UI_KEY);
      if (saved) set({ sidebarWidth: clampWidth(saved.sidebarWidth), sidebarHidden: saved.sidebarHidden });
    },
    setSidebarWidth(width) {
      set({ sidebarWidth: clampWidth(width) });
      persist();
    },
    toggleSidebar() {
      set((state) => ({ sidebarHidden: !state.sidebarHidden }));
      persist();
    },
    setDrawerOpen: (drawerOpen) => set({ drawerOpen }),
    setSwitcherOpen: (switcherOpen) => set({ switcherOpen }),
  };
});
