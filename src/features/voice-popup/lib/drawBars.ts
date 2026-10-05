import type { BarsMode } from "../types";

export interface BarStyle {
  color: string;
  barWidth: number;
  gap: number;
  /** Shortest bar, so silence still reads as a row of dots rather than nothing. */
  minHeight: number;
}

/**
 * Heights for the modes that do not follow real audio. `time` is in seconds
 * so the motion speed is independent of the frame rate.
 */
export function syntheticBars(mode: BarsMode, count: number, time: number): number[] {
  return Array.from({ length: count }, (_, index) => {
    if (mode === "pulse") return 0.32 + 0.12 * Math.sin(time * 2.4 + index * 0.18);
    if (mode === "shimmer") return 0.12 + 0.18 * Math.max(0, Math.sin(time * 4 - index * 0.35));
    return 0;
  });
}

/** Draws rounded vertical bars centered on the canvas's midline. */
export function drawBars(ctx: CanvasRenderingContext2D, heights: number[], style: BarStyle) {
  const { width, height } = ctx.canvas;
  const dpr = window.devicePixelRatio || 1;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = style.color;

  const barWidth = style.barWidth * dpr;
  const step = (style.barWidth + style.gap) * dpr;
  const total = heights.length * step - style.gap * dpr;
  let x = (width - total) / 2;

  for (const value of heights) {
    const barHeight = Math.max(style.minHeight * dpr, Math.min(1, value) * height);
    const y = (height - barHeight) / 2;
    ctx.beginPath();
    ctx.roundRect(x, y, barWidth, barHeight, barWidth / 2);
    ctx.fill();
    x += step;
  }
}

/**
 * The reduced-motion version: a plain meter where bars light up from the left
 * as the level rises, with no easing or wave motion.
 */
export function drawMeter(ctx: CanvasRenderingContext2D, level: number, count: number, style: BarStyle) {
  const lit = Math.round(Math.min(1, level * 2.5) * count);
  const heights = Array.from({ length: count }, (_, index) => (index < lit ? 0.5 : 0));
  drawBars(ctx, heights, style);
}
