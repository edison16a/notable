"use client";

import dynamic from "next/dynamic";
import { useCoarsePointer } from "@/lib/useCoarsePointer";
import { DesktopOnly } from "./DesktopOnly";

/**
 * Everything in Notable depends on IndexedDB, Web Audio, and workers, so the
 * workspace renders on the client only. Server rendering it would just mean
 * hydrating an empty shell.
 */
const Workspace = dynamic(() => import("@/features/workspace/components/Workspace").then((m) => m.Workspace), {
  ssr: false,
});

/**
 * Notable is built for computers. On a touch device we show a short notice and
 * never load the workspace, so nothing is downloaded, stored, or registered.
 */
export function ClientApp() {
  const touch = useCoarsePointer();
  if (touch === null) return null;
  return touch ? <DesktopOnly /> : <Workspace />;
}
