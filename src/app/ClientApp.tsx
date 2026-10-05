"use client";

import dynamic from "next/dynamic";

/**
 * Everything in Notable depends on IndexedDB, Web Audio, and workers, so the
 * workspace renders on the client only. Server rendering it would just mean
 * hydrating an empty shell.
 */
const Workspace = dynamic(() => import("@/features/workspace/components/Workspace").then((m) => m.Workspace), {
  ssr: false,
});

export function ClientApp() {
  return <Workspace />;
}
