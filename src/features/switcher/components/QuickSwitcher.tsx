"use client";

import { useMemo, useState } from "react";
import { SearchIcon } from "@/components/icons/interface";
import { useTabsStore } from "@/features/tabs/store";
import { useUiStore } from "@/features/workspace/uiStore";
import { cn } from "@/lib/cn";
import { searchTabs } from "../lib/search";

/**
 * Cmd/Ctrl+K search across every doc title. Picking a result selects it and
 * unfolds the tree down to it, which is much faster than browsing deep trees.
 */
export function QuickSwitcher() {
  const open = useUiStore((state) => state.switcherOpen);
  if (!open) return null;
  return <SwitcherPanel />;
}

function SwitcherPanel() {
  const setOpen = useUiStore((state) => state.setSwitcherOpen);
  const setDrawerOpen = useUiStore((state) => state.setDrawerOpen);
  const tabs = useTabsStore((state) => state.tabs);
  const select = useTabsStore((state) => state.select);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const results = useMemo(() => searchTabs(tabs, query), [tabs, query]);

  const choose = (id: string | undefined) => {
    if (id) select(id);
    setOpen(false);
    setDrawerOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center bg-black/10 px-4 pt-[12vh]" onPointerDown={() => setOpen(false)}>
      <div
        role="dialog"
        aria-label="Search docs"
        onPointerDown={(event) => event.stopPropagation()}
        className="glass glass-solid glass-enter flex h-fit max-h-[60vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl"
      >
        <label className="flex items-center gap-2.5 border-b border-line px-4">
          <SearchIcon className="text-faint" />
          <input
            autoFocus
            value={query}
            placeholder="Search docs"
            onChange={(event) => {
              setQuery(event.target.value);
              setCursor(0);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") setCursor((value) => Math.min(value + 1, results.length - 1));
              else if (event.key === "ArrowUp") setCursor((value) => Math.max(value - 1, 0));
              else if (event.key === "Enter") choose(results[cursor]?.id);
              else if (event.key === "Escape") setOpen(false);
              else return;
              event.preventDefault();
            }}
            className="h-12 flex-1 bg-transparent text-[15px] outline-none placeholder:text-faint"
          />
        </label>
        <ul role="listbox" className="overflow-y-auto p-1.5">
          {results.map((result, index) => (
            <li
              key={result.id}
              role="option"
              aria-selected={index === cursor}
              onPointerEnter={() => setCursor(index)}
              onClick={() => choose(result.id)}
              className={cn("flex cursor-default flex-col rounded-lg px-3 py-2", index === cursor && "bg-hover")}
            >
              <span className="truncate text-sm">{result.title}</span>
              {result.path && <span className="truncate text-xs text-faint">{result.path}</span>}
            </li>
          ))}
          {!results.length && <li className="px-3 py-6 text-center text-sm text-faint">No docs match that</li>}
        </ul>
      </div>
    </div>
  );
}
