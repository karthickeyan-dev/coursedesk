/**
 * Course picker — renders the library grid and handles course selection.
 */

import state, {
  buildAvailableCourses,
  courseMonogram,
  loadCourseState,
  resetState,
} from '../state.js';
import * as Storage from '../storage.js';
import { renderCurriculum } from './curriculum.js';
import { selectLesson } from './lesson-view.js';
import { updateProgress, updateCourseChrome } from './lesson-view.js';

let availableCourses = [];

/* ---------- DOM refs ---------- */

const ui = {
  workspace: document.querySelector(".workspace"),
  courseTitle: document.querySelector(".course-title"),
  courseLabel: document.querySelector(".course-label"),
  pageTitle: document.querySelector("title"),
  welcome: document.getElementById("welcome"),
  coursePicker: document.getElementById("coursePicker"),
  courseCountBadge: document.getElementById("courseCountBadge"),
  lessonView: document.getElementById("lessonView"),
  nav: document.getElementById("nav"),
  backToCoursesBtn: document.getElementById("backToCoursesBtn"),
};

/* ---------- public ---------- */

export function initCourses() {
  availableCourses = buildAvailableCourses();

  if (!availableCourses.length) {
    console.error(
      "No courses registered. Add courses/<id>/course.js (+ assets) and list it in catalog.js."
    );
  }

  return availableCourses;
}

export function getAvailableCourses() {
  return availableCourses;
}

export function showCoursePicker(videoPlayer) {
  resetState();

  videoPlayer.hideVideo();
  ui.lessonView.classList.add("hidden");
  ui.welcome.classList.remove("hidden");
  ui.nav.innerHTML = "";
  if (ui.workspace) ui.workspace.classList.add("library-mode");
  updateProgress();
  renderCoursePicker();

  if (ui.courseTitle) ui.courseTitle.textContent = "Your courses";
  if (ui.courseLabel) ui.courseLabel.textContent = "CourseDesk";
  if (ui.pageTitle) ui.pageTitle.textContent = "CourseDesk";
  if (ui.backToCoursesBtn) ui.backToCoursesBtn.classList.add("hidden");
}

export function openCourse(courseId, videoPlayer) {
  const course = availableCourses.find((c) => c.data.id === courseId);
  if (!course) return;

  loadCourseState(course);

  Storage.saveActiveCourseId(course.data.id);
  if (ui.workspace) ui.workspace.classList.remove("library-mode");
  updateCourseChrome(course);
  updateProgress();
  renderCurriculum();

  if (ui.backToCoursesBtn) {
    ui.backToCoursesBtn.classList.remove("hidden");
  }

  const lastId = Storage.loadLastLessonId(course.data.id);
  if (lastId && state.lessonsById[lastId]) {
    selectLesson(lastId, videoPlayer);
  } else if (state.lessons[0]) {
    ui.welcome.classList.add("hidden");
    selectLesson(state.lessons[0].id, videoPlayer);
  } else {
    ui.welcome.classList.add("hidden");
    ui.lessonView.classList.add("hidden");
  }
}

/* ---------- internal ---------- */

function renderCoursePicker() {
  if (!ui.coursePicker) return;
  ui.coursePicker.innerHTML = "";

  const count = availableCourses.length;
  if (ui.courseCountBadge) {
    ui.courseCountBadge.textContent =
      count + (count === 1 ? " course" : " courses");
  }

  availableCourses.forEach((course, index) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "course-card";
    card.setAttribute("role", "listitem");
    card.style.setProperty("--card-hue", String((index * 47 + 268) % 360));

    const title = course.data.title || course.meta.title || "Course";
    const author = course.data.author || course.meta.author || "Course";
    const description =
      course.data.description || course.meta.description || "";
    const lessonCount = course.data.lessons.length;
    const videoCount = course.data.lessons.filter((l) => l.video).length;
    const notesCount = Object.keys(course.notes || {}).length;
    const finished = Storage.loadFinishedIds(course.data.id);
    const done = Math.min(finished.size, lessonCount);
    const percent = lessonCount ? Math.round((done / lessonCount) * 100) : 0;
    const ctaLabel =
      percent > 0 && percent < 100
        ? "Continue"
        : percent === 100
        ? "Review"
        : "Start course";

    card.innerHTML =
      '<div class="course-card-cover" aria-hidden="true">' +
      '<span class="course-card-mono"></span>' +
      '<span class="course-card-cover-label">Course</span>' +
      "</div>" +
      '<div class="course-card-body">' +
      '<div class="course-card-top">' +
      '<div class="course-card-author"></div>' +
      '<div class="course-card-progress-label"></div>' +
      "</div>" +
      '<h3 class="course-card-title"></h3>' +
      '<p class="course-card-desc"></p>' +
      '<div class="course-card-stats">' +
      '<span class="course-stat" data-stat="lessons"></span>' +
      '<span class="course-stat" data-stat="videos"></span>' +
      '<span class="course-stat" data-stat="notes"></span>' +
      "</div>" +
      '<div class="course-card-footer">' +
      '<div class="course-card-progress-track" aria-hidden="true">' +
      '<div class="course-card-progress-fill"></div>' +
      "</div>" +
      '<span class="course-card-cta"></span>' +
      "</div>" +
      "</div>";

    card.querySelector(".course-card-mono").textContent =
      courseMonogram(title);
    card.querySelector(".course-card-author").textContent = author;
    card.querySelector(".course-card-progress-label").textContent =
      percent + "% complete";
    card.querySelector(".course-card-title").textContent = title;
    card.querySelector(".course-card-desc").textContent = description;
    card.querySelector('[data-stat="lessons"]').textContent =
      lessonCount + (lessonCount === 1 ? " lesson" : " lessons");
    card.querySelector('[data-stat="videos"]').textContent =
      videoCount + (videoCount === 1 ? " video" : " videos");
    card.querySelector('[data-stat="notes"]').textContent =
      notesCount + (notesCount === 1 ? " note" : " notes");
    card.querySelector(".course-card-progress-fill").style.width =
      percent + "%";
    card.querySelector(".course-card-cta").textContent = ctaLabel;

    card.addEventListener("click", () => openCourse(course.data.id, null));
    ui.coursePicker.appendChild(card);
  });
}
