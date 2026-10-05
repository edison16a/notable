"use client";

import { CloseIcon } from "@/components/icons/interface";
import { MicIcon, PauseIcon, PlayIcon, StopIcon } from "@/components/icons/voice";
import { RoundButton } from "@/components/ui/RoundButton";
import { cn } from "@/lib/cn";
import { barsModeFor, type PopupStatus } from "../types";
import { LevelBars } from "./LevelBars";
import { ProgressTrack } from "./ProgressTrack";

const ACTION_ICONS = { stop: StopIcon, pause: PauseIcon, play: PlayIcon, cancel: CloseIcon };

export interface PopupAction {
  kind: keyof typeof ACTION_ICONS;
  label: string;
  onClick(): void;
}

interface VoicePopupProps {
  status: PopupStatus;
  label: string;
  /** Second line: a timer, a percent, or a short hint. */
  detail?: string;
  analyser?: AnalyserNode | null;
  /** 0 to 1, only used while downloading. */
  progress?: number;
  action: PopupAction;
  /** Extra text button for errors, such as "Try again". */
  secondary?: { label: string; onClick(): void };
  className?: string;
}

/**
 * The frosted pill that appears whenever Notable is listening or speaking.
 * It is purely presentational: dictation and read aloud each decide what it
 * says, which keeps the two features from knowing about each other.
 */
export function VoicePopup({ status, label, detail, analyser = null, progress = 0, action, secondary, className }: VoicePopupProps) {
  const Icon = ACTION_ICONS[action.kind];
  const dotMuted = status === "silent" || status === "paused" || status === "error";

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        // Phones get a full-width card with side margins, desktop a compact pill.
        "glass glass-enter flex h-[60px] items-center gap-4 rounded-full py-2 pl-5 pr-2 max-md:w-full max-md:max-w-[440px]",
        className,
      )}
    >
      <div className="flex w-[124px] shrink-0 items-center justify-center">
        {status === "downloading" ? (
          <ProgressTrack value={progress} />
        ) : status === "error" ? (
          <MicIcon size={18} className="text-faint" />
        ) : (
          <LevelBars mode={barsModeFor(status)} analyser={analyser} tone={status === "listening" ? "fg" : "accent"} />
        )}
      </div>

      <div className="min-w-[104px] max-w-[200px] flex-1">
        <p className="flex items-center gap-1.5 text-[12px] font-medium leading-tight">
          <span className={cn("size-1.5 shrink-0 rounded-full", dotMuted ? "bg-faint" : "bg-accent")} />
          <span className="truncate">{label}</span>
        </p>
        {(detail || secondary) && (
          <p className="truncate pl-3 text-[11px] leading-tight text-muted tabular-nums">
            {secondary ? (
              <button type="button" onClick={secondary.onClick} className="underline underline-offset-2 hover:text-fg">
                {secondary.label}
              </button>
            ) : (
              detail
            )}
          </p>
        )}
      </div>

      <RoundButton label={action.label} onClick={action.onClick}>
        <Icon size={16} />
      </RoundButton>
    </div>
  );
}
