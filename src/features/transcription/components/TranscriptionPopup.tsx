"use client";

import { VoicePopup } from "@/features/voice-popup/components/VoicePopup";
import { cancelTranscription } from "../controller";
import { useTranscriptionStore } from "../store";

/** Shows file transcription progress in the shared glass popup. */
export function TranscriptionPopup() {
  const { status, fileName, progress, error } = useTranscriptionStore();
  if (status === "idle") return null;

  const close = { kind: "cancel" as const, label: status === "error" ? "Close" : "Cancel", onClick: cancelTranscription };
  if (status === "error") return <VoicePopup status="error" label={error ?? "Something went wrong"} detail={fileName} action={close} />;
  if (status === "downloading") {
    return <VoicePopup status="downloading" label="Downloading voice" detail={`${Math.round(progress * 100)}%`} progress={progress} action={close} />;
  }
  return (
    <VoicePopup
      status="transcribing"
      label={status === "decoding" ? "Reading file" : "Transcribing"}
      detail={status === "decoding" ? fileName : `${Math.round(progress * 100)}% of ${fileName}`}
      action={close}
    />
  );
}
