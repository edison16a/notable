export interface MediaControls {
  play(): void;
  pause(): void;
  next(): void;
  previous(): void;
  seek(time: number): void;
}

const supported = () => typeof navigator !== "undefined" && "mediaSession" in navigator;

/**
 * Hooks read aloud into the OS media controls: the lock screen on phones and
 * the media keys on laptops. Everything here is optional, so unsupported
 * browsers simply skip it.
 */
export function attachMediaSession(title: string, controls: MediaControls) {
  if (!supported()) return;
  const session = navigator.mediaSession;
  session.metadata = new MediaMetadata({
    title,
    artist: "Notable",
    artwork: [{ src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }],
  });
  const handlers: Array<[MediaSessionAction, MediaSessionActionHandler]> = [
    ["play", () => controls.play()],
    ["pause", () => controls.pause()],
    ["nexttrack", () => controls.next()],
    ["previoustrack", () => controls.previous()],
    ["seekto", (details) => details.seekTime !== undefined && controls.seek(details.seekTime)],
  ];
  for (const [action, handler] of handlers) {
    try {
      session.setActionHandler(action, handler);
    } catch {
      // Some browsers throw for actions they do not support. Those are simply unavailable.
    }
  }
}

export function updateMediaSession(playing: boolean, elapsed: number, total: number, rate: number) {
  if (!supported()) return;
  navigator.mediaSession.playbackState = playing ? "playing" : "paused";
  try {
    if (total > 0) navigator.mediaSession.setPositionState({ duration: total, position: Math.min(elapsed, total), playbackRate: rate });
  } catch {
    // Position state is a nicety. A browser rejecting it should not interrupt reading.
  }
}

export function detachMediaSession() {
  if (!supported()) return;
  navigator.mediaSession.metadata = null;
  navigator.mediaSession.playbackState = "none";
}
