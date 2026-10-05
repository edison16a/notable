"use client";

import { useState } from "react";
import { ChevronDownIcon } from "@/components/icons/interface";
import { PlayIcon } from "@/components/icons/voice";
import { MenuLabel } from "@/components/ui/MenuItem";
import { Popover } from "@/components/ui/Popover";
import { cn } from "@/lib/cn";
import { previewVoice, setReadingVoice } from "../controller";
import { useReadAloudStore } from "../store";
import { groupedVoices, voiceName } from "../voices";

/** Voice menu grouped by accent and gender, each row with a small preview button. */
export function VoicePicker() {
  const voice = useReadAloudStore((state) => state.voice);
  const disabled = useReadAloudStore((state) => state.usingFallback);
  const [previewing, setPreviewing] = useState<string | null>(null);

  if (disabled) return <span className="px-2 text-xs text-muted">Browser voice</span>;

  return (
    <Popover
      side="top"
      className="max-h-[60vh] w-60 overflow-y-auto"
      trigger={({ toggle, open }) => (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          className="flex h-8 items-center gap-1 rounded-full bg-hover px-3 text-xs font-medium hover:bg-line"
        >
          {voiceName(voice)}
          <ChevronDownIcon size={12} />
        </button>
      )}
    >
      {(close) =>
        groupedVoices().map((group) => (
          <div key={group.label}>
            <MenuLabel>{group.label}</MenuLabel>
            {group.voices.map((option) => (
              <div
                key={option.id}
                className={cn("flex h-8 items-center rounded-lg pl-2.5 pr-1 text-[13px] hover:bg-hover", option.id === voice && "font-medium")}
              >
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={option.id === voice}
                  className="flex flex-1 items-center gap-2 text-left"
                  onClick={() => {
                    setReadingVoice(option.id);
                    close();
                  }}
                >
                  <span className={cn("size-1.5 rounded-full", option.id === voice ? "bg-accent" : "bg-transparent")} />
                  {option.name}
                </button>
                <button
                  type="button"
                  aria-label={`Preview ${option.name}`}
                  title="Preview"
                  onClick={() => {
                    setPreviewing(option.id);
                    previewVoice(option.id, option.name).finally(() => setPreviewing(null));
                  }}
                  className={cn("flex size-6 items-center justify-center rounded-md text-muted hover:bg-line hover:text-fg", previewing === option.id && "animate-pulse text-accent")}
                >
                  <PlayIcon size={12} />
                </button>
              </div>
            ))}
          </div>
        ))
      }
    </Popover>
  );
}
