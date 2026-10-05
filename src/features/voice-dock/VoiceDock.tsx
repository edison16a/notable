"use client";

import { useEffect, useState } from "react";
import { useEditorStore } from "@/features/editor/editorStore";
import { PlaybackBar } from "@/features/read-aloud/components/PlaybackBar";
import { ReadAloudPopup } from "@/features/read-aloud/components/ReadAloudPopup";
import { loadReadingPrefs, startReading, stopReading } from "@/features/read-aloud/controller";
import { useReadAloudStore } from "@/features/read-aloud/store";
import { displayTitle } from "@/features/tabs/lib/title";
import { useTabsStore } from "@/features/tabs/store";
import { VoiceToolbar } from "./VoiceToolbar";

const HINT_MS = 2200;

/**
 * Floats at the bottom center of the editor. Shows the voice buttons when
 * idle, and the matching popup (plus the playback bar when reading) while a
 * voice feature runs. Only one runs at a time, so this is the place that
 * decides which one is on screen. Esc stops whichever is active.
 */
export function VoiceDock() {
  const readStatus = useReadAloudStore((state) => state.status);
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
      if (event.key === "Escape" && useReadAloudStore.getState().status !== "idle") stopReading();
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
        {readStatus !== "idle" ? (
          <>
            <ReadAloudPopup />
            <PlaybackBar />
          </>
        ) : (
          <VoiceToolbar onDictate={() => setHint("Dictation is coming next")} onReadAloud={readAloud} hint={hint} />
        )}
      </div>
    </div>
  );
}
