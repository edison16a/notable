import type { JSONContent } from "@tiptap/core";
import { cleanTranscript } from "@/features/dictation/lib/transcript";
import type { Transcript } from "@/features/whisper/engine";
import { formatTime } from "@/lib/format-time";

export interface WindowTranscript {
  start: number;
  transcript: Transcript;
}

const paragraph = (text: string): JSONContent => ({ type: "paragraph", content: [{ type: "text", text }] });

/** "Team call.m4a" becomes "Team call". */
export function titleFromFileName(name: string): string {
  return name.replace(/\.[^.]+$/, "").trim() || "Transcript";
}

/**
 * Builds the new tab's doc: the file name as the title, then the text. With
 * timestamps on, each Whisper chunk becomes its own line starting with
 * [m:ss], offset by where its window sits in the recording.
 */
export function transcriptToDoc(fileName: string, windows: WindowTranscript[], timestamps: boolean): JSONContent {
  const blocks: JSONContent[] = [];

  for (const { start, transcript } of windows) {
    if (timestamps && transcript.chunks.length) {
      for (const chunk of transcript.chunks) {
        const text = cleanTranscript(chunk.text);
        if (text) blocks.push(paragraph(`[${formatTime(start + chunk.start)}] ${text}`));
      }
    } else {
      const text = cleanTranscript(transcript.text);
      if (text) blocks.push(paragraph(timestamps ? `[${formatTime(start)}] ${text}` : text));
    }
  }

  if (!blocks.length) blocks.push(paragraph("No speech was found in this file."));
  return {
    type: "doc",
    content: [{ type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: titleFromFileName(fileName) }] }, ...blocks],
  };
}
