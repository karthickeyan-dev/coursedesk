import {
  Maximize,
  Pause,
  Play,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";
import { PLAYBACK_RATES, type PlayerUiState, type UseVideoPlayerApi } from "./useVideoPlayer";

interface Props {
  ui: PlayerUiState;
  api: UseVideoPlayerApi;
}

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
    <div className="player-controls">
      <button
        type="button"
        className="pc-btn"
        aria-label={ui.playing ? "Pause" : "Play"}
        onClick={() => api.togglePlayPause(false)}
      >
        {ui.playing ? (
          <Pause size={18} className="icon-pause" fill="currentColor" />
        ) : (
          <Play size={18} className="icon-play" fill="currentColor" />
        )}
      </button>

      <div className="pc-time">{api.formatTime(ui.currentTime)}</div>

      <input
        type="range"
        className="pc-seek"
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
        className="pc-time pc-duration"
        aria-label={ui.showRemaining ? "Show total duration" : "Show remaining time"}
        title={ui.showRemaining ? "Click to show total duration" : "Click to show remaining time"}
        onClick={api.toggleDurationDisplay}
      >
        {durationLabel}
      </button>

      <div className="pc-volume">
        <div className="pc-volume-flyout">
          <input
            type="range"
            className="pc-volume-slider"
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
          className="pc-btn"
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

      <div className="pc-speed">
        <button
          type="button"
          className="pc-btn pc-speed-btn"
          aria-label="Playback speed"
          aria-haspopup="listbox"
          title={`Playback speed ${api.formatRate(ui.rate)}`}
        >
          {api.formatRate(ui.rate)}
        </button>
        <div className="pc-speed-menu" role="listbox" aria-label="Playback speed">
          {PLAYBACK_RATES.map((rate) => (
            <button
              key={rate}
              type="button"
              className="pc-speed-option"
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
        className="pc-btn"
        aria-label={ui.fullscreen ? "Exit fullscreen" : "Fullscreen"}
        title={ui.fullscreen ? "Exit fullscreen" : "Fullscreen"}
        onClick={() => api.toggleFullscreen(false)}
      >
        <Maximize size={18} />
      </button>
    </div>
  );
}
