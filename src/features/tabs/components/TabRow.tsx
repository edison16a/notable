"use client";

import { useState, type HTMLAttributes } from "react";
import { ChevronRightIcon, PlusIcon, TrashIcon } from "@/components/icons/interface";
import { IconButton } from "@/components/ui/IconButton";
import { cn } from "@/lib/cn";
import type { DropPosition, VisibleRow } from "../lib/tree";
import { displayTitle } from "../lib/title";
import { RenameInput } from "./RenameInput";

/** Small indent steps keep deep trees readable in a narrow sidebar. */
const INDENT_PX = 14;

interface TabRowProps {
  row: VisibleRow;
  active: boolean;
  dragging: boolean;
  dropPosition: DropPosition | null;
  dragHandlers: HTMLAttributes<HTMLDivElement> & { draggable: boolean };
  onSelect(): void;
  onToggle(): void;
  onAddChild(): void;
  onRename(title: string): void;
  onDelete(): void;
}

export function TabRow({ row, active, dragging, dropPosition, dragHandlers, ...actions }: TabRowProps) {
  const { tab, depth, hasChildren } = row;
  const [editing, setEditing] = useState(false);

  return (
    <div
      role="treeitem"
      aria-selected={active}
      aria-expanded={hasChildren ? !tab.folded : undefined}
      aria-level={depth + 1}
      tabIndex={active ? 0 : -1}
      {...dragHandlers}
      onClick={actions.onSelect}
      onDoubleClick={() => setEditing(true)}
      onKeyDown={(event) => {
        if (editing) return;
        if (event.key === "Enter") actions.onSelect();
        if (event.key === "F2") setEditing(true);
        if (event.key === "Delete") actions.onDelete();
      }}
      style={{ paddingLeft: 6 + depth * INDENT_PX }}
      className={cn(
        "group relative flex h-8 cursor-default select-none items-center gap-1 rounded-lg pr-1 text-[13px] outline-none",
        active ? "bg-accent-soft font-medium text-fg" : "text-fg/85 hover:bg-hover",
        dragging && "opacity-40",
        dropPosition === "inside" && "ring-1 ring-accent ring-inset",
      )}
    >
      {dropPosition === "before" && <span className="absolute inset-x-2 -top-px h-0.5 rounded-full bg-accent" />}
      {dropPosition === "after" && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent" />}

      <span className="flex size-5 shrink-0 items-center justify-center">
        {hasChildren && (
          <button
            type="button"
            aria-label={tab.folded ? "Unfold" : "Fold"}
            onClick={(event) => {
              event.stopPropagation();
              actions.onToggle();
            }}
            className="flex size-5 items-center justify-center rounded-md text-faint hover:bg-hover hover:text-fg"
          >
            <ChevronRightIcon size={13} className={cn("transition-transform", !tab.folded && "rotate-90")} />
          </button>
        )}
      </span>

      {editing ? (
        <RenameInput
          initial={tab.title}
          onCommit={(value) => {
            setEditing(false);
            if (value.trim() !== tab.title) actions.onRename(value);
          }}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <span className={cn("min-w-0 flex-1 truncate", !tab.title && "text-faint")}>{displayTitle(tab.title)}</span>
      )}

      {!editing && (
        <span className="flex opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 max-md:opacity-100">
          <IconButton size="sm" label="Delete tab" onClick={(event) => (event.stopPropagation(), actions.onDelete())}>
            <TrashIcon size={13} />
          </IconButton>
          <IconButton size="sm" label="Add subtab" onClick={(event) => (event.stopPropagation(), actions.onAddChild())}>
            <PlusIcon size={13} />
          </IconButton>
        </span>
      )}
    </div>
  );
}
