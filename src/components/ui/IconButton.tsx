import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required because the button has no visible text. Also used as the hover tooltip. */
  label: string;
  size?: "sm" | "md";
}

/** Quiet square button for toolbar and sidebar icons. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, size = "md", className, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg text-muted transition-colors",
        "hover:bg-hover hover:text-fg disabled:pointer-events-none disabled:opacity-40",
        size === "sm" ? "size-6" : "size-8",
        className,
      )}
      {...rest}
    />
  );
});
