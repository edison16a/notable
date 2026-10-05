import type { Editor } from "@tiptap/core";
import { createLevelAnalyser, getAudioContext } from "@/features/audio/context";
import { useEditorStore } from "@/features/editor/editorStore";
import { getMeta, setMeta } from "@/features/storage/repository";
import { DOWNLOAD_CANCELLED, KokoroEngine } from "./engine/kokoroEngine";
import { setSpeechClickHandler, setSpeechHighlight } from "./highlight";
import { collectSentences, sentenceIndexAt, type SpeakableSentence } from "./lib/extract";
import { FallbackPlayer } from "./player/fallbackPlayer";
import { KokoroPlayer } from "./player/kokoroPlayer";
import { attachMediaSession, detachMediaSession, updateMediaSession } from "./player/mediaSession";
import type { Player, PlayerCallbacks } from "./player/types";
import { useReadAloudStore } from "./store";

/*
 * The one place that owns the read aloud session. Components call these
 * functions, the player reports back through callbacks, and the store is
 * what the UI renders. Kept as a module rather than a hook because the
 * session outlives any single component (the popup and the bar come and go).
 */

const PREFS_KEY = "readAloudPrefs";
const set = useReadAloudStore.setState;
const engine = typeof window === "undefined" ? null : new KokoroEngine();
let kokoro: KokoroPlayer | null = null;
let fallback: FallbackPlayer | null = null;
let player: Player | null = null;
let session: { sentences: SpeakableSentence[]; title: string } | null = null;

const callbacks: PlayerCallbacks = {
  onStatus: (status) => {
    set({ status, error: null });
    const { elapsed, total, rate } = useReadAloudStore.getState();
    updateMediaSession(status === "reading", elapsed, total, rate);
  },
  onTime: (elapsed, total) => set({ elapsed, total }),
  onHighlight: (highlight) => setSpeechHighlight(useEditorStore.getState().editor, highlight),
  onDownload: (downloadProgress) => set({ downloadProgress }),
  onError: (error) => {
    if (error.message === DOWNLOAD_CANCELLED) return stopReading();
    if (player === kokoro && engine?.loadFailed && session) return switchToFallback();
    const message = player === fallback ? "No voice available on this device" : "Could not read this part aloud";
    set({ status: "error", error: message });
  },
  onEnd: () => stopReading(),
};

function ensurePlayer(): Player {
  if (engine?.loadFailed || !engine) {
    fallback ??= new FallbackPlayer(callbacks);
    return fallback;
  }
  kokoro ??= new KokoroPlayer(engine, callbacks, useReadAloudStore.getState().voice);
  return kokoro;
}

/** Routes the audio element through an analyser once, so the popup bars follow playback volume. */
async function connectAnalyser(audio: HTMLAudioElement) {
  if (useReadAloudStore.getState().analyser) return;
  const ctx = await getAudioContext();
  const analyser = createLevelAnalyser(ctx);
  ctx.createMediaElementSource(audio).connect(analyser);
  analyser.connect(ctx.destination);
  set({ analyser });
}

function switchToFallback() {
  if (!session) return;
  kokoro?.stop();
  player = ensurePlayer();
  player.setRate(useReadAloudStore.getState().rate);
  player.load(session.sentences, 0);
  set({ usingFallback: true });
  player.play();
}

/**
 * Reads the selection if there is one, otherwise the whole doc starting at
 * the cursor's sentence. Returns false when there is nothing to read.
 */
export function startReading(editor: Editor, title: string): boolean {
  const { from, to, empty } = editor.state.selection;
  const sentences = collectSentences(editor.state.doc, empty ? undefined : { from, to });
  if (!sentences.length) return false;

  player?.stop();
  player = ensurePlayer();
  if (player === kokoro) void connectAnalyser(kokoro.audio);
  session = { sentences, title };
  player.setRate(useReadAloudStore.getState().rate);
  player.load(sentences, empty ? sentenceIndexAt(sentences, from) : 0);
  set({ status: "preparing", error: null, usingFallback: player === fallback });
  player.play();
  setSpeechClickHandler((pos) => player?.seekToPosition(pos));
  attachMediaSession(title, { play: resumeReading, pause: pauseReading, next: nextSentence, previous: previousSentence, seek: seekTo });
  return true;
}

export function pauseReading() {
  player?.pause();
}

export function resumeReading() {
  player?.play();
}

export function seekTo(time: number) {
  player?.seek(time);
}

export function nextSentence() {
  player?.next();
}

export function previousSentence() {
  player?.previous();
}

export function stopReading() {
  player?.stop();
  player = null;
  session = null;
  setSpeechClickHandler(null);
  detachMediaSession();
  set({ status: "idle", elapsed: 0, total: 0, error: null, downloadProgress: 0 });
}

export function setReadingRate(rate: number) {
  player?.setRate(rate);
  set({ rate });
  void savePrefs();
}

export function setReadingVoice(voice: string) {
  kokoro?.setVoice(voice);
  set({ voice });
  void savePrefs();
}

/** Plays a short sample of a voice from the picker. Shares the cache, so a second preview is instant. */
export async function previewVoice(voice: string, name: string): Promise<void> {
  if (!engine || engine.loadFailed) return;
  const clip = await engine.synthesize(`Hi, I'm ${name}. This is how I sound reading your notes.`, voice);
  const url = URL.createObjectURL(clip.blob);
  const audio = new Audio(url);
  audio.addEventListener("ended", () => URL.revokeObjectURL(url), { once: true });
  await audio.play();
}

async function savePrefs() {
  const { rate, voice } = useReadAloudStore.getState();
  await setMeta(PREFS_KEY, { rate, voice });
}

export async function loadReadingPrefs() {
  const prefs = await getMeta<{ rate: number; voice: string }>(PREFS_KEY);
  if (!prefs) return;
  set({ rate: prefs.rate, voice: prefs.voice });
  kokoro?.setVoice(prefs.voice);
}
