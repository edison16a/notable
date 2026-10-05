import { WaveformIcon } from "@/components/icons/voice";

/** Shown over the editor while an audio file is dragged in. */
export function DropOverlay() {
  return (
    <div className="pointer-events-none absolute inset-3 z-20 flex items-center justify-center rounded-3xl border-2 border-dashed border-accent bg-accent-soft/60">
      <p className="flex items-center gap-2 text-sm font-medium">
        <WaveformIcon className="text-accent" />
        Drop audio to transcribe it into a new tab
      </p>
    </div>
  );
}
