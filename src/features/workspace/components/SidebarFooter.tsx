import { CheckCircleIcon } from "@/components/icons/interface";
import { GitHubButton } from "./GitHubButton";
import { InstallHint } from "./InstallHint";

export function SidebarFooter() {
  return (
    <footer className="flex flex-col gap-3 px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-2">
      <InstallHint />
      <GitHubButton />
      <p className="flex items-center gap-1.5 px-1 text-[11px] text-faint">
        <CheckCircleIcon size={13} />
        Saved on this device
      </p>
    </footer>
  );
}
