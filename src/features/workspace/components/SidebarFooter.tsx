import { CheckCircleIcon } from "@/components/icons/interface";
import { GitHubButton } from "./GitHubButton";

export function SidebarFooter() {
  return (
    <footer className="flex flex-col gap-3 px-3 pb-3 pt-2">
      <GitHubButton />
      <p className="flex items-center gap-1.5 px-1 text-[11px] text-faint">
        <CheckCircleIcon size={13} />
        Saved on this device
      </p>
    </footer>
  );
}
