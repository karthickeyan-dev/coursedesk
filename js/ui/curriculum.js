/**
 * Curriculum sidebar — renders the section/lesson list and handles toggles.
 */

import state, {
  lessonsInCategory,
  isLessonFinished,
  lessonDurationSeconds,
  formatLessonTime,
  formatDurationTotal,
  sumLessonDurations,
  lectureTypeLabel,
} from '../state.js';
import * as Storage from '../storage.js';
import Icons from '../icons.js';

/* ---------- DOM refs ---------- */

const ui = {
  nav: document.getElementById("nav"),
};

/* ---------- internal state ---------- */

/** Forward reference: set by lesson-view so curriculum clicks can select lessons. */
let onSelectLesson = null;

export function setOnSelectLesson(fn) {
  onSelectLesson = fn;
}

/* ---------- category open/close ---------- */

function setOpenCategory(categoryId) {
  if (!state.activeCourse) return;
  state.openCategoryId = categoryId;
  Storage.saveOpenCategoryId(state.activeCourse.data.id, state.openCategoryId);
}

function toggleCategorySection(categoryId) {
  setOpenCategory(state.openCategoryId === categoryId ? null : categoryId);
  renderCurriculum();
}

/* ---------- completion toggles ---------- */

function toggleFinished(id) {
  if (!state.activeCourse) return;
  if (state.finishedIds.has(id)) state.finishedIds.delete(id);
  else state.finishedIds.add(id);
  Storage.saveFinishedIds(state.activeCourse.data.id, state.finishedIds);

  // Lazy-import to avoid circular dependency at module parse time
  import('./lesson-view.js').then(({ updateProgress, updateDoneButton }) => {
    updateProgress();
    updateDoneButton();
    renderCurriculum();
  });
}

/** Mark every lesson in a section complete, or clear them if already all complete. */
function toggleSectionFinished(categoryLessons) {
  if (!state.activeCourse || !categoryLessons.length) return;
  const allDone = categoryLessons.every((l) => state.finishedIds.has(l.id));
  categoryLessons.forEach((lesson) => {
    if (allDone) state.finishedIds.delete(lesson.id);
    else state.finishedIds.add(lesson.id);
  });
  Storage.saveFinishedIds(state.activeCourse.data.id, state.finishedIds);

  import('./lesson-view.js').then(({ updateProgress, updateDoneButton }) => {
    updateProgress();
    updateDoneButton();
    renderCurriculum();
  });
}

/* ---------- DOM builders ---------- */

function createCategoryToggle(category, sectionNumber, categoryLessons, isOpen) {
  const doneCount = categoryLessons.filter((l) => isLessonFinished(l.id)).length;
  const sectionSeconds = sumLessonDurations(categoryLessons);
  const allDone = doneCount === categoryLessons.length && categoryLessons.length > 0;
  const someDone = doneCount > 0 && !allDone;

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className =
    "category-toggle" + (allDone ? " done" : "") + (someDone ? " partial" : "");
  toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");

  const check = document.createElement("span");
  check.className = "check section-check";
  check.innerHTML = Icons.check();
  check.title = allDone ? "Mark section incomplete" : "Mark section complete";
  check.setAttribute("role", "checkbox");
  check.setAttribute("aria-checked", allDone ? "true" : someDone ? "mixed" : "false");
  check.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleSectionFinished(categoryLessons);
  });

  const textWrap = document.createElement("span");
  textWrap.className = "category-text";

  const label = document.createElement("span");
  label.className = "label";
  label.textContent = "Section " + sectionNumber + ": " + category.title;

  const meta = document.createElement("span");
  meta.className = "meta";
  meta.textContent = sectionSeconds
    ? doneCount + "/" + categoryLessons.length + " · " + formatDurationTotal(sectionSeconds)
    : doneCount + "/" + categoryLessons.length;

  textWrap.append(label, meta);

  const chevronWrap = document.createElement("span");
  chevronWrap.className = "category-chevron";
  chevronWrap.innerHTML = Icons.chevron();

  toggle.append(check, textWrap, chevronWrap);
  toggle.addEventListener("click", () => toggleCategorySection(category.id));
  return toggle;
}

function createLessonButton(lesson) {
  const isActive = lesson.id === state.activeLessonId;
  const isDone = isLessonFinished(lesson.id);
  const seconds = lessonDurationSeconds(lesson);
  const timeLabel = formatLessonTime(seconds);

  const button = document.createElement("button");
  button.type = "button";
  button.className =
    "lesson-btn" + (isActive ? " active" : "") + (isDone ? " done" : "");
  button.dataset.id = lesson.id;

  const check = document.createElement("span");
  check.className = "check";
  check.innerHTML = Icons.check();
  check.title = isDone ? "Completed" : "Mark complete";
  check.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleFinished(lesson.id);
  });

  const titleWrap = document.createElement("span");
  titleWrap.className = "title-wrap";

  const title = document.createElement("span");
  title.className = "title";
  title.textContent = lesson.title;

  const meta = document.createElement("span");
  meta.className = "lesson-meta";
  meta.textContent = lectureTypeLabel(lesson);

  titleWrap.append(title, meta);

  button.append(check, titleWrap);

  if (timeLabel) {
    const durationEl = document.createElement("span");
    durationEl.className = "lesson-duration";
    durationEl.textContent = timeLabel;
    durationEl.title = formatDurationTotal(seconds);
    button.appendChild(durationEl);
  }

  button.addEventListener("click", () => {
    if (onSelectLesson) onSelectLesson(lesson.id);
  });
  return button;
}

/* ---------- public ---------- */

export function renderCurriculum() {
  ui.nav.innerHTML = "";
  if (!state.activeCourse) return;

  state.categories.forEach((category, index) => {
    const categoryLessons = lessonsInCategory(category.id);
    if (!categoryLessons.length) return;

    const isOpen = state.openCategoryId === category.id;
    const section = document.createElement("div");
    section.className = "category" + (isOpen ? " open" : "");
    section.dataset.categoryId = category.id;

    const list = document.createElement("div");
    list.className = "category-lessons";
    categoryLessons.forEach((lesson) => list.appendChild(createLessonButton(lesson)));

    section.append(
      createCategoryToggle(category, index + 1, categoryLessons, isOpen),
      list
    );
    ui.nav.appendChild(section);
  });

  const activeButton = ui.nav.querySelector(".lesson-btn.active");
  if (activeButton && typeof activeButton.scrollIntoView === "function") {
    activeButton.scrollIntoView({ block: "nearest" });
  }
}

export { setOpenCategory };
