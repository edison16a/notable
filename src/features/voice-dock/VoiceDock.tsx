"use client";

import { useEffect, useState } from "react";
import { DictationPopup } from "@/features/dictation/components/DictationPopup";
import { startDictation, stopDictation } from "@/features/dictation/controller";
import { useDictationStore } from "@/features/dictation/store";
import { useEditorStore } from "@/features/editor/editorStore";
import { PlaybackBar } from "@/features/read-aloud/components/PlaybackBar";
import { ReadAloudPopup } from "@/features/read-aloud/components/ReadAloudPopup";
import { loadReadingPrefs, startReading, stopReading } from "@/features/read-aloud/controller";
import { useReadAloudStore } from "@/features/read-aloud/store";
import { displayTitle } from "@/features/tabs/lib/title";
import { useTabsStore } from "@/features/tabs/store";
import { TranscriptionPopup } from "@/features/transcription/components/TranscriptionPopup";
import { useTranscriptionStore } from "@/features/transcription/store";
import { VoiceToolbar } from "./VoiceToolbar";

const HINT_MS = 2200;

/**
 * Floats at the bottom center of the editor. Shows the voice buttons when
 * idle, and the matching popup (plus the playback bar when reading) while a
 * voice feature runs. Only one popup shows at a time, so this is the place
 * that decides which one is on screen. Esc stops dictation or reading.
 */
export function VoiceDock() {
  const readStatus = useReadAloudStore((state) => state.status);
  const dictationStatus = useDictationStore((state) => state.status);
  const transcriptionStatus = useTranscriptionStore((state) => state.status);
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    void loadReadingPrefs();
  }, []);

  useEffect(() => {
    if (!hint) return;
    const timer = setTimeout(() => setHint(null), HINT_MS);
    return () => clearTimeout(timer);
  }, [hint]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (useReadAloudStore.getState().status !== "idle") stopReading();
      if (useDictationStore.getState().status !== "idle") void stopDictation();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const readAloud = () => {
    const editor = useEditorStore.getState().editor;
    const { tabs, activeId } = useTabsStore.getState();
    const title = displayTitle(tabs.find((tab) => tab.id === activeId)?.title ?? "");
    if (!editor || !startReading(editor, title)) setHint("Nothing to read yet");
  };

  return (
    <div className="pointer-events-none absolute inset-x-3 bottom-[max(20px,calc(env(safe-area-inset-bottom)+12px))] z-30 flex flex-col items-center gap-2.5 md:bottom-7">
      <div className="pointer-events-auto flex w-full flex-col items-center gap-2.5">
        {dictationStatus !== "idle" ? (
          <DictationPopup />
        ) : transcriptionStatus !== "idle" ? (
          <TranscriptionPopup />
        ) : readStatus !== "idle" ? (
          <>
            <ReadAloudPopup />
            <PlaybackBar />
          </>
        ) : (
          <VoiceToolbar onDictate={() => void startDictation()} onReadAloud={readAloud} hint={hint} />
        )}
      </div>
    </div>
  );
}
