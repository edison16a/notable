import Dexie, { type Table } from "dexie";

/** One generated sentence of speech. Keyed by voice and text so any doc can reuse it. */
export interface AudioClipRecord {
  key: string;
  wav: Blob;
  duration: number;
  createdAt: number;
}

/**
 * Read aloud audio lives in its own database so "Clear audio cache" can drop
 * the whole thing without any risk of touching the docs.
 */
class AudioCacheDatabase extends Dexie {
  clips!: Table<AudioClipRecord, string>;

  constructor() {
    super("notable-audio");
    this.version(1).stores({ clips: "key, createdAt" });
  }
}

let instance: AudioCacheDatabase | null = null;

export function getAudioDb(): AudioCacheDatabase {
  instance ??= new AudioCacheDatabase();
  return instance;
}

export function clipKey(voice: string, text: string): string {
  return `${voice}|${text}`;
}

export async function readClip(key: string): Promise<AudioClipRecord | undefined> {
  return getAudioDb().clips.get(key);
}

export async function writeClip(record: AudioClipRecord): Promise<void> {
  await getAudioDb().clips.put(record);
}

export async function clearAudioCache(): Promise<void> {
  await getAudioDb().clips.clear();
}
