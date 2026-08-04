/**
 * CourseDesk — main entry point.
 *
 * Bootstraps the app: initialises the video player, binds global events
 * (theme, sidebar, keyboard), and opens the last-used course or the
 * course picker.
 */

import state from './state.js';
import * as Storage from './storage.js';
import Icons from './icons.js';
import { createVideoPlayer } from './player.js';
import { initCourses, showCoursePicker, openCourse, getAvailableCourses } from './ui/course-picker.js';
import { renderCurriculum, setOnSelectLesson } from './ui/curriculum.js';
import {
  bindLessonEvents,
  setVideoPlayer,
  selectLesson,
  goToPreviousLesson,
  goToNextLesson,
  markActiveComplete,
} from './ui/lesson-view.js';

/* ---------- DOM refs ---------- */

const ui = {
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

const videoPlayer = createVideoPlayer({
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

/* ---------- theme ---------- */

function applyTheme(theme) {
  const next = theme === "light" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  Storage.saveTheme(next);
  syncThemeButton(next);
}

function syncThemeButton(theme) {
  const isLight = theme === "light";
  ui.themeBtn.setAttribute(
    "aria-label",
    isLight ? "Switch to dark theme" : "Switch to light theme"
  );
  ui.themeBtn.title = isLight ? "Dark mode" : "Light mode";
  ui.themeBtn.innerHTML = isLight ? Icons.moon() : Icons.sun();
}

function toggleTheme() {
  applyTheme(Storage.loadTheme() === "light" ? "dark" : "light");
}

/* ---------- sidebar ---------- */

function isCurriculumOpen() {
  return !ui.workspace.classList.contains("curriculum-collapsed");
}

function setCurriculumOpen(open) {
  ui.workspace.classList.toggle("curriculum-collapsed", !open);
  ui.curriculumToggle.setAttribute("aria-expanded", open ? "true" : "false");
  Storage.saveCurriculumOpen(open);
}

function toggleCurriculum() {
  setCurriculumOpen(!isCurriculumOpen());
}

/* ---------- keyboard ---------- */

function isTypingTarget(target) {
  if (!target || !target.tagName) return false;
  const tag = target.tagName;
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
      goToPreviousLesson();
      break;
    case "]":
      event.preventDefault();
      goToNextLesson();
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
        markActiveComplete();
      }
      break;
    default:
      break;
  }
}

/* ---------- boot ---------- */

function boot() {
  // Wire up modules
  setVideoPlayer(videoPlayer);
  setOnSelectLesson((id) => selectLesson(id, videoPlayer));

  // Init video player events
  videoPlayer.bindEvents();

  // Bind UI events
  ui.themeBtn.addEventListener("click", toggleTheme);
  ui.curriculumToggle.addEventListener("click", toggleCurriculum);
  document.addEventListener("keydown", handleKeydown);

  if (ui.backToCoursesBtn) {
    ui.backToCoursesBtn.addEventListener("click", () => {
      showCoursePicker(videoPlayer);
    });
  }

  // Bind lesson navigation events
  bindLessonEvents();

  // Apply saved preferences
  applyTheme(Storage.loadTheme());
  setCurriculumOpen(Storage.loadCurriculumOpen(true));

  // Load courses and show either the last course or the picker
  const availableCourses = initCourses();

  const lastCourseId = Storage.loadActiveCourseId();
  if (lastCourseId && availableCourses.some((c) => c.data.id === lastCourseId)) {
    openCourse(lastCourseId, videoPlayer);
  } else {
    showCoursePicker(videoPlayer);
  }
}

boot();
