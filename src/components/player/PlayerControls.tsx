import {
  Maximize,
  Minimize,
  Pause,
  Play,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  PLAYBACK_RATES,
  type PlayerUiState,
  type UseVideoPlayerApi,
} from "./useVideoPlayer";

interface Props {
  ui: PlayerUiState;
  api: UseVideoPlayerApi;
}

/** Shared time label style — current + duration stay the same size. */
const timeClass =
  "m-0 min-w-[3.25rem] shrink-0 border-0 bg-transparent p-0 text-left text-xs font-normal leading-none text-[#d1d7dc] tabular-nums";

const iconBtnClass =
  "h-9 w-9 shrink-0 rounded-md text-[#f7f9fa] hover:bg-white/10 hover:text-white";

const iconProps = {
  size: 20 as const,
  strokeWidth: 2 as const,
  className: "block size-5",
  "aria-hidden": true as const,
};

export function PlayerControls({ ui, api }: Props) {
  if (!ui.hasSrc) return null;

  const volPct = Math.round(ui.volume * 100);
  const durationLabel = (() => {
    if (!ui.duration) return ui.showRemaining ? "-0:00" : "0:00";
    if (ui.showRemaining) {
      const remaining = Math.max(0, ui.duration - ui.currentTime);
      return `-${api.formatTime(remaining)}`;
    }
    return api.formatTime(ui.duration);
  })();

  const VolumeIcon =
    ui.muted || ui.volume === 0
      ? VolumeX
      : ui.volume <= 0.5
        ? Volume1
        : Volume2;

  return (
    <div className="player-controls box-border flex w-full shrink-0 items-center gap-1.5 border-t border-[#2a2a2a] bg-[#141414] px-2.5 py-2 text-[#f7f9fa] sm:gap-2 sm:px-3.5 sm:py-2.5">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={iconBtnClass}
        aria-label={ui.playing ? "Pause" : "Play"}
        onClick={() => api.togglePlayPause(false)}
      >
        {ui.playing ? (
          <Pause {...iconProps} fill="currentColor" />
        ) : (
          <Play {...iconProps} fill="currentColor" />
        )}
      </Button>

      <span className={timeClass}>{api.formatTime(ui.currentTime)}</span>

      <input
        type="range"
        className="pc-seek min-w-0 flex-1"
        min={0}
        max={100}
        step={0.1}
        value={ui.seekPercent}
        aria-label="Seek"
        style={{ ["--seek-progress" as string]: `${ui.seekPercent}%` }}
        onChange={(e) => api.seekFromBar(Number(e.target.value))}
      />

      <button
        type="button"
        className={cn(
          timeClass,
          "cursor-pointer rounded-sm hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        )}
        aria-label={
          ui.showRemaining ? "Show total duration" : "Show remaining time"
        }
        title={
          ui.showRemaining
            ? "Click to show total duration"
            : "Click to show remaining time"
        }
        onClick={api.toggleDurationDisplay}
      >
        {durationLabel}
      </button>

      <div className="group relative flex shrink-0 items-center">
        <div className="absolute bottom-[calc(100%+6px)] left-1/2 z-[5] box-border hidden h-[120px] w-10 -translate-x-1/2 items-center justify-center rounded-lg border border-[#3e4143] bg-[#1c1d1f] py-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.45)] after:absolute after:top-full after:right-0 after:left-0 after:h-2 after:content-[''] group-hover:flex group-focus-within:flex">
          <input
            type="range"
            className="pc-volume-slider m-0 p-0"
            min={0}
            max={100}
            step={1}
            value={volPct}
            aria-label="Volume"
            aria-orientation="vertical"
            style={{ ["--volume-progress" as string]: `${volPct}%` }}
            onChange={(e) => api.volumeFromBar(Number(e.target.value))}
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={iconBtnClass}
          aria-label={ui.muted ? "Unmute" : "Mute"}
          onClick={() => api.toggleMute(false)}
        >
          <VolumeIcon {...iconProps} />
        </Button>
      </div>

      <div className="group relative shrink-0">
        <Button
          type="button"
          variant="ghost"
          className={cn(
            iconBtnClass,
            "min-w-10 px-1.5 text-xs font-medium tracking-wide tabular-nums"
          )}
          aria-label="Playback speed"
          aria-haspopup="listbox"
          title={`Playback speed ${api.formatRate(ui.rate)}`}
        >
          {api.formatRate(ui.rate)}
        </Button>
        <div
          className="absolute right-0 bottom-[calc(100%+6px)] z-[6] hidden min-w-[72px] gap-0.5 rounded-lg border border-[#3e4143] bg-[#1c1d1f] py-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.45)] after:absolute after:top-full after:right-0 after:left-0 after:h-2 after:content-[''] group-hover:grid group-focus-within:grid"
          role="listbox"
          aria-label="Playback speed"
        >
          {PLAYBACK_RATES.map((rate) => (
            <button
              key={rate}
              type="button"
              className={cn(
                "w-full cursor-pointer appearance-none border-0 bg-transparent px-3.5 py-2 text-left text-xs font-medium text-[#d1d7dc] tabular-nums hover:bg-white/8 hover:text-white",
                Math.abs(rate - ui.rate) < 0.001 &&
                  "bg-primary/25 text-white"
              )}
              role="option"
              data-rate={rate}
              aria-selected={Math.abs(rate - ui.rate) < 0.001}
              onClick={() => api.setPlaybackRate(rate, false)}
            >
              {api.formatRate(rate)}
            </button>
          ))}
        </div>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={iconBtnClass}
        aria-label={ui.fullscreen ? "Exit fullscreen" : "Fullscreen"}
        title={ui.fullscreen ? "Exit fullscreen" : "Fullscreen"}
        onClick={() => api.toggleFullscreen(false)}
      >
        {ui.fullscreen ? (
          <Minimize {...iconProps} />
        ) : (
          <Maximize {...iconProps} />
        )}
      </Button>
    </div>
  );
}
