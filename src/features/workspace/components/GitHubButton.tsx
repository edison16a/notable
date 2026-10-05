import { GitHubIcon } from "@/components/icons/brand";

export const REPO_URL = "https://github.com/edison16a/notable";

export function GitHubButton() {
  return (
    <a
      href={REPO_URL}
      target="_blank"
      rel="noreferrer"
      className="inline-flex h-7 items-center self-start gap-1.5 rounded-full border border-line px-2.5 text-xs text-muted transition-colors hover:bg-hover hover:text-fg"
    >
      <GitHubIcon size={13} />
      View on GitHub
    </a>
  );
}
