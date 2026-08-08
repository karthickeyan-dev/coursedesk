/** Shared player constants and UI types. */

export const SEEK_STEP = 5;
export const VOLUME_STEP = 0.1;
export const HUD_MS = 900;
export const PERSIST_MS = 2000;
export const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const;

export type HudKey =
  | "play"
  | "pause"
  | "seekBack"
  | "seekForward"
  | "volumeHigh"
  | "volumeLow"
  | "volumeMute"
  | "fullscreen"
  | "exitFullscreen"
  | "jumpStart"
  | "jumpEnd"
  | "jump";

export interface HudState {
  key: HudKey;
  label: string;
  meter?: number;
  visible: boolean;
}

export interface PlayerUiState {
  playing: boolean;
  muted: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  seekPercent: number;
  showRemaining: boolean;
  rate: number;
  fullscreen: boolean;
  hasSrc: boolean;
  hud: HudState;
}

export const initialPlayerUi: PlayerUiState = {
  playing: false,
  muted: false,
  volume: 1,
  currentTime: 0,
  duration: 0,
  seekPercent: 0,
  showRemaining: true,
  rate: 1,
  fullscreen: false,
  hasSrc: false,
  hud: { key: "play", label: "", visible: false },
};
