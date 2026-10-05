/** The subset of Transformers.js progress events we care about. */
export interface ModelProgressEvent {
  status: string;
  file?: string;
  loaded?: number;
  total?: number;
}

/**
 * Transformers.js reports progress per file, and a model is several files.
 * This sums bytes across files so the popup shows one honest percentage
 * instead of a bar that fills and resets for each file.
 */
export class DownloadProgress {
  private files = new Map<string, { loaded: number; total: number }>();

  update(event: ModelProgressEvent): number {
    if (event.file && event.status === "progress" && event.total) {
      this.files.set(event.file, { loaded: event.loaded ?? 0, total: event.total });
    }
    if (event.file && event.status === "done") {
      const entry = this.files.get(event.file);
      if (entry) entry.loaded = entry.total;
    }
    return this.fraction;
  }

  get fraction(): number {
    let loaded = 0;
    let total = 0;
    for (const entry of this.files.values()) {
      loaded += entry.loaded;
      total += entry.total;
    }
    return total ? loaded / total : 0;
  }

  /** True once any file actually came over the network. Cached models load without progress events. */
  get downloading(): boolean {
    return this.files.size > 0 && this.fraction < 1;
  }
}
