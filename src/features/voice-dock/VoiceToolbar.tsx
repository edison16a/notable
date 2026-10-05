"use client";

import { MicIcon, SpeakerIcon } from "@/components/icons/voice";
import { cn } from "@/lib/cn";

interface VoiceToolbarProps {
  onDictate(): void;
  onReadAloud(): void;
  /** A short message that replaces the buttons briefly, such as "Nothing to read yet". */
  hint: string | null;
}

const buttonClass =
  "flex h-9 items-center gap-2 rounded-full px-3.5 text-[13px] font-medium text-fg transition-colors hover:bg-hover";

/** The two small buttons that are always there: the only voice chrome visible by default. */
export function VoiceToolbar({ onDictate, onReadAloud, hint }: VoiceToolbarProps) {
  return (
    <div className={cn("glass glass-enter flex h-12 items-center gap-1 rounded-full px-1.5")}>
      {hint ? (
        <span className="px-4 text-[13px] text-muted">{hint}</span>
      ) : (
        <>
          <button type="button" onClick={onDictate} className={buttonClass}>
            <MicIcon size={15} />
            Dictate
          </button>
          <button type="button" onClick={onReadAloud} className={buttonClass}>
            <SpeakerIcon size={15} />
            Read aloud
          </button>
        </>
      )}
    </div>
  );
}
