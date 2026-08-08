import {
  Maximize,
  Pause,
  Play,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  PLAYBACK_RATES,
  type PlayerUiState,
  type UseVideoPlayerApi,
} from "./useVideoPlayer";

interface Props {
  ui: PlayerUiState;
  api: UseVideoPlayerApi;
}

const pcBtn =
  "grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-sm border-0 bg-transparent text-inherit hover:bg-white/8";

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

  return (
    <div className="player-controls box-border flex w-full shrink-0 items-center gap-2.5 border-t border-[#2a2a2a] bg-[#141414] px-3.5 py-2.5 text-[#f7f9fa]">
      <button
        type="button"
        className={pcBtn}
        aria-label={ui.playing ? "Pause" : "Play"}
        onClick={() => api.togglePlayPause(false)}
      >
        {ui.playing ? (
          <Pause size={18} fill="currentColor" />
        ) : (
          <Play size={18} fill="currentColor" />
        )}
      </button>

      <div className="min-w-10 shrink-0 text-xs text-[#d1d7dc] tabular-nums">
        {api.formatTime(ui.currentTime)}
      </div>

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
        className="m-0 min-w-11 shrink-0 cursor-pointer appearance-none border-0 bg-transparent p-0 text-left text-xs text-[#d1d7dc] tabular-nums hover:bg-transparent focus:outline-none focus-visible:rounded-sm focus-visible:shadow-[0_0_0_2px_rgba(164,53,240,0.45)]"
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
        <button
          type="button"
          className={pcBtn}
          aria-label={ui.muted ? "Unmute" : "Mute"}
          onClick={() => api.toggleMute(false)}
        >
          {ui.muted || ui.volume === 0 ? (
            <VolumeX size={18} fill="currentColor" />
          ) : ui.volume <= 0.5 ? (
            <Volume1 size={18} fill="currentColor" />
          ) : (
            <Volume2 size={18} fill="currentColor" />
          )}
        </button>
      </div>

      <div className="group relative shrink-0">
        <button
          type="button"
          className={`${pcBtn} min-w-10 text-xs font-semibold tracking-wide tabular-nums`}
          aria-label="Playback speed"
          aria-haspopup="listbox"
          title={`Playback speed ${api.formatRate(ui.rate)}`}
        >
          {api.formatRate(ui.rate)}
        </button>
        <div
          className="absolute right-0 bottom-[calc(100%+6px)] z-[6] hidden min-w-[72px] gap-0.5 rounded-lg border border-[#3e4143] bg-[#1c1d1f] py-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.45)] after:absolute after:top-full after:right-0 after:left-0 after:h-2 after:content-[''] group-hover:grid group-focus-within:grid"
          role="listbox"
          aria-label="Playback speed"
        >
          {PLAYBACK_RATES.map((rate) => (
            <button
              key={rate}
              type="button"
              className={[
                "w-full cursor-pointer appearance-none border-0 bg-transparent px-3.5 py-2 text-left text-xs font-medium text-[#d1d7dc] tabular-nums hover:bg-white/8 hover:text-white",
                Math.abs(rate - ui.rate) < 0.001
                  ? "bg-[rgba(164,53,240,0.22)] text-white"
                  : "",
              ].join(" ")}
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

      <button
        type="button"
        className={pcBtn}
        aria-label={ui.fullscreen ? "Exit fullscreen" : "Fullscreen"}
        title={ui.fullscreen ? "Exit fullscreen" : "Fullscreen"}
        onClick={() => api.toggleFullscreen(false)}
      >
        <Maximize size={18} />
      </button>
    </div>
  );
}
