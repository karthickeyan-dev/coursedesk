import { el, id } from "../lib/dom";
import { Icons } from "../lib/icons";
import * as Storage from "../lib/storage";
import * as State from "../lib/state";
import { state } from "../lib/state";
import type { Category, Lesson } from "../types/course";

const nav = id("nav");

let onSelectLesson: ((id: string) => void) | null = null;
/** Notifies shell to refresh progress chrome after completion toggles. */
let onFinishedChange: (() => void) | null = null;

export function setOnSelectLesson(fn: (id: string) => void): void {
  onSelectLesson = fn;
}

export function setOnFinishedChange(fn: () => void): void {
  onFinishedChange = fn;
}

export function setOpenCategory(categoryId: string | null): void {
  if (!state.activeCourse) return;
  state.openCategoryId = categoryId;
  if (categoryId) {
    Storage.saveOpenCategoryId(state.activeCourse.data.id, categoryId);
  }
}

function persistFinished(): void {
  if (!state.activeCourse) return;
  Storage.saveFinishedIds(state.activeCourse.data.id, state.finishedIds);
  onFinishedChange?.();
  renderCurriculum();
}

function toggleLessonFinished(lessonId: string): void {
  if (!state.activeCourse) return;
  if (state.finishedIds.has(lessonId)) state.finishedIds.delete(lessonId);
  else state.finishedIds.add(lessonId);
  persistFinished();
}

function toggleSectionFinished(lessons: Lesson[]): void {
  if (!state.activeCourse || !lessons.length) return;
  const allDone = lessons.every((l) => state.finishedIds.has(l.id));
  for (const lesson of lessons) {
    if (allDone) state.finishedIds.delete(lesson.id);
    else state.finishedIds.add(lesson.id);
  }
  persistFinished();
}

function categoryToggle(
  category: Category,
  sectionNumber: number,
  lessons: Lesson[],
  isOpen: boolean
): HTMLButtonElement {
  const done = lessons.filter((l) => State.isLessonFinished(l.id)).length;
  const seconds = State.sumLessonDurations(lessons);
  const allDone = done === lessons.length && lessons.length > 0;
  const someDone = done > 0 && !allDone;

  const check = el("span", {
    className: "check section-check",
    html: Icons.check(),
    attrs: {
      role: "checkbox",
      "aria-checked": allDone ? "true" : someDone ? "mixed" : "false",
      title: allDone ? "Mark section incomplete" : "Mark section complete",
    },
    on: {
      click: (e) => {
        e.stopPropagation();
        toggleSectionFinished(lessons);
      },
    },
  });

  const metaText = seconds
    ? `${done}/${lessons.length} · ${State.formatDurationTotal(seconds)}`
    : `${done}/${lessons.length}`;

  return el("button", {
    className:
      "category-toggle" + (allDone ? " done" : "") + (someDone ? " partial" : ""),
    attrs: {
      type: "button",
      "aria-expanded": isOpen ? "true" : "false",
    },
    on: { click: () => {
      setOpenCategory(state.openCategoryId === category.id ? null : category.id);
      renderCurriculum();
    } },
    children: [
      check,
      el("span", {
        className: "category-text",
        children: [
          el("span", {
            className: "label",
            text: `Section ${sectionNumber}: ${category.title}`,
          }),
          el("span", { className: "meta", text: metaText }),
        ],
      }),
      el("span", { className: "category-chevron", html: Icons.chevron() }),
    ],
  });
}

function lessonButton(lesson: Lesson): HTMLButtonElement {
  const active = lesson.id === state.activeLessonId;
  const done = State.isLessonFinished(lesson.id);
  const seconds = State.lessonDurationSeconds(lesson);
  const timeLabel = State.formatLessonTime(seconds);

  const check = el("span", {
    className: "check",
    html: Icons.check(),
    attrs: { title: done ? "Completed" : "Mark complete" },
    on: {
      click: (e) => {
        e.stopPropagation();
        toggleLessonFinished(lesson.id);
      },
    },
  });

  const btn = el("button", {
    className: "lesson-btn" + (active ? " active" : "") + (done ? " done" : ""),
    attrs: { type: "button", "data-id": lesson.id },
    on: { click: () => onSelectLesson?.(lesson.id) },
    children: [
      check,
      el("span", {
        className: "title-wrap",
        children: [
          el("span", { className: "title", text: lesson.title }),
          el("span", {
            className: "lesson-meta",
            text: State.lectureTypeLabel(lesson),
          }),
        ],
      }),
    ],
  });

  if (timeLabel) {
    btn.append(
      el("span", {
        className: "lesson-duration",
        text: timeLabel,
        attrs: { title: State.formatDurationTotal(seconds) },
      })
    );
  }
  return btn;
}

export function renderCurriculum(): void {
  nav.innerHTML = "";
  if (!state.activeCourse) return;

  state.categories.forEach((category, index) => {
    const lessons = State.lessonsInCategory(category.id);
    if (!lessons.length) return;

    const isOpen = state.openCategoryId === category.id;
    const list = el("div", {
      className: "category-lessons",
      children: lessons.map(lessonButton),
    });

    nav.append(
      el("div", {
        className: "category" + (isOpen ? " open" : ""),
        attrs: { "data-category-id": category.id },
        children: [categoryToggle(category, index + 1, lessons, isOpen), list],
      })
    );
  });

  nav.querySelector<HTMLElement>(".lesson-btn.active")?.scrollIntoView({
    block: "nearest",
  });
}
