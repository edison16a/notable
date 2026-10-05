"use client";

import { VoicePopup, type PopupAction } from "@/features/voice-popup/components/VoicePopup";
import type { PopupStatus } from "@/features/voice-popup/types";
import { formatTime } from "@/lib/format-time";
import { dismissDictationError, startDictation, stopDictation } from "../controller";
import { useDictationStore, type DictationStatus } from "../store";

const LABELS: Record<Exclude<DictationStatus, "idle" | "error">, string> = {
  downloading: "Downloading voice",
  preparing: "Getting ready",
  listening: "Listening",
  silent: "Can't hear you",
  transcribing: "Transcribing",
};

/** Maps the dictation state onto the shared glass popup. */
export function DictationPopup() {
  const { status, elapsed, downloadProgress, analyser, error, errorAction } = useDictationStore();
  if (status === "idle") return null;

  if (status === "error") {
    return (
      <VoicePopup
        status="error"
        label={error ?? "Something went wrong"}
        action={{ kind: "cancel", label: "Close", onClick: dismissDictationError }}
        secondary={{ label: errorAction ?? "Try again", onClick: () => void startDictation() }}
      />
    );
  }

  const detail: Record<typeof status, string> = {
    downloading: `${Math.round(downloadProgress * 100)}%`,
    preparing: "Loading the speech model",
    listening: formatTime(elapsed),
    silent: "Check your mic",
    transcribing: "Almost done",
  };

  const action: PopupAction =
    status === "downloading"
      ? { kind: "cancel", label: "Cancel", onClick: () => void stopDictation() }
      : { kind: "stop", label: "Stop dictation", onClick: () => void stopDictation() };

  return (
    <VoicePopup
      status={status as PopupStatus}
      label={LABELS[status]}
      detail={detail[status]}
      progress={downloadProgress}
      analyser={analyser}
      action={action}
    />
  );
}
