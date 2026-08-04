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

  var ns = (global.CourseDesk = global.CourseDesk || {});
  var Icons = ns.Icons;

  var SEEK_STEP = 5;
  var VOLUME_STEP = 0.1;
  var HUD_MS = 900;

  function formatTime(seconds) {
    if (!isFinite(seconds) || seconds < 0) return "0:00";
    var total = Math.floor(seconds);
    var s = total % 60;
    var m = Math.floor(total / 60) % 60;
    var h = Math.floor(total / 3600);
    var ss = String(s).padStart(2, "0");

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
    var tag = target.tagName;
    if (tag === "TEXTAREA" || tag === "SELECT") return true;
    if (tag === "INPUT") {
      var type = (target.getAttribute("type") || "text").toLowerCase();
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

  function createVideoPlayer(elements) {
    var video = elements.video;
    var stage = elements.stage;
    var controls = elements.controls;
    var playPauseBtn = elements.playPauseBtn;
    var muteBtn = elements.muteBtn;
    var fullscreenBtn = elements.fullscreenBtn;
    var seekBar = elements.seekBar;
    var volumeBar = elements.volumeBar;
    var currentTime = elements.currentTime;
    var durationTime = elements.durationTime;
    var hud = elements.hud;
    var hudIcon = elements.hudIcon;
    var hudLabel = elements.hudLabel;
    var hudMeter = elements.hudMeter;
    var hudMeterFill = elements.hudMeterFill;

    var lastVolume = video.volume > 0 ? video.volume : 1;
    var hudTimer = null;

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
      var fs = getFullscreenElement();
      return !!(fs && (fs === stage || stage.contains(fs) || fs === video));
    }

    function setControlsVisible(show) {
      if (show) controls.removeAttribute("hidden");
      else controls.setAttribute("hidden", "");
    }

    function setSeekProgress(percent) {
      var clamped = Math.max(0, Math.min(100, percent));
      seekBar.value = String(clamped);
      seekBar.style.setProperty("--seek-progress", clamped + "%");
    }

    function setVolumeProgress(percent) {
      if (!volumeBar) return;
      var clamped = Math.max(0, Math.min(100, percent));
      volumeBar.value = String(Math.round(clamped));
      volumeBar.style.setProperty("--volume-progress", clamped + "%");
    }

    function showHud(iconKey, label, opts) {
      if (!hud || !hudIcon || !hudLabel) return;
      var meter = opts && opts.meter;

      hudIcon.innerHTML =
        typeof Icons.hud === "function" ? Icons.hud(iconKey) : "";
      hudLabel.textContent = label;

      if (hudMeter && hudMeterFill && meter != null && isFinite(meter)) {
        var pct = Math.max(0, Math.min(100, meter * 100));
        hudMeter.hidden = false;
        hudMeterFill.style.width = pct + "%";
      } else if (hudMeter) {
        hudMeter.hidden = true;
        if (hudMeterFill) hudMeterFill.style.width = "0%";
      }

      hud.classList.remove("is-visible");
      void hud.offsetWidth;
      hud.classList.add("is-visible");
      hud.setAttribute("aria-hidden", "false");

      if (hudTimer) clearTimeout(hudTimer);
      hudTimer = setTimeout(function () {
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
      var playing = isPlaying();
      var playIcon = playPauseBtn.querySelector(".icon-play");
      var pauseIcon = playPauseBtn.querySelector(".icon-pause");
      if (playIcon) playIcon.classList.toggle("hidden", playing);
      if (pauseIcon) pauseIcon.classList.toggle("hidden", !playing);
      playPauseBtn.setAttribute("aria-label", playing ? "Pause" : "Play");
    }

    function updateMuteUI() {
      var muted = isMuted();
      var vol = effectiveVolume();
      var volHigh = muteBtn.querySelector(".icon-vol");
      var volLow = muteBtn.querySelector(".icon-vol-low");
      var muteIcon = muteBtn.querySelector(".icon-mute");

      if (volHigh) volHigh.classList.toggle("hidden", muted || vol <= 0.5);
      if (volLow) volLow.classList.toggle("hidden", muted || vol > 0.5 || vol <= 0);
      if (muteIcon) muteIcon.classList.toggle("hidden", !muted);

      muteBtn.setAttribute("aria-label", muted ? "Unmute" : "Mute");
      setVolumeProgress(vol * 100);
    }

    function updateSeekUI() {
      var duration = video.duration;
      var time = video.currentTime;
      currentTime.textContent = formatTime(time);
      durationTime.textContent = formatTime(duration);
      var percent =
        isFinite(duration) && duration > 0 ? (time / duration) * 100 : 0;
      setSeekProgress(percent);
    }

    function updateFullscreenUI() {
      var active = isFullscreenActive();
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
        video.play().catch(function () {});
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
          var key = video.volume <= 0.5 ? "volumeLow" : "volumeHigh";
          showHud(key, "Unmuted", { meter: video.volume });
        }
      }
      updateMuteUI();
    }

    function toggleFullscreen(fromKeyboard) {
      if (!isVideoActive()) return;
      if (isFullscreenActive()) {
        exitFullscreen().catch(function () {});
        if (fromKeyboard) showHud("exitFullscreen", "Exit fullscreen");
        return;
      }
      requestFullscreen(stage)
        .catch(function () { return requestFullscreen(video); })
        .catch(function (err) { console.warn("Fullscreen failed:", err); });
      if (fromKeyboard) showHud("fullscreen", "Fullscreen");
    }

    function seekBy(deltaSeconds, fromKeyboard) {
      if (!isVideoActive()) return;
      var duration = video.duration;
      if (!isFinite(duration) || duration <= 0) return;
      var next = Math.max(0, Math.min(duration, video.currentTime + deltaSeconds));
      video.currentTime = next;
      updateSeekUI();
      if (fromKeyboard) {
        var label = (deltaSeconds >= 0 ? "+" : "") + deltaSeconds + "s";
        showHud(deltaSeconds >= 0 ? "seekForward" : "seekBack", label);
      }
    }

    function seekToFraction(fraction, fromKeyboard) {
      if (!isVideoActive()) return;
      var duration = video.duration;
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
      var base = isMuted() ? 0 : video.volume;
      var next = Math.max(0, Math.min(1, base + delta));
      video.volume = next;
      if (next > 0) {
        video.muted = false;
        lastVolume = next;
      } else {
        video.muted = true;
      }
      updateMuteUI();
      if (fromKeyboard) {
        var pct = Math.round(next * 100);
        var key = "volumeHigh";
        if (next === 0) key = "volumeMute";
        else if (next <= 0.5) key = "volumeLow";
        showHud(key, "Volume " + pct + "%", { meter: next });
      }
    }

    function volumeFromBar() {
      if (!volumeBar) return;
      var next = Math.max(0, Math.min(1, Number(volumeBar.value) / 100));
      video.volume = next;
      video.muted = next === 0;
      if (next > 0) lastVolume = next;
      updateMuteUI();
    }

    function seekFromBar() {
      var duration = video.duration;
      if (!isFinite(duration) || duration <= 0) return;
      var percent = Number(seekBar.value);
      video.currentTime = (percent / 100) * duration;
      setSeekProgress(percent);
    }

    function handleKeydown(event) {
      if (!isVideoActive()) return;
      if (event.defaultPrevented) return;
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (isEditableTarget(event.target)) return;

      var key = event.key;
      var handled = true;

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
      playPauseBtn.addEventListener("click", function () { togglePlayPause(false); });
      muteBtn.addEventListener("click", function () { toggleMute(false); });
      fullscreenBtn.addEventListener("click", function () { toggleFullscreen(false); });
      seekBar.addEventListener("input", seekFromBar);
      if (volumeBar) volumeBar.addEventListener("input", volumeFromBar);

      video.addEventListener("click", function () { togglePlayPause(false); });
      video.addEventListener("dblclick", function (event) {
        event.preventDefault();
        if (isVideoActive()) toggleFullscreen(false);
      });

      document.addEventListener("keydown", handleKeydown);

      [
        "fullscreenchange",
        "webkitfullscreenchange",
        "mozfullscreenchange",
        "MSFullscreenChange",
      ].forEach(function (eventName) {
        document.addEventListener(eventName, updateFullscreenUI);
      });

      video.addEventListener("play", updatePlayPauseUI);
      video.addEventListener("pause", updatePlayPauseUI);
      video.addEventListener("ended", updatePlayPauseUI);
      video.addEventListener("timeupdate", updateSeekUI);
      video.addEventListener("loadedmetadata", updateSeekUI);
      video.addEventListener("volumechange", function () {
        if (!isMuted() && video.volume > 0) lastVolume = video.volume;
        updateMuteUI();
      });
      video.addEventListener("emptied", function () {
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
      bindEvents: bindEvents,
      showVideo: showVideo,
      hideVideo: hideVideo,
      formatTime: formatTime,
    };
  }

  ns.formatTime = formatTime;
  ns.createVideoPlayer = createVideoPlayer;
})(window);
