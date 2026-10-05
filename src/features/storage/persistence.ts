/**
 * Asks the browser to treat our storage as persistent so it is not evicted
 * under disk pressure. Browsers may grant it silently, prompt, or refuse, and
 * all three are fine: autosave keeps working either way.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.storage?.persist) return false;
  try {
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}
