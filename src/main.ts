/**
 * CourseDesk entry — wires modules; UI chrome is unchanged.
 */
import "./styles/styles.css";
import "highlight.js/styles/github-dark.css";

import { loadCourses } from "./lib/course-loader";
import { id, idOpt, qs } from "./lib/dom";
import { Icons } from "./lib/icons";
import { createVideoPlayer } from "./lib/player";
import * as Storage from "./lib/storage";
import type { Theme } from "./lib/storage";
import { state } from "./lib/state";
import * as CoursePicker from "./ui/course-picker";
import * as Curriculum from "./ui/curriculum";
import * as LessonView from "./ui/lesson-view";

const themeBtn = idOpt<HTMLButtonElement>("themeBtn");
const curriculumToggle = idOpt<HTMLButtonElement>("curriculumToggle");
const backToCoursesBtn = idOpt<HTMLButtonElement>("backToCoursesBtn");
const workspace = qs(".workspace");
const player = id<HTMLVideoElement>("player");

const videoPlayer = createVideoPlayer({
  video: player,
  stage: qs(".player-stage")!,
  controls: id("playerControls"),
  playPauseBtn: id("playPauseBtn"),
  muteBtn: id("muteBtn"),
  fullscreenBtn: id("fsBtn"),
  seekBar: id("seekBar"),
  volumeBar: idOpt<HTMLInputElement>("volumeBar"),
  currentTime: id("currentTime"),
  durationTime: id("durationTime"),
  hud: idOpt("playerHud"),
  hudIcon: idOpt("playerHudIcon"),
  hudLabel: idOpt("playerHudLabel"),
  hudMeter: idOpt("playerHudMeter"),
  hudMeterFill: idOpt("playerHudMeterFill"),
});

CoursePicker.setVideoPlayerRef(videoPlayer);

function applyTheme(theme: Theme): void {
  const next: Theme = theme === "light" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  Storage.saveTheme(next);
  if (!themeBtn) return;
  const light = next === "light";
  themeBtn.setAttribute(
    "aria-label",
    light ? "Switch to dark theme" : "Switch to light theme"
  );
  themeBtn.title = light ? "Dark mode" : "Light mode";
  themeBtn.innerHTML = light ? Icons.moon() : Icons.sun();
}

function setCurriculumOpen(open: boolean): void {
  workspace?.classList.toggle("curriculum-collapsed", !open);
  curriculumToggle?.setAttribute("aria-expanded", open ? "true" : "false");
  Storage.saveCurriculumOpen(open);
}

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const t = target.tagName;
  return t === "INPUT" || t === "TEXTAREA" || target.isContentEditable;
}

function onKeydown(event: KeyboardEvent): void {
  if (event.defaultPrevented || isTyping(event.target)) return;
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
    case "F": {
      const videoActive =
        !player.classList.contains("hidden") && !!player.getAttribute("src");
      if (videoActive) return;
      if (!event.metaKey && !event.ctrlKey && state.activeLessonId) {
        event.preventDefault();
        LessonView.markActiveComplete();
      }
      break;
    }
  }
}

async function boot(): Promise<void> {
  LessonView.setVideoPlayer(videoPlayer);
  Curriculum.setOnSelectLesson((id) => LessonView.selectLesson(id, videoPlayer));
  Curriculum.setOnFinishedChange(() => {
    LessonView.updateProgress();
    LessonView.updateDoneButton();
  });

  videoPlayer.bindEvents();
  LessonView.bindLessonEvents();

  themeBtn?.addEventListener("click", () =>
    applyTheme(Storage.loadTheme() === "light" ? "dark" : "light")
  );
  curriculumToggle?.addEventListener("click", () => {
    const open = !workspace?.classList.contains("curriculum-collapsed");
    setCurriculumOpen(!open);
  });
  document.addEventListener("keydown", onKeydown);
  backToCoursesBtn?.addEventListener("click", () =>
    CoursePicker.showCoursePicker(videoPlayer)
  );

  applyTheme(Storage.loadTheme());
  setCurriculumOpen(Storage.loadCurriculumOpen(true));

  try {
    await loadCourses();
  } catch (err) {
    console.error("[CourseDesk] Course load failed:", err);
  }

  const courses = CoursePicker.initCourses();
  Storage.pruneCourses(courses.map((c) => c.data.id));

  const last = Storage.loadActiveCourseId();
  if (last && courses.some((c) => c.data.id === last)) {
    CoursePicker.openCourse(last, videoPlayer);
  } else {
    CoursePicker.showCoursePicker(videoPlayer);
  }
}

void boot();
