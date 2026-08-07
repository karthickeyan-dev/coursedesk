import { Icons } from "./icons";

const SEEK_STEP = 5;
const VOLUME_STEP = 0.1;
const HUD_MS = 900;
const PERSIST_MS = 2000;

export function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const s = total % 60;
  const m = Math.floor(total / 60) % 60;
  const h = Math.floor(total / 3600);
  const ss = String(s).padStart(2, "0");
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${ss}`;
  return `${m}:${ss}`;
}

export interface PlayerElements {
  video: HTMLVideoElement;
  stage: HTMLElement;
  controls: HTMLElement;
  playPauseBtn: HTMLButtonElement;
  muteBtn: HTMLButtonElement;
  fullscreenBtn: HTMLButtonElement;
  seekBar: HTMLInputElement;
  volumeBar: HTMLInputElement | null;
  currentTime: HTMLElement;
  durationTime: HTMLElement;
  hud: HTMLElement | null;
  hudIcon: HTMLElement | null;
  hudLabel: HTMLElement | null;
  hudMeter: HTMLElement | null;
  hudMeterFill: HTMLElement | null;
}

export interface VideoPlayer {
  bindEvents(): void;
  showVideo(src: string, options?: { startTime?: number }): void;
  hideVideo(): void;
  formatTime: typeof formatTime;
  setTimePersistHandler(fn: ((seconds: number) => void) | null): void;
  persistTimeNow(): void;
}

function getFullscreenElement(): Element | null {
  const doc = document as Document & {
    webkitFullscreenElement?: Element | null;
    mozFullScreenElement?: Element | null;
    msFullscreenElement?: Element | null;
  };
  return (
    document.fullscreenElement ||
    doc.webkitFullscreenElement ||
    doc.mozFullScreenElement ||
    doc.msFullscreenElement ||
    null
  );
}

function requestFullscreen(element: HTMLElement): Promise<void> {
  const el = element as HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void> | void;
    webkitRequestFullScreen?: () => Promise<void> | void;
    mozRequestFullScreen?: () => Promise<void> | void;
    msRequestFullscreen?: () => Promise<void> | void;
    webkitEnterFullscreen?: () => void;
  };

  if (el.requestFullscreen) return el.requestFullscreen();
  if (el.webkitRequestFullscreen) return Promise.resolve(el.webkitRequestFullscreen());
  if (el.webkitRequestFullScreen) return Promise.resolve(el.webkitRequestFullScreen());
  if (el.mozRequestFullScreen) return Promise.resolve(el.mozRequestFullScreen());
  if (el.msRequestFullscreen) return Promise.resolve(el.msRequestFullscreen());
  if (el.webkitEnterFullscreen) {
    el.webkitEnterFullscreen();
    return Promise.resolve();
  }
  return Promise.reject(new Error("Fullscreen API not available"));
}

function exitFullscreen(): Promise<void> {
  const doc = document as Document & {
    webkitExitFullscreen?: () => Promise<void> | void;
    webkitCancelFullScreen?: () => Promise<void> | void;
    mozCancelFullScreen?: () => Promise<void> | void;
    msExitFullscreen?: () => Promise<void> | void;
  };
  if (document.exitFullscreen) return document.exitFullscreen();
  if (doc.webkitExitFullscreen) return Promise.resolve(doc.webkitExitFullscreen());
  if (doc.webkitCancelFullScreen) return Promise.resolve(doc.webkitCancelFullScreen());
  if (doc.mozCancelFullScreen) return Promise.resolve(doc.mozCancelFullScreen());
  if (doc.msExitFullscreen) return Promise.resolve(doc.msExitFullscreen());
  return Promise.resolve();
}

function isEditableTarget(target: EventTarget | null): boolean {
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

export function createVideoPlayer(elements: PlayerElements): VideoPlayer {
  const {
    video,
    stage,
    controls,
    playPauseBtn,
    muteBtn,
    fullscreenBtn,
    seekBar,
    volumeBar,
    currentTime,
    durationTime,
    hud,
    hudIcon,
    hudLabel,
    hudMeter,
    hudMeterFill,
  } = elements;

  let lastVolume = video.volume > 0 ? video.volume : 1;
  let hudTimer: ReturnType<typeof setTimeout> | null = null;
  let pendingResumeTime: number | null = null;
  let onTimePersist: ((seconds: number) => void) | null = null;
  let lastPersistAt = 0;

  function isVideoActive(): boolean {
    return !video.classList.contains("hidden") && !!video.getAttribute("src");
  }

  function isPlaying(): boolean {
    return !video.paused && !video.ended;
  }

  function isMuted(): boolean {
    return video.muted || video.volume === 0;
  }

  function effectiveVolume(): number {
    return isMuted() ? 0 : video.volume;
  }

  function isFullscreenActive(): boolean {
    const fs = getFullscreenElement();
    return !!(fs && (fs === stage || stage.contains(fs) || fs === video));
  }

  function setControlsVisible(show: boolean): void {
    if (show) controls.removeAttribute("hidden");
    else controls.setAttribute("hidden", "");
  }

  function setSeekProgress(percent: number): void {
    const clamped = Math.max(0, Math.min(100, percent));
    seekBar.value = String(clamped);
    seekBar.style.setProperty("--seek-progress", `${clamped}%`);
  }

  function setVolumeProgress(percent: number): void {
    if (!volumeBar) return;
    const clamped = Math.max(0, Math.min(100, percent));
    volumeBar.value = String(Math.round(clamped));
    volumeBar.style.setProperty("--volume-progress", `${clamped}%`);
  }

  function showHud(iconKey: string, label: string, opts?: { meter?: number }): void {
    if (!hud || !hudIcon || !hudLabel) return;
    const meter = opts?.meter;

    hudIcon.innerHTML = Icons.hud(iconKey);
    hudLabel.textContent = label;

    if (hudMeter && hudMeterFill && meter != null && isFinite(meter)) {
      const pct = Math.max(0, Math.min(100, meter * 100));
      hudMeter.hidden = false;
      hudMeterFill.style.width = `${pct}%`;
    } else if (hudMeter) {
      hudMeter.hidden = true;
      if (hudMeterFill) hudMeterFill.style.width = "0%";
    }

    hud.classList.remove("is-visible");
    void hud.offsetWidth;
    hud.classList.add("is-visible");
    hud.setAttribute("aria-hidden", "false");

    if (hudTimer) clearTimeout(hudTimer);
    hudTimer = setTimeout(() => {
      hud.classList.remove("is-visible");
      hud.setAttribute("aria-hidden", "true");
      hudTimer = null;
    }, HUD_MS);
  }

  function hideHud(): void {
    if (hudTimer) {
      clearTimeout(hudTimer);
      hudTimer = null;
    }
    if (hud) {
      hud.classList.remove("is-visible");
      hud.setAttribute("aria-hidden", "true");
    }
  }

  function updatePlayPauseUI(): void {
    const playing = isPlaying();
    playPauseBtn.querySelector(".icon-play")?.classList.toggle("hidden", playing);
    playPauseBtn.querySelector(".icon-pause")?.classList.toggle("hidden", !playing);
    playPauseBtn.setAttribute("aria-label", playing ? "Pause" : "Play");
  }

  function updateMuteUI(): void {
    const muted = isMuted();
    const vol = effectiveVolume();
    muteBtn.querySelector(".icon-vol")?.classList.toggle("hidden", muted || vol <= 0.5);
    muteBtn
      .querySelector(".icon-vol-low")
      ?.classList.toggle("hidden", muted || vol > 0.5 || vol <= 0);
    muteBtn.querySelector(".icon-mute")?.classList.toggle("hidden", !muted);
    muteBtn.setAttribute("aria-label", muted ? "Unmute" : "Mute");
    setVolumeProgress(vol * 100);
  }

  function updateSeekUI(): void {
    const duration = video.duration;
    const time = video.currentTime;
    currentTime.textContent = formatTime(time);
    durationTime.textContent = formatTime(duration);
    const percent = isFinite(duration) && duration > 0 ? (time / duration) * 100 : 0;
    setSeekProgress(percent);
  }

  function updateFullscreenUI(): void {
    const active = isFullscreenActive();
    fullscreenBtn.setAttribute("aria-label", active ? "Exit fullscreen" : "Fullscreen");
    fullscreenBtn.title = active ? "Exit fullscreen" : "Fullscreen";
  }

  function togglePlayPause(fromKeyboard: boolean): void {
    if (!isVideoActive()) return;
    if (isPlaying()) {
      video.pause();
      if (fromKeyboard) showHud("pause", "Pause");
    } else {
      void video.play().catch(() => {});
      if (fromKeyboard) showHud("play", "Play");
    }
  }

  function toggleMute(fromKeyboard: boolean): void {
    if (!isVideoActive()) return;
    if (!isMuted()) {
      if (video.volume > 0) lastVolume = video.volume;
      video.muted = true;
      if (fromKeyboard) showHud("volumeMute", "Muted", { meter: 0 });
    } else {
      video.muted = false;
      if (video.volume === 0) video.volume = lastVolume || VOLUME_STEP;
      if (fromKeyboard) {
        const key = video.volume <= 0.5 ? "volumeLow" : "volumeHigh";
        showHud(key, "Unmuted", { meter: video.volume });
      }
    }
    updateMuteUI();
  }

  function toggleFullscreen(fromKeyboard: boolean): void {
    if (!isVideoActive()) return;
    if (isFullscreenActive()) {
      void exitFullscreen().catch(() => {});
      if (fromKeyboard) showHud("exitFullscreen", "Exit fullscreen");
      return;
    }
    void requestFullscreen(stage)
      .catch(() => requestFullscreen(video))
      .catch((err) => console.warn("Fullscreen failed:", err));
    if (fromKeyboard) showHud("fullscreen", "Fullscreen");
  }

  function seekBy(deltaSeconds: number, fromKeyboard: boolean): void {
    if (!isVideoActive()) return;
    const duration = video.duration;
    if (!isFinite(duration) || duration <= 0) return;
    video.currentTime = Math.max(0, Math.min(duration, video.currentTime + deltaSeconds));
    updateSeekUI();
    if (fromKeyboard) {
      const label = `${deltaSeconds >= 0 ? "+" : ""}${deltaSeconds}s`;
      showHud(deltaSeconds >= 0 ? "seekForward" : "seekBack", label);
    }
  }

  function seekToFraction(fraction: number, fromKeyboard: boolean): void {
    if (!isVideoActive()) return;
    const duration = video.duration;
    if (!isFinite(duration) || duration <= 0) return;
    video.currentTime = Math.max(0, Math.min(duration, duration * fraction));
    updateSeekUI();
    if (fromKeyboard) {
      if (fraction <= 0) showHud("jumpStart", "Start");
      else if (fraction >= 1) showHud("jumpEnd", "End");
      else showHud("jump", `${Math.round(fraction * 100)}%`);
    }
  }

  function adjustVolume(delta: number, fromKeyboard: boolean): void {
    if (!isVideoActive()) return;
    const base = isMuted() ? 0 : video.volume;
    const next = Math.max(0, Math.min(1, base + delta));
    video.volume = next;
    if (next > 0) {
      video.muted = false;
      lastVolume = next;
    } else {
      video.muted = true;
    }
    updateMuteUI();
    if (fromKeyboard) {
      const pct = Math.round(next * 100);
      let key = "volumeHigh";
      if (next === 0) key = "volumeMute";
      else if (next <= 0.5) key = "volumeLow";
      showHud(key, `Volume ${pct}%`, { meter: next });
    }
  }

  function volumeFromBar(): void {
    if (!volumeBar) return;
    const next = Math.max(0, Math.min(1, Number(volumeBar.value) / 100));
    video.volume = next;
    video.muted = next === 0;
    if (next > 0) lastVolume = next;
    updateMuteUI();
  }

  function seekFromBar(): void {
    const duration = video.duration;
    if (!isFinite(duration) || duration <= 0) return;
    const percent = Number(seekBar.value);
    video.currentTime = (percent / 100) * duration;
    setSeekProgress(percent);
  }

  function handleKeydown(event: KeyboardEvent): void {
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
  }

  function applyResumeTime(seconds: number): void {
    const duration = video.duration;
    if (!isFinite(duration) || duration <= 0) return;
    const endThreshold = Math.max(5, duration * 0.02);
    if (seconds >= duration - endThreshold) {
      video.currentTime = 0;
    } else if (seconds > 2) {
      video.currentTime = Math.min(seconds, duration - 0.25);
    }
    updateSeekUI();
  }

  function showVideo(src: string, options: { startTime?: number } = {}): void {
    const startTime =
      typeof options.startTime === "number" && isFinite(options.startTime)
        ? options.startTime
        : null;

    video.classList.remove("hidden");
    setControlsVisible(true);

    const sameSrc = video.getAttribute("src") === src;
    if (!sameSrc) {
      pendingResumeTime = startTime;
      video.src = src;
    } else if (startTime != null && startTime > 0) {
      if (isFinite(video.duration) && video.duration > 0) {
        applyResumeTime(startTime);
      } else {
        pendingResumeTime = startTime;
      }
    }

    updatePlayPauseUI();
    updateSeekUI();
    updateMuteUI();
  }

  function persistTimeNow(): void {
    if (!onTimePersist || !isVideoActive()) return;
    if (!isFinite(video.currentTime)) return;
    onTimePersist(video.currentTime);
    lastPersistAt = Date.now();
  }

  function maybePersistTime(): void {
    if (!onTimePersist || !isVideoActive()) return;
    const now = Date.now();
    if (now - lastPersistAt < PERSIST_MS) return;
    lastPersistAt = now;
    if (!isFinite(video.currentTime)) return;
    onTimePersist(video.currentTime);
  }

  function hideVideo(): void {
    persistTimeNow();
    pendingResumeTime = null;
    video.pause();
    video.removeAttribute("src");
    video.load();
    video.classList.add("hidden");
    setControlsVisible(false);
    setSeekProgress(0);
    hideHud();
  }

  function setTimePersistHandler(fn: ((seconds: number) => void) | null): void {
    onTimePersist = typeof fn === "function" ? fn : null;
  }

  function bindEvents(): void {
    playPauseBtn.addEventListener("click", () => togglePlayPause(false));
    muteBtn.addEventListener("click", () => toggleMute(false));
    fullscreenBtn.addEventListener("click", () => toggleFullscreen(false));
    seekBar.addEventListener("input", seekFromBar);
    volumeBar?.addEventListener("input", volumeFromBar);

    video.addEventListener("click", () => togglePlayPause(false));
    video.addEventListener("dblclick", (event) => {
      event.preventDefault();
      if (isVideoActive()) toggleFullscreen(false);
    });

    document.addEventListener("keydown", handleKeydown);

    for (const eventName of [
      "fullscreenchange",
      "webkitfullscreenchange",
      "mozfullscreenchange",
      "MSFullscreenChange",
    ]) {
      document.addEventListener(eventName, updateFullscreenUI);
    }

    video.addEventListener("play", updatePlayPauseUI);
    video.addEventListener("pause", () => {
      updatePlayPauseUI();
      persistTimeNow();
    });
    video.addEventListener("ended", () => {
      updatePlayPauseUI();
      if (onTimePersist && isFinite(video.duration)) {
        onTimePersist(video.duration);
      }
    });
    video.addEventListener("timeupdate", () => {
      updateSeekUI();
      maybePersistTime();
    });
    video.addEventListener("loadedmetadata", () => {
      if (pendingResumeTime != null) {
        applyResumeTime(pendingResumeTime);
        pendingResumeTime = null;
      }
      updateSeekUI();
    });
    video.addEventListener("volumechange", () => {
      if (!isMuted() && video.volume > 0) lastVolume = video.volume;
      updateMuteUI();
    });
    video.addEventListener("emptied", () => {
      updatePlayPauseUI();
      updateSeekUI();
      updateMuteUI();
    });

    window.addEventListener("pagehide", persistTimeNow);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") persistTimeNow();
    });

    updatePlayPauseUI();
    updateMuteUI();
    updateSeekUI();
    updateFullscreenUI();
  }

  return {
    bindEvents,
    showVideo,
    hideVideo,
    formatTime,
    setTimePersistHandler,
    persistTimeNow,
  };
}
