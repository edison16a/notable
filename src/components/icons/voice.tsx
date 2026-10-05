import { Icon, type IconProps } from "./Icon";

export const MicIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="9" y="3.5" width="6" height="11" rx="3" />
    <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v2.5" />
  </Icon>
);

export const SpeakerIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4.5 9.5h3l4.5-4v13l-4.5-4h-3z" />
    <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
  </Icon>
);

export const WaveformIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 10v4M8 7v10M12 4v16M16 8v8M20 11v2" />
  </Icon>
);

/* Transport icons are filled so they read clearly inside the black round buttons. */

export const StopIcon = (p: IconProps) => (
  <Icon {...p} stroke="none">
    <rect x="7.5" y="7.5" width="9" height="9" rx="1.5" fill="currentColor" />
  </Icon>
);

export const PauseIcon = (p: IconProps) => (
  <Icon {...p} stroke="none">
    <rect x="7" y="6" width="3.2" height="12" rx="1" fill="currentColor" />
    <rect x="13.8" y="6" width="3.2" height="12" rx="1" fill="currentColor" />
  </Icon>
);

export const PlayIcon = (p: IconProps) => (
  <Icon {...p} stroke="none">
    <path d="M8.5 6.2v11.6a.8.8 0 0 0 1.2.7l9-5.8a.8.8 0 0 0 0-1.4l-9-5.8a.8.8 0 0 0-1.2.7z" fill="currentColor" />
  </Icon>
);

export const SkipBackIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6.5 6v12" />
    <path d="M17.5 6.8v10.4L10 12z" fill="currentColor" />
  </Icon>
);

export const SkipForwardIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M17.5 6v12" />
    <path d="M6.5 6.8v10.4L14 12z" fill="currentColor" />
  </Icon>
);
