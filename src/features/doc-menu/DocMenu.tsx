"use client";

import { useState } from "react";
import { DownloadIcon, FileIcon, MoreIcon, TrashIcon } from "@/components/icons/interface";
import { WaveformIcon } from "@/components/icons/voice";
import { IconButton } from "@/components/ui/IconButton";
import { MenuDivider, MenuItem, MenuLabel } from "@/components/ui/MenuItem";
import { Popover } from "@/components/ui/Popover";
import { exportActiveDoc, exportAllDocs } from "@/features/export/actions";
import { clearAudioCache } from "@/features/storage/audio-db";
import { pickAudioFile } from "@/features/transcription/controller";
import { WHISPER_MODELS, useWhisperSettings } from "@/features/whisper/settings";

/**
 * Everything that is not writing lives behind this one button, which keeps
 * the default screen down to the sidebar, the doc, and the voice buttons.
 */
export function DocMenu() {
  const { quality, timestamps, setQuality, setTimestamps } = useWhisperSettings();
  const [cacheCleared, setCacheCleared] = useState(false);

  return (
    <Popover
      align="end"
      className="w-64"
      trigger={({ toggle, open }) => (
        <IconButton label="Doc menu" aria-expanded={open} onClick={toggle}>
          <MoreIcon />
        </IconButton>
      )}
    >
      {(close) => {
        const run = (action: () => unknown) => () => {
          close();
          void action();
        };
        return (
          <>
            <MenuLabel>Export this doc</MenuLabel>
            <MenuItem icon={<FileIcon />} onClick={run(() => exportActiveDoc("markdown"))} hint=".md">
              Markdown
            </MenuItem>
            <MenuItem icon={<FileIcon />} onClick={run(() => exportActiveDoc("word"))} hint=".docx">
              Word
            </MenuItem>
            <MenuItem icon={<FileIcon />} onClick={run(() => exportActiveDoc("pdf"))} hint=".pdf">
              PDF
            </MenuItem>
            <MenuItem icon={<DownloadIcon />} onClick={run(exportAllDocs)} hint=".zip">
              Export all docs
            </MenuItem>

            <MenuDivider />
            <MenuItem icon={<WaveformIcon />} onClick={run(pickAudioFile)}>
              Transcribe audio file
            </MenuItem>
            <MenuItem
              icon={<span className="block size-4" />}
              onClick={() => setQuality(quality === "fast" ? "accurate" : "fast")}
              hint={WHISPER_MODELS[quality].label}
            >
              Speech model
            </MenuItem>
            <MenuItem icon={<span className="block size-4" />} onClick={() => setTimestamps(!timestamps)} hint={timestamps ? "On" : "Off"}>
              Timestamps
            </MenuItem>

            <MenuDivider />
            <MenuItem
              icon={<TrashIcon />}
              hint={cacheCleared ? "Cleared" : undefined}
              onClick={() => void clearAudioCache().then(() => setCacheCleared(true))}
            >
              Clear audio cache
            </MenuItem>
          </>
        );
      }}
    </Popover>
  );
}
