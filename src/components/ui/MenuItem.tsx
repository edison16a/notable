import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

interface MenuItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
  /** Optional right-aligned hint, like a shortcut or the current value of a setting. */
  hint?: ReactNode;
}

export function MenuItem({ icon, hint, children, className, type = "button", ...rest }: MenuItemProps) {
  return (
    <button
      type={type}
      role="menuitem"
      className={cn(
        "flex h-8 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-[13px] text-fg",
        "hover:bg-hover disabled:pointer-events-none disabled:opacity-40",
        className,
      )}
      {...rest}
    >
      {icon && <span className="text-muted">{icon}</span>}
      <span className="flex-1 truncate">{children}</span>
      {hint && <span className="text-xs text-faint">{hint}</span>}
    </button>
  );
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return <div className="px-2.5 pb-1 pt-2 text-[11px] font-medium text-faint">{children}</div>;
}

export function MenuDivider() {
  return <div className="mx-2 my-1 h-px bg-line" />;
}
