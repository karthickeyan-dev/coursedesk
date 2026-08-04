/**
 * Lesson view — video loading, notes rendering, progress tracking, and nav.
 */

import state, {
  resolveCourseAsset,
  categoryTitle,
  indexOfLesson,
  isLessonFinished,
  formatDurationTotal,
  sumLessonDurations,
} from '../state.js';
import * as Storage from '../storage.js';
import { renderNotesInto, hasNotes } from '../notes.js';
import { renderCurriculum, setOpenCategory } from './curriculum.js';

/* ---------- DOM refs ---------- */

const ui = {
  welcome: document.getElementById("welcome"),
  lessonView: document.getElementById("lessonView"),
  lessonTitle: document.getElementById("lessonTitle"),
  lessonMeta: document.getElementById("lessonMeta"),
  prevBtn: document.getElementById("prevBtn"),
  nextBtn: document.getElementById("nextBtn"),
  doneBtn: document.getElementById("doneBtn"),
  noVideo: document.getElementById("noVideo"),
  notesPanel: document.querySelector(".notes-panel"),
  notesBody: document.getElementById("notesBody"),
  main: document.querySelector(".main"),
  playerStage: document.querySelector(".player-stage"),
  progressText: document.getElementById("progressText"),
  progressRing: document.getElementById("progressRing"),
  progressPill: document.getElementById("progressPill"),
  progressLecturesStat: document.getElementById("progressLecturesStat"),
  progressTimeStat: document.getElementById("progressTimeStat"),
};

/** Injected by main.js during init */
let videoPlayer = null;

export function setVideoPlayer(vp) {
  videoPlayer = vp;
}

/* ---------- progress ---------- */

export function updateProgress() {
  const total = state.lessons.length;
  const doneLessons = state.lessons.filter((l) => isLessonFinished(l.id));
  const done = Math.min(doneLessons.length, total);
  const percent = total ? Math.round((done / total) * 100) : 0;
  const totalSeconds = sumLessonDurations(state.lessons);
  const doneSeconds = sumLessonDurations(doneLessons);

  if (ui.progressText) ui.progressText.textContent = percent + "% complete";
  if (ui.progressRing) {
    ui.progressRing.setAttribute("stroke-dasharray", percent + ", 100");
  }
  if (ui.progressLecturesStat) {
    ui.progressLecturesStat.textContent = done + " / " + total;
  }
  if (ui.progressTimeStat) {
    ui.progressTimeStat.textContent =
      formatDurationTotal(doneSeconds) + " / " + formatDurationTotal(totalSeconds);
  }
  if (ui.progressPill) {
    ui.progressPill.classList.toggle("is-empty", !state.activeCourse || total === 0);
    ui.progressPill.setAttribute(
      "aria-label",
      percent +
        "% complete. " +
        done +
        " of " +
        total +
        " lectures. " +
        formatDurationTotal(doneSeconds) +
        " of " +
        formatDurationTotal(totalSeconds) +
        " watched."
    );
  }
}

export function updateDoneButton() {
  const label = ui.doneBtn.querySelector(".done-label");
  if (!state.activeLessonId) {
    ui.doneBtn.disabled = true;
    ui.doneBtn.classList.remove("is-done");
    if (label) label.textContent = "Mark as complete";
    return;
  }
  const done = isLessonFinished(state.activeLessonId);
  ui.doneBtn.disabled = false;
  ui.doneBtn.classList.toggle("is-done", done);
  if (label) label.textContent = done ? "Completed" : "Mark as complete";
}

export function updateCourseChrome(course) {
  const courseTitle = document.querySelector(".course-title");
  const courseLabel = document.querySelector(".course-label");
  const pageTitle = document.querySelector("title");

  const title = course.data.title || course.meta.title || "Course";
  const author = course.data.author || course.meta.author || "";
  if (courseTitle) courseTitle.textContent = title;
  if (courseLabel) courseLabel.textContent = author || "Course";
  if (pageTitle) pageTitle.textContent = author ? title + " · " + author : title;
}

/* ---------- lesson selection ---------- */

function showLessonChrome() {
  ui.welcome.classList.add("hidden");
  ui.lessonView.classList.remove("hidden");
}

function updateLessonHeader(lesson) {
  ui.lessonTitle.textContent = lesson.title;
  ui.lessonMeta.textContent = categoryTitle(lesson);
}

function updateLessonMedia(lesson) {
  const videoSrc = resolveCourseAsset(state.activeCourse, lesson.video);
  if (videoSrc) {
    ui.noVideo.classList.add("hidden");
    ui.playerStage.classList.remove("hidden");
    videoPlayer.showVideo(videoSrc);
    return;
  }
  videoPlayer.hideVideo();
  // Notes-only lesson: hide the whole player stage for a cleaner article layout
  ui.playerStage.classList.add("hidden");
  ui.noVideo.classList.add("hidden");
}

function updateLessonNavigation(lessonId) {
  const index = indexOfLesson(lessonId);
  ui.prevBtn.disabled = index <= 0;
  ui.nextBtn.disabled = index < 0 || index >= state.lessons.length - 1;
}

function renderLessonNotes(lesson) {
  const source = state.notesByLessonId[lesson.id];
  const has = hasNotes(source);

  if (ui.notesPanel) {
    ui.notesPanel.classList.toggle("is-empty", !has);
  }

  renderNotesInto(ui.notesBody, has ? source : null);
}

export function selectLesson(id, vp) {
  if (vp) videoPlayer = vp;
  if (!state.activeCourse) return;
  const lesson = state.lessonsById[id];
  if (!lesson) return;

  state.activeLessonId = id;
  Storage.saveLastLessonId(state.activeCourse.data.id, id);
  setOpenCategory(lesson.categoryId);

  showLessonChrome();
  updateLessonHeader(lesson);
  updateLessonMedia(lesson);
  renderLessonNotes(lesson);
  updateLessonNavigation(id);
  updateDoneButton();
  renderCurriculum();

  if (ui.main) ui.main.scrollTop = 0;
}

/* ---------- nav helpers ---------- */

function goToAdjacentLesson(offset) {
  const index = indexOfLesson(state.activeLessonId);
  if (index < 0) return;
  const next = state.lessons[index + offset];
  if (next) selectLesson(next.id);
}

export function goToPreviousLesson() {
  goToAdjacentLesson(-1);
}

export function goToNextLesson() {
  goToAdjacentLesson(1);
}

export function markActiveComplete() {
  if (!state.activeLessonId || !state.activeCourse) return;
  if (state.finishedIds.has(state.activeLessonId)) {
    state.finishedIds.delete(state.activeLessonId);
  } else {
    state.finishedIds.add(state.activeLessonId);
  }
  Storage.saveFinishedIds(state.activeCourse.data.id, state.finishedIds);
  updateProgress();
  updateDoneButton();
  renderCurriculum();
}

/* ---------- event binding ---------- */

export function bindLessonEvents() {
  ui.prevBtn.addEventListener("click", goToPreviousLesson);
  ui.nextBtn.addEventListener("click", goToNextLesson);
  ui.doneBtn.addEventListener("click", markActiveComplete);
}
