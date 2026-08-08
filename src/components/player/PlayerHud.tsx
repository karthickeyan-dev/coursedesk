import {
  FastForward,
  Gauge,
  Maximize,
  Minimize,
  Pause,
  Play,
  Rewind,
  SkipBack,
  SkipForward,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { HudKey, HudState } from "./useVideoPlayer";

const ICONS: Record<HudKey, typeof Play> = {
  play: Play,
  pause: Pause,
  seekBack: Rewind,
  seekForward: FastForward,
  volumeHigh: Volume2,
  volumeLow: Volume1,
  volumeMute: VolumeX,
  fullscreen: Maximize,
  exitFullscreen: Minimize,
  jumpStart: SkipBack,
  jumpEnd: SkipForward,
  jump: Gauge,
};

export function PlayerHud({ hud }: { hud: HudState }) {
  const Icon = ICONS[hud.key] ?? Play;
  const meter = hud.meter;
  const showMeter = meter != null && isFinite(meter);

  return (
    <div
      className={`player-hud${hud.visible ? " is-visible" : ""}`}
      aria-hidden={!hud.visible}
    >
      <div className="player-hud-pill">
        <div className="player-hud-icon">
          <Icon size={36} strokeWidth={2} />
        </div>
        <div className="player-hud-label">{hud.label}</div>
        <div className="player-hud-meter" hidden={!showMeter}>
          <div
            className="player-hud-meter-fill"
            style={{ width: showMeter ? `${Math.max(0, Math.min(100, (meter ?? 0) * 100))}%` : "0%" }}
          />
        </div>
      </div>
    </div>
  );
}
