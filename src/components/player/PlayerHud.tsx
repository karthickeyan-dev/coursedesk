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
  const showMeter = meter != null && Number.isFinite(meter);

  return (
    <div
      className={[
        "pointer-events-none absolute inset-0 z-[4] grid place-items-center transition-opacity duration-[180ms]",
        hud.visible ? "opacity-100" : "opacity-0",
      ].join(" ")}
      aria-hidden={!hud.visible}
    >
      <div
        className={[
          "flex min-w-28 max-w-[min(220px,80%)] flex-col items-center gap-2 rounded-[14px] bg-black/72 px-6 py-[18px] text-white shadow-[0_10px_28px_rgba(0,0,0,0.4)] backdrop-blur-[6px] transition-transform duration-[180ms]",
          hud.visible ? "scale-100" : "scale-[0.94]",
        ].join(" ")}
      >
        <div className="grid h-9 w-9 place-items-center text-white">
          <Icon size={36} strokeWidth={2} className="block" />
        </div>
        <div className="text-center text-[13px] font-semibold tracking-wide whitespace-nowrap text-[#f7f9fa]">
          {hud.label}
        </div>
        <div
          className="mt-0.5 h-1 w-[120px] overflow-hidden rounded-full bg-white/22"
          hidden={!showMeter}
        >
          <div
            className="h-full rounded-full bg-white transition-[width] duration-100"
            style={{
              width: showMeter
                ? `${Math.max(0, Math.min(100, (meter ?? 0) * 100))}%`
                : "0%",
            }}
          />
        </div>
      </div>
    </div>
  );
}
