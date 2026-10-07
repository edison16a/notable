import { LogoMark } from "@/components/icons/brand";

/** What phones and tablets see instead of the app. */
export function DesktopOnly() {
  return (
    <main className="flex h-dvh flex-col items-center justify-center gap-5 px-8 text-center">
      <LogoMark size={44} />
      <p className="text-lg font-medium tracking-tight">Notable is only available on computer</p>
    </main>
  );
}
