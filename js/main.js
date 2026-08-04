/**
 * CourseDesk — main entry point.
 *
 * Bootstraps the app: initialises the video player, binds global events
 * (theme, sidebar, keyboard), and opens the last-used course or the
 * course picker.
 */
(function (global) {
  "use strict";

  var ns = global.CourseDesk;
  if (!ns) {
    console.error("CourseDesk namespace not initialized.");
    return;
  }

  var state = ns.state;
  var Storage = ns.Storage;
  var Icons = ns.Icons;
  var createVideoPlayer = ns.createVideoPlayer;
  var CoursePicker = ns.CoursePicker;
  var Curriculum = ns.Curriculum;
  var LessonView = ns.LessonView;

  /* ---------- DOM refs ---------- */

  var ui = {
    themeBtn: document.getElementById("themeBtn"),
    curriculumToggle: document.getElementById("curriculumToggle"),
    backToCoursesBtn: document.getElementById("backToCoursesBtn"),
    workspace: document.querySelector(".workspace"),
    player: document.getElementById("player"),
    playerStage: document.querySelector(".player-stage"),
    playerControls: document.getElementById("playerControls"),
    playPauseBtn: document.getElementById("playPauseBtn"),
    muteBtn: document.getElementById("muteBtn"),
    fullscreenBtn: document.getElementById("fsBtn"),
    seekBar: document.getElementById("seekBar"),
    volumeBar: document.getElementById("volumeBar"),
    currentTime: document.getElementById("currentTime"),
    durationTime: document.getElementById("durationTime"),
    playerHud: document.getElementById("playerHud"),
    playerHudIcon: document.getElementById("playerHudIcon"),
    playerHudLabel: document.getElementById("playerHudLabel"),
    playerHudMeter: document.getElementById("playerHudMeter"),
    playerHudMeterFill: document.getElementById("playerHudMeterFill"),
  };

  /* ---------- video player ---------- */

  var videoPlayer = createVideoPlayer({
    video: ui.player,
    stage: ui.playerStage,
    controls: ui.playerControls,
    playPauseBtn: ui.playPauseBtn,
    muteBtn: ui.muteBtn,
    fullscreenBtn: ui.fullscreenBtn,
    seekBar: ui.seekBar,
    volumeBar: ui.volumeBar,
    currentTime: ui.currentTime,
    durationTime: ui.durationTime,
    hud: ui.playerHud,
    hudIcon: ui.playerHudIcon,
    hudLabel: ui.playerHudLabel,
    hudMeter: ui.playerHudMeter,
    hudMeterFill: ui.playerHudMeterFill,
  });
  
  // Store a global reference for use in course-picker.js
  ns.videoPlayerRef = videoPlayer;

  /* ---------- theme ---------- */

  function applyTheme(theme) {
    var next = theme === "light" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    Storage.saveTheme(next);
    syncThemeButton(next);
  }

  function syncThemeButton(theme) {
    var isLight = theme === "light";
    if (ui.themeBtn) {
      ui.themeBtn.setAttribute(
        "aria-label",
        isLight ? "Switch to dark theme" : "Switch to light theme"
      );
      ui.themeBtn.title = isLight ? "Dark mode" : "Light mode";
      ui.themeBtn.innerHTML = isLight ? Icons.moon() : Icons.sun();
    }
  }

  function toggleTheme() {
    applyTheme(Storage.loadTheme() === "light" ? "dark" : "light");
  }

  /* ---------- sidebar ---------- */

  function isCurriculumOpen() {
    return !ui.workspace.classList.contains("curriculum-collapsed");
  }

  function setCurriculumOpen(open) {
    if (ui.workspace) ui.workspace.classList.toggle("curriculum-collapsed", !open);
    if (ui.curriculumToggle) ui.curriculumToggle.setAttribute("aria-expanded", open ? "true" : "false");
    Storage.saveCurriculumOpen(open);
  }

  function toggleCurriculum() {
    setCurriculumOpen(!isCurriculumOpen());
  }

  /* ---------- keyboard ---------- */

  function isTypingTarget(target) {
    if (!target || !target.tagName) return false;
    var tag = target.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
  }

  function handleKeydown(event) {
    if (event.defaultPrevented) return;
    if (isTypingTarget(event.target)) return;

    // Arrow keys are reserved for the video player (seek / volume).
    // Lesson navigation: [ previous, ] next.
    switch (event.key) {
      case "[":
        event.preventDefault();
        LessonView.goToPreviousLesson();
        break;
      case "]":
        event.preventDefault();
        LessonView.goToNextLesson();
        break;
      case "f":
      case "F":
        // Player uses F for fullscreen when a video is active
        if (
          ui.player &&
          !ui.player.classList.contains("hidden") &&
          ui.player.getAttribute("src")
        ) {
          return;
        }
        if (!event.metaKey && !event.ctrlKey && state.activeLessonId) {
          event.preventDefault();
          LessonView.markActiveComplete();
        }
        break;
      default:
        break;
    }
  }

  /* ---------- boot ---------- */

  function boot() {
    // Wire up modules
    LessonView.setVideoPlayer(videoPlayer);
    Curriculum.setOnSelectLesson(function (id) { return LessonView.selectLesson(id, videoPlayer); });

    // Init video player events
    videoPlayer.bindEvents();

    // Bind UI events
    if (ui.themeBtn) ui.themeBtn.addEventListener("click", toggleTheme);
    if (ui.curriculumToggle) ui.curriculumToggle.addEventListener("click", toggleCurriculum);
    document.addEventListener("keydown", handleKeydown);

    if (ui.backToCoursesBtn) {
      ui.backToCoursesBtn.addEventListener("click", function () {
        CoursePicker.showCoursePicker(videoPlayer);
      });
    }

    // Bind lesson navigation events
    LessonView.bindLessonEvents();

    // Apply saved preferences
    applyTheme(Storage.loadTheme());
    setCurriculumOpen(Storage.loadCurriculumOpen(true));

    // Load courses and show either the last course or the picker
    var availableCourses = CoursePicker.initCourses();

    var lastCourseId = Storage.loadActiveCourseId();
    if (lastCourseId && availableCourses.some(function (c) { return c.data.id === lastCourseId; })) {
      CoursePicker.openCourse(lastCourseId, videoPlayer);
    } else {
      CoursePicker.showCoursePicker(videoPlayer);
    }
  }

  // Allow DOM to be parsed first if loaded synchronously
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})(window);
