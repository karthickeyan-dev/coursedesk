/**
 * Custom video player controls (play/pause, seek, mute/volume, fullscreen, keyboard).
 *
 * Keyboard shortcuts (when video is visible and focus is not in a form field):
 *   Space / K     — play / pause
 *   ← / J         — skip back 5s
 *   → / L         — skip forward 5s
 *   ↑ / ↓         — volume up / down (10%)
 *   M             — mute / unmute
 *   F             — fullscreen
 *   Home / End    — jump to start / end
 *   0–9           — jump to 0%–90% of duration
 */
(function (global) {
  "use strict";

  var SEEK_STEP = 5;
  var VOLUME_STEP = 0.1;
  var HUD_MS = 900;

  function formatTime(seconds) {
    if (!isFinite(seconds) || seconds < 0) return "0:00";
    const total = Math.floor(seconds);
    const s = total % 60;
    const m = Math.floor(total / 60) % 60;
    const h = Math.floor(total / 3600);
    const ss = String(s).padStart(2, "0");

    if (h > 0) return h + ":" + String(m).padStart(2, "0") + ":" + ss;
    return m + ":" + ss;
  }

  function getFullscreenElement() {
    return (
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement ||
      null
    );
  }

  function requestFullscreen(element) {
    if (!element) return Promise.reject(new Error("No element"));

    if (element.requestFullscreen) return element.requestFullscreen();
    if (element.webkitRequestFullscreen) return element.webkitRequestFullscreen();
    if (element.webkitRequestFullScreen) return element.webkitRequestFullScreen();
    if (element.mozRequestFullScreen) return element.mozRequestFullScreen();
    if (element.msRequestFullscreen) return element.msRequestFullscreen();

    // iOS Safari: fullscreen the video element itself
    if (element.webkitEnterFullscreen) {
      element.webkitEnterFullscreen();
      return Promise.resolve();
    }

    return Promise.reject(new Error("Fullscreen API not available"));
  }

  function exitFullscreen() {
    if (document.exitFullscreen) return document.exitFullscreen();
    if (document.webkitExitFullscreen) return document.webkitExitFullscreen();
    if (document.webkitCancelFullScreen) return document.webkitCancelFullScreen();
    if (document.mozCancelFullScreen) return document.mozCancelFullScreen();
    if (document.msExitFullscreen) return document.msExitFullscreen();
    return Promise.resolve();
  }

  function isEditableTarget(target) {
    if (!target || !(target instanceof Element)) return false;
    const tag = target.tagName;
    if (tag === "TEXTAREA" || tag === "SELECT") return true;
    if (tag === "INPUT") {
      const type = (target.getAttribute("type") || "text").toLowerCase();
      // Allow shortcuts when focus is on range/button-like controls
      return (
        [
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
        ].indexOf(type) === -1
      );
    }
    if (target.isContentEditable) return true;
    return !!target.closest("[contenteditable='true']");
  }

  /**
   * @param {object} elements
   * @param {HTMLVideoElement} elements.video
   * @param {HTMLElement} elements.stage
   * @param {HTMLElement} elements.controls
   * @param {HTMLButtonElement} elements.playPauseBtn
   * @param {HTMLButtonElement} elements.muteBtn
   * @param {HTMLButtonElement} elements.fullscreenBtn
   * @param {HTMLInputElement} elements.seekBar
   * @param {HTMLInputElement} [elements.volumeBar]
   * @param {HTMLElement} elements.currentTime
   * @param {HTMLElement} elements.durationTime
   * @param {HTMLElement} [elements.hud]
   * @param {HTMLElement} [elements.hudIcon]
   * @param {HTMLElement} [elements.hudLabel]
   * @param {HTMLElement} [elements.hudMeter]
   * @param {HTMLElement} [elements.hudMeterFill]
   */
  function createVideoPlayer(elements) {
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
    let hudTimer = null;

    function isVideoActive() {
      return !video.classList.contains("hidden") && !!video.getAttribute("src");
    }

    function isPlaying() {
      return !video.paused && !video.ended;
    }

    function isMuted() {
      return video.muted || video.volume === 0;
    }

    function effectiveVolume() {
      return isMuted() ? 0 : video.volume;
    }

    function isFullscreenActive() {
      const fs = getFullscreenElement();
      return !!(fs && (fs === stage || stage.contains(fs) || fs === video));
    }

    function setControlsVisible(show) {
      if (show) controls.removeAttribute("hidden");
      else controls.setAttribute("hidden", "");
    }

    function setSeekProgress(percent) {
      const clamped = Math.max(0, Math.min(100, percent));
      seekBar.value = String(clamped);
      seekBar.style.setProperty("--seek-progress", clamped + "%");
    }

    function setVolumeProgress(percent) {
      if (!volumeBar) return;
      const clamped = Math.max(0, Math.min(100, percent));
      volumeBar.value = String(Math.round(clamped));
      volumeBar.style.setProperty("--volume-progress", clamped + "%");
    }

    /**
     * Flash a keyboard-action overlay on the video.
     * Icons are Lucide (via CourseIcons.hud).
     * @param {string} iconKey play|pause|seekBack|seekForward|volumeHigh|…
     * @param {string} label
     * @param {{ meter?: number|null }} [opts] meter 0–1 shows volume bar
     */
    function showHud(iconKey, label, opts) {
      if (!hud || !hudIcon || !hudLabel) return;
      const meter = opts && opts.meter;
      const Icons = global.CourseIcons;

      hudIcon.innerHTML =
        Icons && typeof Icons.hud === "function" ? Icons.hud(iconKey) : "";
      hudLabel.textContent = label;

      if (hudMeter && hudMeterFill && meter != null && isFinite(meter)) {
        const pct = Math.max(0, Math.min(100, meter * 100));
        hudMeter.hidden = false;
        hudMeterFill.style.width = pct + "%";
      } else if (hudMeter) {
        hudMeter.hidden = true;
        if (hudMeterFill) hudMeterFill.style.width = "0%";
      }

      hud.classList.remove("is-visible");
      // Restart CSS animation / reflow so rapid keypresses re-show the pill
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

    function hideHud() {
      if (hudTimer) {
        clearTimeout(hudTimer);
        hudTimer = null;
      }
      if (hud) {
        hud.classList.remove("is-visible");
        hud.setAttribute("aria-hidden", "true");
      }
    }

    function updatePlayPauseUI() {
      const playing = isPlaying();
      const playIcon = playPauseBtn.querySelector(".icon-play");
      const pauseIcon = playPauseBtn.querySelector(".icon-pause");
      if (playIcon) playIcon.classList.toggle("hidden", playing);
      if (pauseIcon) pauseIcon.classList.toggle("hidden", !playing);
      playPauseBtn.setAttribute("aria-label", playing ? "Pause" : "Play");
    }

    function updateMuteUI() {
      const muted = isMuted();
      const vol = effectiveVolume();
      const volHigh = muteBtn.querySelector(".icon-vol");
      const volLow = muteBtn.querySelector(".icon-vol-low");
      const muteIcon = muteBtn.querySelector(".icon-mute");

      if (volHigh) volHigh.classList.toggle("hidden", muted || vol <= 0.5);
      if (volLow) volLow.classList.toggle("hidden", muted || vol > 0.5 || vol <= 0);
      if (muteIcon) muteIcon.classList.toggle("hidden", !muted);

      muteBtn.setAttribute("aria-label", muted ? "Unmute" : "Mute");
      setVolumeProgress(vol * 100);
    }

    function updateSeekUI() {
      const duration = video.duration;
      const time = video.currentTime;
      currentTime.textContent = formatTime(time);
      durationTime.textContent = formatTime(duration);
      const percent =
        isFinite(duration) && duration > 0 ? (time / duration) * 100 : 0;
      setSeekProgress(percent);
    }

    function updateFullscreenUI() {
      const active = isFullscreenActive();
      fullscreenBtn.setAttribute(
        "aria-label",
        active ? "Exit fullscreen" : "Fullscreen"
      );
      fullscreenBtn.title = active ? "Exit fullscreen" : "Fullscreen";
    }

    function togglePlayPause(fromKeyboard) {
      if (!isVideoActive()) return;
      if (isPlaying()) {
        video.pause();
        if (fromKeyboard) showHud("pause", "Pause");
      } else {
        video.play().catch(() => {});
        if (fromKeyboard) showHud("play", "Play");
      }
    }

    function toggleMute(fromKeyboard) {
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

    function toggleFullscreen(fromKeyboard) {
      if (!isVideoActive()) return;
      if (isFullscreenActive()) {
        exitFullscreen().catch(() => {});
        if (fromKeyboard) showHud("exitFullscreen", "Exit fullscreen");
        return;
      }
      // Prefer the stage so custom controls stay visible
      requestFullscreen(stage)
        .catch(() => requestFullscreen(video))
        .catch((err) => console.warn("Fullscreen failed:", err));
      if (fromKeyboard) showHud("fullscreen", "Fullscreen");
    }

    function seekBy(deltaSeconds, fromKeyboard) {
      if (!isVideoActive()) return;
      const duration = video.duration;
      if (!isFinite(duration) || duration <= 0) return;
      const next = Math.max(0, Math.min(duration, video.currentTime + deltaSeconds));
      video.currentTime = next;
      updateSeekUI();
      if (fromKeyboard) {
        const label = (deltaSeconds >= 0 ? "+" : "") + deltaSeconds + "s";
        showHud(deltaSeconds >= 0 ? "seekForward" : "seekBack", label);
      }
    }

    function seekToFraction(fraction, fromKeyboard) {
      if (!isVideoActive()) return;
      const duration = video.duration;
      if (!isFinite(duration) || duration <= 0) return;
      video.currentTime = Math.max(0, Math.min(duration, duration * fraction));
      updateSeekUI();
      if (fromKeyboard) {
        if (fraction <= 0) showHud("jumpStart", "Start");
        else if (fraction >= 1) showHud("jumpEnd", "End");
        else showHud("jump", Math.round(fraction * 100) + "%");
      }
    }

    function adjustVolume(delta, fromKeyboard) {
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
        showHud(key, "Volume " + pct + "%", { meter: next });
      }
    }

    function volumeFromBar() {
      if (!volumeBar) return;
      const next = Math.max(0, Math.min(1, Number(volumeBar.value) / 100));
      video.volume = next;
      video.muted = next === 0;
      if (next > 0) lastVolume = next;
      updateMuteUI();
    }

    function seekFromBar() {
      const duration = video.duration;
      if (!isFinite(duration) || duration <= 0) return;
      const percent = Number(seekBar.value);
      video.currentTime = (percent / 100) * duration;
      setSeekProgress(percent);
    }

    function handleKeydown(event) {
      if (!isVideoActive()) return;
      if (event.defaultPrevented) return;
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (isEditableTarget(event.target)) return;

      const key = event.key;
      let handled = true;

      switch (key) {
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
          seekToFraction(Number(key) / 10, true);
          break;
        default:
          handled = false;
      }

      if (handled) {
        // stopImmediatePropagation so app.js lesson-nav keys don't also fire
        // (both listen on document; stopPropagation alone is not enough).
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    }

    function showVideo(src) {
      video.classList.remove("hidden");
      setControlsVisible(true);
      if (video.getAttribute("src") !== src) {
        video.src = src;
      }
      updatePlayPauseUI();
      updateSeekUI();
      updateMuteUI();
    }

    function hideVideo() {
      video.pause();
      video.removeAttribute("src");
      video.load();
      video.classList.add("hidden");
      setControlsVisible(false);
      setSeekProgress(0);
      hideHud();
    }

    function bindEvents() {
      playPauseBtn.addEventListener("click", () => togglePlayPause(false));
      muteBtn.addEventListener("click", () => toggleMute(false));
      fullscreenBtn.addEventListener("click", () => toggleFullscreen(false));
      seekBar.addEventListener("input", seekFromBar);
      if (volumeBar) volumeBar.addEventListener("input", volumeFromBar);

      video.addEventListener("click", () => togglePlayPause(false));
      video.addEventListener("dblclick", (event) => {
        event.preventDefault();
        if (isVideoActive()) toggleFullscreen(false);
      });

      document.addEventListener("keydown", handleKeydown);

      [
        "fullscreenchange",
        "webkitfullscreenchange",
        "mozfullscreenchange",
        "MSFullscreenChange",
      ].forEach((eventName) => {
        document.addEventListener(eventName, updateFullscreenUI);
      });

      video.addEventListener("play", updatePlayPauseUI);
      video.addEventListener("pause", updatePlayPauseUI);
      video.addEventListener("ended", updatePlayPauseUI);
      video.addEventListener("timeupdate", updateSeekUI);
      video.addEventListener("loadedmetadata", updateSeekUI);
      video.addEventListener("volumechange", () => {
        if (!isMuted() && video.volume > 0) lastVolume = video.volume;
        updateMuteUI();
      });
      video.addEventListener("emptied", () => {
        updatePlayPauseUI();
        updateSeekUI();
        updateMuteUI();
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
    };
  }

  global.CourseVideo = {
    formatTime,
    createVideoPlayer,
  };
})(window);
