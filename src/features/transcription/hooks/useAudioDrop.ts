"use client";

import { useState, type DragEvent } from "react";
import { transcribeFile } from "../controller";

const hasFiles = (event: DragEvent) => Array.from(event.dataTransfer.types).includes("Files");

/**
 * Lets an audio file be dropped anywhere on the editor area. Only file drags
 * are claimed, so dragging text or sidebar tabs behaves as usual.
 */
export function useAudioDrop() {
  const [over, setOver] = useState(false);

  const handlers = {
    onDragOver(event: DragEvent<HTMLElement>) {
      if (!hasFiles(event)) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
      setOver(true);
    },
    onDragLeave(event: DragEvent<HTMLElement>) {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOver(false);
    },
    onDrop(event: DragEvent<HTMLElement>) {
      if (!hasFiles(event)) return;
      event.preventDefault();
      setOver(false);
      const file = event.dataTransfer.files[0];
      if (file) void transcribeFile(file);
    },
  };

  return { over, handlers };
}
