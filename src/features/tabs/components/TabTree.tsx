"use client";

import { useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useTabDrag } from "../hooks/useTabDrag";
import { descendantIds, visibleRows } from "../lib/tree";
import { displayTitle } from "../lib/title";
import { useTabsStore } from "../store";
import { TabRow } from "./TabRow";

interface TabTreeProps {
  /** Called after a tab is picked, so the mobile drawer can close itself. */
  onNavigate?(): void;
}

export function TabTree({ onNavigate }: TabTreeProps) {
  const { tabs, activeId, select, toggleFold, addTab, renameTab, deleteTab } = useTabsStore();
  const { draggingId, target, rowHandlers } = useTabDrag();
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const rows = useMemo(() => visibleRows(tabs), [tabs]);

  const pendingTab = tabs.find((tab) => tab.id === pendingDelete);
  const pendingCount = pendingDelete ? descendantIds(tabs, pendingDelete).length : 0;

  // Subtabs are deleted along with their parent, so only that case needs a confirmation.
  const requestDelete = (id: string) => {
    if (descendantIds(tabs, id).length) setPendingDelete(id);
    else deleteTab(id);
  };

  return (
    <>
      <div role="tree" aria-label="Docs" className="flex flex-col gap-px">
        {rows.map((row) => (
          <TabRow
            key={row.tab.id}
            row={row}
            active={row.tab.id === activeId}
            dragging={row.tab.id === draggingId}
            dropPosition={target?.id === row.tab.id ? target.position : null}
            dragHandlers={rowHandlers(row.tab.id)}
            onSelect={() => {
              select(row.tab.id);
              onNavigate?.();
            }}
            onToggle={() => toggleFold(row.tab.id)}
            onAddChild={() => {
              addTab(row.tab.id);
              onNavigate?.();
            }}
            onRename={(title) => renameTab(row.tab.id, title)}
            onDelete={() => requestDelete(row.tab.id)}
          />
        ))}
      </div>

      <ConfirmDialog
        open={Boolean(pendingTab)}
        title={`Delete "${displayTitle(pendingTab?.title ?? "")}"?`}
        message={`This also deletes its ${pendingCount} ${pendingCount === 1 ? "subtab" : "subtabs"}. This cannot be undone.`}
        confirmLabel="Delete"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) deleteTab(pendingDelete);
          setPendingDelete(null);
        }}
      />
    </>
  );
}
