"use client";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useDownloadPrompt } from "./downloadPrompt";

export function DownloadPrompt() {
  const { request, answer } = useDownloadPrompt();
  return (
    <ConfirmDialog
      open={Boolean(request)}
      title={`Download ${request?.name ?? "voice model"}?`}
      message={`You are on cellular data. This is a one-time download of about ${request?.size ?? "100 MB"}, then it works offline.`}
      confirmLabel="Download"
      onCancel={() => answer(false)}
      onConfirm={() => answer(true)}
    />
  );
}
