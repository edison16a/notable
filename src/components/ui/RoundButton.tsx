import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface RoundButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  size?: number;
}

/** The solid black circle used for stop, pause, and play in the voice UI. */
export function RoundButton({ label, size = 36, className, style, type = "button", ...rest }: RoundButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      style={{ width: size, height: size, ...style }}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-fg text-bg transition-transform",
        "hover:scale-105 active:scale-95",
        className,
      )}
      {...rest}
    />
  );
}
