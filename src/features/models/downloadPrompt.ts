import { create } from "zustand";
import { getMeta, setMeta } from "@/features/storage/repository";
import { isOnCellular } from "@/lib/platform";

interface PendingRequest {
  name: string;
  size: string;
  resolve(allowed: boolean): void;
}

interface PromptState {
  request: PendingRequest | null;
  answer(allowed: boolean): void;
}

/** Drives the "Download on cellular?" dialog. One question at a time is enough. */
export const useDownloadPrompt = create<PromptState>((set, get) => ({
  request: null,
  answer(allowed) {
    get().request?.resolve(allowed);
    set({ request: null });
  },
}));

const flagKey = (model: string) => `model-ready:${model}`;

/**
 * Resolves true when it is fine to fetch a model. Models already in the
 * cache never ask, and neither does Wi-Fi. Only a first download on cellular
 * data waits for the user, since these files are tens of megabytes.
 */
export async function allowModelDownload(model: string, name: string, size: string): Promise<boolean> {
  if (await getMeta<boolean>(flagKey(model))) return true;
  if (!isOnCellular()) return true;
  return new Promise((resolve) => {
    useDownloadPrompt.setState({ request: { name, size, resolve } });
  });
}

export async function markModelReady(model: string): Promise<void> {
  await setMeta(flagKey(model), true);
}
