import { el, id, idOpt, qs, setText, toggleClass } from "../lib/dom";
import type { VideoPlayer } from "../lib/player";
import { getAvailableCourses, setAvailableCourses } from "../lib/registry";
import * as Storage from "../lib/storage";
import * as State from "../lib/state";
import { state } from "../lib/state";
import type { AvailableCourse } from "../types/course";
import * as Curriculum from "./curriculum";
import * as LessonView from "./lesson-view";

const ui = {
  workspace: qs(".workspace"),
  courseTitle: qs(".course-title"),
  courseLabel: qs(".course-label"),
  pageTitle: document.querySelector("title"),
  welcome: id("welcome"),
  coursePicker: id("coursePicker"),
  courseCountBadge: idOpt("courseCountBadge"),
  lessonView: id("lessonView"),
  nav: id("nav"),
  backToCoursesBtn: idOpt<HTMLButtonElement>("backToCoursesBtn"),
};

let videoPlayerRef: VideoPlayer | null = null;

export function setVideoPlayerRef(vp: VideoPlayer): void {
  videoPlayerRef = vp;
}

export function initCourses(): AvailableCourse[] {
  const available = State.buildAvailableCourses();
  setAvailableCourses(available);
  if (!available.length) {
    console.error(
      "No courses found. Add courses/<id>/course.js, then run: pnpm start"
    );
  }
  return available;
}

export function showCoursePicker(videoPlayer: VideoPlayer): void {
  State.resetState();
  Storage.saveActiveCourseId(null);

  videoPlayer.hideVideo();
  toggleClass(ui.lessonView, "hidden", true);
  toggleClass(ui.welcome, "hidden", false);
  ui.nav.innerHTML = "";
  toggleClass(ui.workspace, "library-mode", true);

  LessonView.updateProgress();
  renderCoursePicker();

  setText(ui.courseTitle, "Your courses");
  setText(ui.courseLabel, "CourseDesk");
  setText(ui.pageTitle, "CourseDesk");
  toggleClass(ui.backToCoursesBtn, "hidden", true);
}

export function openCourse(courseId: string, videoPlayer: VideoPlayer): void {
  const course = getAvailableCourses().find((c) => c.data.id === courseId);
  if (!course) return;

  State.loadCourseState(course);
  Storage.saveActiveCourseId(course.data.id);
  toggleClass(ui.workspace, "library-mode", false);
  LessonView.updateCourseChrome(course);
  LessonView.updateProgress();
  Curriculum.renderCurriculum();
  toggleClass(ui.backToCoursesBtn, "hidden", false);

  const lastId = Storage.loadLastLessonId(course.data.id);
  if (lastId && state.lessonsById[lastId]) {
    LessonView.selectLesson(lastId, videoPlayer);
  } else if (state.lessons[0]) {
    toggleClass(ui.welcome, "hidden", true);
    LessonView.selectLesson(state.lessons[0].id, videoPlayer);
  } else {
    toggleClass(ui.welcome, "hidden", true);
    toggleClass(ui.lessonView, "hidden", true);
  }
}

function cardProgress(course: AvailableCourse) {
  const lessons = course.data.lessons || [];
  const finished = Storage.loadFinishedIds(course.data.id);
  const done = lessons.reduce((n, l) => n + (finished.has(l.id) ? 1 : 0), 0);
  const total = lessons.length;
  const percent = total ? Math.round((done / total) * 100) : 0;
  const seconds = State.sumLessonDurations(lessons);
  const duration = seconds > 0 ? State.formatDurationTotal(seconds) : "";
  const progressLabel =
    percent === 0
      ? "Not started"
      : percent === 100
        ? "Completed"
        : `${done} / ${total} · ${percent}%`;
  return { lessons, total, percent, duration, progressLabel };
}

function courseCard(course: AvailableCourse, index: number): HTMLButtonElement {
  const title = course.data.title || course.meta.title || "Course";
  const author = course.data.author || course.meta.author || "Course";
  const { total, percent, duration, progressLabel } = cardProgress(course);

  const metaParts = [`${total} lesson${total === 1 ? "" : "s"}`];
  if (duration) metaParts.push(duration);

  const card = el("button", {
    className: "course-thumb",
    attrs: {
      type: "button",
      role: "listitem",
      "aria-label": `${title} by ${author}. ${progressLabel}.`,
    },
    on: {
      click: () => {
        if (videoPlayerRef) openCourse(course.data.id, videoPlayerRef);
      },
    },
  });
  card.style.setProperty("--card-hue", String((index * 47 + 268) % 360));

  // Same structure as before (CSS targets these classes)
  card.innerHTML =
    '<div class="course-thumb-media" aria-hidden="true">' +
    '<span class="course-thumb-mono"></span>' +
    '<span class="course-thumb-badge"></span>' +
    '<div class="course-thumb-progress-track">' +
    '<div class="course-thumb-progress-fill"></div>' +
    "</div></div>" +
    '<div class="course-thumb-body">' +
    '<h3 class="course-thumb-title"></h3>' +
    '<p class="course-thumb-author"></p>' +
    '<p class="course-thumb-meta"></p>' +
    '<p class="course-thumb-progress-label"></p>' +
    "</div>";

  setText(card.querySelector(".course-thumb-mono"), State.courseMonogram(title));
  setText(
    card.querySelector(".course-thumb-badge"),
    percent > 0 ? `${percent}%` : "New"
  );
  const fill = card.querySelector<HTMLElement>(".course-thumb-progress-fill");
  if (fill) fill.style.width = `${percent}%`;
  setText(card.querySelector(".course-thumb-title"), title);
  setText(card.querySelector(".course-thumb-author"), author);
  setText(card.querySelector(".course-thumb-meta"), metaParts.join(" · "));
  setText(card.querySelector(".course-thumb-progress-label"), progressLabel);

  return card;
}

function renderCoursePicker(): void {
  ui.coursePicker.innerHTML = "";
  const available = getAvailableCourses();
  const n = available.length;
  setText(ui.courseCountBadge, `${n} course${n === 1 ? "" : "s"}`);
  available.forEach((course, i) => {
    ui.coursePicker.appendChild(courseCard(course, i));
  });
}
