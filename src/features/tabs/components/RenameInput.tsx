"use client";

import { useState } from "react";

interface RenameInputProps {
  initial: string;
  onCommit(value: string): void;
  onCancel(): void;
}

/** Inline title editor. Enter or blur saves, Esc backs out without changes. */
export function RenameInput({ initial, onCommit, onCancel }: RenameInputProps) {
  const [value, setValue] = useState(initial);

  return (
    <input
      autoFocus
      value={value}
      aria-label="Tab name"
      onFocus={(event) => event.currentTarget.select()}
      onChange={(event) => setValue(event.target.value)}
      onBlur={() => onCommit(value)}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        if (event.key === "Enter") onCommit(value);
        if (event.key === "Escape") onCancel();
      }}
      className="h-6 min-w-0 flex-1 rounded-md bg-bg px-1.5 text-[13px] outline-none ring-1 ring-accent"
    />
  );
}
