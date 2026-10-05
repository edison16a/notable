"use client";

import { useEffect, useRef } from "react";
import { barsFromSpectrum, easeBars, overallLevel } from "@/features/audio/levels";
import { prefersReducedMotion } from "@/lib/platform";
import { drawBars, drawMeter, syntheticBars, type BarStyle } from "../lib/drawBars";
import type { BarsMode } from "../types";

const BAR_COUNT = 40;
const WIDTH = 124;
const HEIGHT = 32;

interface LevelBarsProps {
  mode: BarsMode;
  analyser: AnalyserNode | null;
  /** "accent" for playback and processing, "fg" for the live microphone. */
  tone: "accent" | "fg";
}

/**
 * The popup's live graph. Each animation frame reads the analyser, eases the
 * bars toward the new heights, and redraws a small canvas. A canvas is far
 * cheaper than 40 DOM nodes changing height sixty times a second.
 */
export function LevelBars({ mode, analyser, tone }: LevelBarsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = WIDTH * dpr;
    canvas.height = HEIGHT * dpr;

    const color = getComputedStyle(canvas).getPropertyValue(tone === "accent" ? "--accent" : "--fg").trim();
    const style: BarStyle = { color, barWidth: 1.8, gap: 1.3, minHeight: mode === "flat" ? 1.8 : 3 };
    const reduced = prefersReducedMotion();
    const spectrum = new Uint8Array(analyser?.frequencyBinCount ?? 0);
    let bars = new Array<number>(BAR_COUNT).fill(0);
    let frame = 0;

    const render = (now: number) => {
      let target: number[];
      if (mode === "live" && analyser) {
        analyser.getByteFrequencyData(spectrum);
        target = barsFromSpectrum(spectrum, BAR_COUNT);
      } else {
        target = syntheticBars(mode, BAR_COUNT, now / 1000);
      }

      if (reduced) {
        drawMeter(ctx, overallLevel(target), BAR_COUNT, style);
      } else {
        bars = easeBars(bars, target, 0.3);
        drawBars(ctx, bars, style);
      }
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frame);
  }, [mode, analyser, tone]);

  return <canvas ref={canvasRef} style={{ width: WIDTH, height: HEIGHT }} aria-hidden="true" />;
}
