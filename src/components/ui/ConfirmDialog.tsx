"use client";

import { useEffect, useRef } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm(): void;
  onCancel(): void;
}

/**
 * A small glass dialog built on the native <dialog> element, which gives us
 * focus trapping, Esc to close, and a backdrop without extra code.
 */
export function ConfirmDialog({ open, title, message, confirmLabel, onConfirm, onCancel }: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      onClick={(event) => {
        if (event.target === ref.current) onCancel();
      }}
      className="glass glass-solid glass-enter m-auto w-[min(360px,calc(100vw-32px))] rounded-2xl p-0 text-fg backdrop:bg-black/20"
    >
      <div className="p-5">
        <h2 className="text-[15px] font-semibold">{title}</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="h-8 rounded-full px-3.5 text-sm hover:bg-hover">
            Cancel
          </button>
          <button
            type="button"
            autoFocus
            onClick={onConfirm}
            className="h-8 rounded-full bg-fg px-3.5 text-sm font-medium text-bg hover:opacity-90"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
