"use client";

import { CloseIcon } from "@/components/icons/interface";
import { PauseIcon, PlayIcon, SkipBackIcon, SkipForwardIcon } from "@/components/icons/voice";
import { IconButton } from "@/components/ui/IconButton";
import { RoundButton } from "@/components/ui/RoundButton";
import { formatTime } from "@/lib/format-time";
import { nextSentence, pauseReading, previousSentence, resumeReading, seekTo, stopReading } from "../controller";
import { useReadAloudStore } from "../store";
import { Scrubber } from "./Scrubber";
import { SpeedButton } from "./SpeedButton";
import { VoicePicker } from "./VoicePicker";

/**
 * The glass transport bar under the popup while reading. Times are shown in
 * real listening time, so 2x speed halves the total.
 */
export function PlaybackBar() {
  const { status, elapsed, total, rate } = useReadAloudStore();
  const playing = status === "reading" || status === "preparing" || status === "downloading";

  return (
    <div className="glass glass-enter flex h-14 w-full max-w-[560px] items-center gap-1.5 rounded-full px-2 max-sm:gap-1">
      <IconButton label="Previous sentence" onClick={previousSentence}>
        <SkipBackIcon />
      </IconButton>
      <RoundButton label={playing ? "Pause" : "Play"} onClick={playing ? pauseReading : resumeReading}>
        {playing ? <PauseIcon size={16} /> : <PlayIcon size={16} />}
      </RoundButton>
      <IconButton label="Next sentence" onClick={nextSentence}>
        <SkipForwardIcon />
      </IconButton>

      <span className="w-9 text-right text-[11px] text-muted tabular-nums max-sm:hidden">{formatTime(elapsed / rate)}</span>
      <div className="mx-1.5 flex min-w-0 flex-1">
        <Scrubber value={elapsed} max={total} onSeek={seekTo} />
      </div>
      <span className="w-9 text-[11px] text-muted tabular-nums max-sm:hidden">{formatTime(total / rate)}</span>

      <SpeedButton />
      <VoicePicker />
      <IconButton label="Stop reading" onClick={stopReading}>
        <CloseIcon />
      </IconButton>
    </div>
  );
}
