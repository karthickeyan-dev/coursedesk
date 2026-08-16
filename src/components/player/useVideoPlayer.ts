import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { applyResumeSeconds, formatRate, formatTime } from "../../lib/format";
import {
  exitFullscreen,
  getFullscreenElement,
  requestFullscreen,
} from "./fullscreen";
import {
  HUD_MS,
  initialPlayerUi,
  PERSIST_MS,
  PLAYBACK_RATES,
  SEEK_STEP,
  VOLUME_STEP,
  type HudKey,
  type PlayerUiState,
} from "./playerTypes";

// Re-export for stable consumer import paths (PlayerControls, PlayerHud, App).
export {
  HUD_MS,
  PERSIST_MS,
  PLAYBACK_RATES,
  SEEK_STEP,
  VOLUME_STEP,
  type HudKey,
  type HudState,
  type PlayerUiState,
} from "./playerTypes";

export function isEditableTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof Element)) return false;
  const tag = target.tagName;
  if (tag === "TEXTAREA" || tag === "SELECT") return true;
  if (tag === "INPUT") {
    const type = (target.getAttribute("type") || "text").toLowerCase();
    return ![
      "button",
      "checkbox",
      "color",
      "file",
      "hidden",
      "image",
      "radio",
      "range",
      "reset",
      "submit",
    ].includes(type);
  }
  if ((target as HTMLElement).isContentEditable) return true;
  return !!target.closest("[contenteditable='true']");
}

export interface UseVideoPlayerOptions {
  videoRef: RefObject<HTMLVideoElement | null>;
  stageRef: RefObject<HTMLElement | null>;
  onTimePersist?: (seconds: number) => void;
  enabled?: boolean;
}

export interface UseVideoPlayerApi {
  ui: PlayerUiState;
  showVideo: (src: string, options?: { startTime?: number }) => void;
  hideVideo: () => void;
  persistTimeNow: () => void;
  isVideoActive: () => boolean;
  togglePlayPause: (fromKeyboard?: boolean) => void;
  toggleMute: (fromKeyboard?: boolean) => void;
  toggleFullscreen: (fromKeyboard?: boolean) => void;
  seekFromBar: (percent: number) => void;
  volumeFromBar: (percent: number) => void;
  toggleDurationDisplay: () => void;
  setPlaybackRate: (rate: number, fromKeyboard?: boolean) => void;
  formatTime: typeof formatTime;
  formatRate: typeof formatRate;
}

