"use client";

import { VoicePopup, type PopupAction } from "@/features/voice-popup/components/VoicePopup";
import type { PopupStatus } from "@/features/voice-popup/types";
import { formatTime } from "@/lib/format-time";
import { pauseReading, resumeReading, stopReading } from "../controller";
import { useReadAloudStore, type ReadStatus } from "../store";

const LABELS: Record<Exclude<ReadStatus, "idle">, string> = {
  downloading: "Downloading voice",
  preparing: "Preparing voice",
  reading: "Reading aloud",
  paused: "Paused",
  error: "Something went wrong",
};

/** Maps the read aloud state onto the shared glass popup. */
export function ReadAloudPopup() {
  const { status, elapsed, total, rate, downloadProgress, analyser, error, usingFallback } = useReadAloudStore();
  if (status === "idle") return null;

  const time = `${formatTime(elapsed / rate)} / ${formatTime(total / rate)}`;
  const detail =
    status === "downloading"
      ? `${Math.round(downloadProgress * 100)}%`
      : status === "preparing"
        ? "Generating speech"
        : time;

  const action: PopupAction =
    status === "reading"
      ? { kind: "pause", label: "Pause", onClick: pauseReading }
      : status === "paused"
        ? { kind: "play", label: "Play", onClick: resumeReading }
        : status === "downloading"
          ? { kind: "cancel", label: "Cancel download", onClick: stopReading }
          : { kind: "stop", label: "Stop", onClick: stopReading };

  return (
    <VoicePopup
      status={status as PopupStatus}
      label={status === "error" && error ? error : LABELS[status]}
      detail={detail}
      progress={downloadProgress}
      // The fallback voice has no audio we can analyse, so the bars pulse instead.
      analyser={usingFallback ? null : analyser}
      action={action}
      secondary={status === "error" ? { label: "Try again", onClick: resumeReading } : undefined}
    />
  );
}