export function useVideoPlayer(options: UseVideoPlayerOptions): UseVideoPlayerApi {
  const { videoRef, stageRef, onTimePersist, enabled = true } = options;
  const [ui, setUi] = useState<PlayerUiState>(initialPlayerUi);

  const lastVolumeRef = useRef(1);
  const pendingResumeRef = useRef<number | null>(null);
  const lastPersistAtRef = useRef(0);
  const hudTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onTimePersistRef = useRef(onTimePersist);
  onTimePersistRef.current = onTimePersist;

  const isVideoActive = useCallback((): boolean => {
    const video = videoRef.current;
    if (!video || !enabled) return false;
    return !video.classList.contains("hidden") && !!video.getAttribute("src");
  }, [videoRef, enabled]);

  const showHud = useCallback((key: HudKey, label: string, meter?: number) => {
    setUi((prev) => ({
      ...prev,
      hud: { key, label, meter, visible: true },
    }));
    if (hudTimerRef.current) clearTimeout(hudTimerRef.current);
    hudTimerRef.current = setTimeout(() => {
      setUi((prev) => ({
        ...prev,
        hud: { ...prev.hud, visible: false },
      }));
      hudTimerRef.current = null;
    }, HUD_MS);
  }, []);

  const syncFromVideo = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    const time = Number.isFinite(video.currentTime) ? video.currentTime : 0;
    const percent = duration > 0 ? (time / duration) * 100 : 0;
    const muted = video.muted || video.volume === 0;
    const volume = muted ? 0 : video.volume;
    setUi((prev) => ({
      ...prev,
      playing: !video.paused && !video.ended,
      muted,
      volume,
      currentTime: time,
      duration,
      seekPercent: percent,
      rate: video.playbackRate || 1,
      hasSrc: !!video.getAttribute("src"),
    }));
  }, [videoRef]);

  const persistTimeNow = useCallback(() => {
    const video = videoRef.current;
    if (!video || !isVideoActive()) return;
    if (!Number.isFinite(video.currentTime)) return;
    onTimePersistRef.current?.(video.currentTime);
    lastPersistAtRef.current = Date.now();
  }, [videoRef, isVideoActive]);

  const maybePersistTime = useCallback(() => {
    if (!isVideoActive()) return;
    const now = Date.now();
    if (now - lastPersistAtRef.current < PERSIST_MS) return;
    lastPersistAtRef.current = now;
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.currentTime)) return;
    onTimePersistRef.current?.(video.currentTime);
  }, [videoRef, isVideoActive]);

  const applyResume = useCallback(
    (seconds: number) => {
      const video = videoRef.current;
      if (!video) return;
      const next = applyResumeSeconds(seconds, video.duration);
      if (next != null) video.currentTime = next;
      syncFromVideo();
    },
    [videoRef, syncFromVideo]
  );

  const showVideo = useCallback(
    (src: string, opts: { startTime?: number } = {}) => {
      const video = videoRef.current;
      if (!video) return;
      const startTime =
        typeof opts.startTime === "number" && Number.isFinite(opts.startTime)
          ? opts.startTime
          : null;

      video.classList.remove("hidden");
      const sameSrc = video.getAttribute("src") === src;
      if (!sameSrc) {
        pendingResumeRef.current = startTime;
        video.src = src;
      } else if (startTime != null && startTime > 0) {
        if (Number.isFinite(video.duration) && video.duration > 0) {
          applyResume(startTime);
        } else {
          pendingResumeRef.current = startTime;
        }
      } else {
        video.currentTime = 0;
      }
      syncFromVideo();
    },
    [videoRef, applyResume, syncFromVideo]
  );

  const hideVideo = useCallback(() => {
    persistTimeNow();
    pendingResumeRef.current = null;
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    video.removeAttribute("src");
    video.load();
    video.classList.add("hidden");
    setUi((prev) => ({
      ...prev,
      hasSrc: false,
      playing: false,
      currentTime: 0,
      duration: 0,
      seekPercent: 0,
      hud: { ...prev.hud, visible: false },
    }));
  }, [videoRef, persistTimeNow]);

  const togglePlayPause = useCallback(
    (fromKeyboard = false) => {
      const video = videoRef.current;
      if (!video || !isVideoActive()) return;
      if (!video.paused && !video.ended) {
        video.pause();
        if (fromKeyboard) showHud("pause", "Pause");
      } else {
        void video.play().catch(() => {});
        if (fromKeyboard) showHud("play", "Play");
      }
    },
    [videoRef, isVideoActive, showHud]
  );

  const toggleMute = useCallback(
    (fromKeyboard = false) => {
      const video = videoRef.current;
      if (!video || !isVideoActive()) return;
      const muted = video.muted || video.volume === 0;
      if (!muted) {
        if (video.volume > 0) lastVolumeRef.current = video.volume;
        video.muted = true;
        if (fromKeyboard) showHud("volumeMute", "Muted", 0);
      } else {
        video.muted = false;
        if (video.volume === 0) video.volume = lastVolumeRef.current || VOLUME_STEP;
        if (fromKeyboard) {
          const key = video.volume <= 0.5 ? "volumeLow" : "volumeHigh";
          showHud(key, "Unmuted", video.volume);
        }
      }
      syncFromVideo();
    },
    [videoRef, isVideoActive, showHud, syncFromVideo]
  );

  const isFullscreenActive = useCallback((): boolean => {
    const stage = stageRef.current;
    const video = videoRef.current;
    const fs = getFullscreenElement();
    return !!(fs && stage && (fs === stage || stage.contains(fs) || fs === video));
  }, [stageRef, videoRef]);

  const toggleFullscreen = useCallback(
    (fromKeyboard = false) => {
      const video = videoRef.current;
      const stage = stageRef.current;
      if (!video || !isVideoActive()) return;
      if (isFullscreenActive()) {
        void exitFullscreen().catch(() => {});
        if (fromKeyboard) showHud("exitFullscreen", "Exit fullscreen");
        return;
      }
      if (stage) {
        void requestFullscreen(stage)
          .catch(() => requestFullscreen(video))
          .catch((err) => console.warn("Fullscreen failed:", err));
      } else {
        void requestFullscreen(video).catch((err) =>
          console.warn("Fullscreen failed:", err)
        );
      }
      if (fromKeyboard) showHud("fullscreen", "Fullscreen");
    },
    [videoRef, stageRef, isVideoActive, isFullscreenActive, showHud]
  );

  const seekBy = useCallback(
    (deltaSeconds: number, fromKeyboard: boolean) => {
      const video = videoRef.current;
      if (!video || !isVideoActive()) return;
      const duration = video.duration;
      if (!Number.isFinite(duration) || duration <= 0) return;
      video.currentTime = Math.max(0, Math.min(duration, video.currentTime + deltaSeconds));
      syncFromVideo();
      if (fromKeyboard) {
        const label = `${deltaSeconds >= 0 ? "+" : ""}${deltaSeconds}s`;
        showHud(deltaSeconds >= 0 ? "seekForward" : "seekBack", label);
      }
    },
    [videoRef, isVideoActive, syncFromVideo, showHud]
  );

  const seekToFraction = useCallback(
    (fraction: number, fromKeyboard: boolean) => {
      const video = videoRef.current;
      if (!video || !isVideoActive()) return;
      const duration = video.duration;
      if (!Number.isFinite(duration) || duration <= 0) return;
      video.currentTime = Math.max(0, Math.min(duration, duration * fraction));
      syncFromVideo();
      if (fromKeyboard) {
        if (fraction <= 0) showHud("jumpStart", "Start");
        else if (fraction >= 1) showHud("jumpEnd", "End");
        else showHud("jump", `${Math.round(fraction * 100)}%`);
      }
    },
    [videoRef, isVideoActive, syncFromVideo, showHud]
  );

  const adjustVolume = useCallback(
    (delta: number, fromKeyboard: boolean) => {
      const video = videoRef.current;
      if (!video || !isVideoActive()) return;
      const base = video.muted || video.volume === 0 ? 0 : video.volume;
      const next = Math.max(0, Math.min(1, base + delta));
      video.volume = next;
      if (next > 0) {
        video.muted = false;
        lastVolumeRef.current = next;
      } else {
        video.muted = true;
      }
      syncFromVideo();
      if (fromKeyboard) {
        const pct = Math.round(next * 100);
        let key: HudKey = "volumeHigh";
        if (next === 0) key = "volumeMute";
        else if (next <= 0.5) key = "volumeLow";
        showHud(key, `Volume ${pct}%`, next);
      }
    },
    [videoRef, isVideoActive, syncFromVideo, showHud]
  );

  const seekFromBar = useCallback(
    (percent: number) => {
      const video = videoRef.current;
      if (!video) return;
      const duration = video.duration;
      if (!Number.isFinite(duration) || duration <= 0) return;
      video.currentTime = (percent / 100) * duration;
      setUi((prev) => ({ ...prev, seekPercent: percent, currentTime: video.currentTime }));
    },
    [videoRef]
  );

  const volumeFromBar = useCallback(
    (percent: number) => {
      const video = videoRef.current;
      if (!video) return;
      const next = Math.max(0, Math.min(1, percent / 100));
      video.volume = next;
      video.muted = next === 0;
      if (next > 0) lastVolumeRef.current = next;
      syncFromVideo();
    },
    [videoRef, syncFromVideo]
  );

  const toggleDurationDisplay = useCallback(() => {
    setUi((prev) => ({ ...prev, showRemaining: !prev.showRemaining }));
  }, []);

  const setPlaybackRate = useCallback(
    (rate: number, fromKeyboard = false) => {
      const video = videoRef.current;
      if (!video || !isVideoActive()) return;
      if (!Number.isFinite(rate) || rate <= 0) return;
      const nearest =
        PLAYBACK_RATES.find((r) => Math.abs(r - rate) < 0.001) ??
        PLAYBACK_RATES.reduce((best, r) =>
          Math.abs(r - rate) < Math.abs(best - rate) ? r : best
        );
      video.playbackRate = nearest;
      setUi((prev) => ({ ...prev, rate: nearest }));
      if (fromKeyboard) showHud("jump", formatRate(nearest));
    },
    [videoRef, isVideoActive, showHud]
  );

  const cyclePlaybackRate = useCallback(
    (delta: number, fromKeyboard: boolean) => {
      const video = videoRef.current;
      if (!video) return;
      const current = video.playbackRate || 1;
      let idx = PLAYBACK_RATES.findIndex((r) => Math.abs(r - current) < 0.001);
      if (idx < 0) {
        idx = PLAYBACK_RATES.reduce(
          (best, r, i, arr) =>
            Math.abs(r - current) < Math.abs(arr[best] - current) ? i : best,
          0
        );
      }
      const next =
        PLAYBACK_RATES[Math.max(0, Math.min(PLAYBACK_RATES.length - 1, idx + delta))];
      setPlaybackRate(next, fromKeyboard);
    },
    [videoRef, setPlaybackRate]
  );

  // Media + lifecycle listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => syncFromVideo();
    const onPause = () => {
      syncFromVideo();
      persistTimeNow();
    };
    const onEnded = () => {
      syncFromVideo();
      if (Number.isFinite(video.duration)) onTimePersistRef.current?.(video.duration);
    };
    const onTimeUpdate = () => {
      syncFromVideo();
      maybePersistTime();
    };
    const onLoadedMetadata = () => {
      if (pendingResumeRef.current != null) {
        applyResume(pendingResumeRef.current);
        pendingResumeRef.current = null;
      }
      syncFromVideo();
    };
    const onVolumeChange = () => {
      if (!video.muted && video.volume > 0) lastVolumeRef.current = video.volume;
      syncFromVideo();
    };
    const onRateChange = () => syncFromVideo();
    const onEmptied = () => syncFromVideo();
    const onPageHide = () => persistTimeNow();
    const onVis = () => {
      if (document.visibilityState === "hidden") persistTimeNow();
    };
    const onFs = () => {
      setUi((prev) => ({ ...prev, fullscreen: isFullscreenActive() }));
    };

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("ended", onEnded);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("volumechange", onVolumeChange);
    video.addEventListener("ratechange", onRateChange);
    video.addEventListener("emptied", onEmptied);
    window.addEventListener("pagehide", onPageHide);
    document.addEventListener("visibilitychange", onVis);
    for (const eventName of [
      "fullscreenchange",
      "webkitfullscreenchange",
      "mozfullscreenchange",
      "MSFullscreenChange",
    ]) {
      document.addEventListener(eventName, onFs);
    }

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("volumechange", onVolumeChange);
      video.removeEventListener("ratechange", onRateChange);
      video.removeEventListener("emptied", onEmptied);
      window.removeEventListener("pagehide", onPageHide);
      document.removeEventListener("visibilitychange", onVis);
      for (const eventName of [
        "fullscreenchange",
        "webkitfullscreenchange",
        "mozfullscreenchange",
        "MSFullscreenChange",
      ]) {
        document.removeEventListener(eventName, onFs);
      }
      if (hudTimerRef.current) clearTimeout(hudTimerRef.current);
    };
  }, [
    videoRef,
    syncFromVideo,
    persistTimeNow,
    maybePersistTime,
    applyResume,
    isFullscreenActive,
  ]);

  // Keyboard
  useEffect(() => {
    if (!enabled) return;

    const onKey = (event: KeyboardEvent) => {
      if (!isVideoActive()) return;
      if (event.defaultPrevented) return;
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (isEditableTarget(event.target)) return;

      let handled = true;
      switch (event.key) {
        case " ":
        case "k":
        case "K":
          togglePlayPause(true);
          break;
        case "ArrowLeft":
        case "j":
        case "J":
          seekBy(-SEEK_STEP, true);
          break;
        case "ArrowRight":
        case "l":
        case "L":
          seekBy(SEEK_STEP, true);
          break;
        case "ArrowUp":
          adjustVolume(VOLUME_STEP, true);
          break;
        case "ArrowDown":
          adjustVolume(-VOLUME_STEP, true);
          break;
        case "m":
        case "M":
          toggleMute(true);
          break;
        case "f":
        case "F":
          toggleFullscreen(true);
          break;
        case "<":
        case ",":
          cyclePlaybackRate(-1, true);
          break;
        case ">":
        case ".":
          cyclePlaybackRate(1, true);
          break;
        case "Home":
          seekToFraction(0, true);
          break;
        case "End":
          seekToFraction(1, true);
          break;
        case "0":
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
        case "7":
        case "8":
        case "9":
          seekToFraction(Number(event.key) / 10, true);
          break;
        default:
          handled = false;
      }
      if (handled) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [
    enabled,
    isVideoActive,
    togglePlayPause,
    seekBy,
    adjustVolume,
    toggleMute,
    toggleFullscreen,
    cyclePlaybackRate,
    seekToFraction,
  ]);

  return {
    ui,
    showVideo,
    hideVideo,
    persistTimeNow,
    isVideoActive,
    togglePlayPause,
    toggleMute,
    toggleFullscreen,
    seekFromBar,
    volumeFromBar,
    toggleDurationDisplay,
    setPlaybackRate,
    formatTime,
    formatRate,
  };
}
