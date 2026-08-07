import { el, id, idOpt, qs, setText, toggleClass } from "../lib/dom";
import { Icons } from "../lib/icons";
import { hasNotes, renderNotesInto } from "../lib/notes";
import type { VideoPlayer } from "../lib/player";
import { getAvailableCourses } from "../lib/registry";
import * as Storage from "../lib/storage";
import * as State from "../lib/state";
import { state } from "../lib/state";
import type { AvailableCourse, CourseResource, Lesson } from "../types/course";
import * as Curriculum from "./curriculum";

const ui = {
  welcome: id("welcome"),
  lessonView: id("lessonView"),
  lessonTitle: id("lessonTitle"),
  lessonMeta: id("lessonMeta"),
  prevBtn: id<HTMLButtonElement>("prevBtn"),
  nextBtn: id<HTMLButtonElement>("nextBtn"),
  doneBtn: id<HTMLButtonElement>("doneBtn"),
  noVideo: id("noVideo"),
  notesPanel: qs(".notes-panel"),
  notesBody: id("notesBody"),
  filesBody: idOpt("filesBody"),
  sidebarTabs: idOpt("sidebarTabs"),
  tabContent: idOpt<HTMLButtonElement>("tabContent"),
  tabFiles: idOpt<HTMLButtonElement>("tabFiles"),
  panelContent: idOpt("panelContent"),
  panelFiles: idOpt("panelFiles"),
  main: qs(".main"),
  playerStage: qs(".player-stage")!,
  progressText: idOpt("progressText"),
  progressRing: idOpt("progressRing"),
  progressPill: idOpt("progressPill"),
  progressLecturesTotal: idOpt("progressLecturesTotal"),
  progressLecturesDone: idOpt("progressLecturesDone"),
  progressLecturesLeft: idOpt("progressLecturesLeft"),
  progressTimeTotal: idOpt("progressTimeTotal"),
  progressTimeDone: idOpt("progressTimeDone"),
  progressTimeLeft: idOpt("progressTimeLeft"),
};

let videoPlayer: VideoPlayer | null = null;
let activeSidebarTab: "content" | "files" = "content";
let openFileGroupId: string | null = null;
let fileGroupsCourseId: string | null = null;

export function setVideoPlayer(vp: VideoPlayer): void {
  videoPlayer = vp;
  videoPlayer.setTimePersistHandler((seconds) => {
    if (!state.activeCourse || !state.activeLessonId) return;
    Storage.saveLessonTime(
      state.activeCourse.data.id,
      state.activeLessonId,
      seconds
    );
  });
}

/* ---------- progress chrome ---------- */

function progressStats() {
  if (state.activeCourse) {
    const lessons = state.lessons;
    const doneLessons = lessons.filter((l) => State.isLessonFinished(l.id));
    return {
      total: lessons.length,
      done: doneLessons.length,
      totalSeconds: State.sumLessonDurations(lessons),
      doneSeconds: State.sumLessonDurations(doneLessons),
      overall: false as const,
    };
  }

  let total = 0;
  let done = 0;
  let totalSeconds = 0;
  let doneSeconds = 0;
  for (const course of getAvailableCourses()) {
    const finished = Storage.loadFinishedIds(course.data.id);
    for (const lesson of course.data.lessons || []) {
      total += 1;
      const sec = State.lessonDurationSeconds(lesson);
      totalSeconds += sec;
      if (finished.has(lesson.id)) {
        done += 1;
        doneSeconds += sec;
      }
    }
  }
  return { total, done, totalSeconds, doneSeconds, overall: true as const };
}

export function updateProgress(): void {
  const stats = progressStats();
  const { total, done, totalSeconds, doneSeconds, overall } = stats;
  const remaining = Math.max(total - done, 0);
  const percent = total ? Math.round((done / total) * 100) : 0;
  const remainingSeconds = Math.max(totalSeconds - doneSeconds, 0);
  const fmt = State.formatDurationTotal;

  setText(
    ui.progressText,
    overall ? `${percent}% overall` : `${percent}% complete`
  );
  ui.progressRing?.setAttribute("stroke-dasharray", `${percent}, 100`);
  setText(ui.progressLecturesTotal, String(total));
  setText(ui.progressLecturesDone, String(done));
  setText(ui.progressLecturesLeft, String(remaining));
  setText(ui.progressTimeTotal, fmt(totalSeconds));
  setText(ui.progressTimeDone, fmt(doneSeconds));
  setText(ui.progressTimeLeft, fmt(remainingSeconds));

  if (ui.progressPill) {
    toggleClass(ui.progressPill, "is-empty", total === 0);
    ui.progressPill.setAttribute(
      "title",
      overall ? "Overall progress" : "Course progress"
    );
    ui.progressPill.setAttribute(
      "aria-label",
      `${overall ? "Overall " : ""}${percent}% complete. ${done} of ${total} lectures completed, ${remaining} remaining. ${fmt(doneSeconds)} of ${fmt(totalSeconds)} watched, ${fmt(remainingSeconds)} remaining.`
    );
  }
}

export function updateDoneButton(): void {
  const label = ui.doneBtn.querySelector(".done-label");
  if (!state.activeLessonId) {
    ui.doneBtn.disabled = true;
    toggleClass(ui.doneBtn, "is-done", false);
    setText(label, "Mark as complete");
    return;
  }
  const done = State.isLessonFinished(state.activeLessonId);
  ui.doneBtn.disabled = false;
  toggleClass(ui.doneBtn, "is-done", done);
  setText(label, done ? "Completed" : "Mark as complete");
}

export function updateCourseChrome(course: AvailableCourse): void {
  const title = course.data.title || course.meta.title || "Course";
  const author = course.data.author || course.meta.author || "";
  setText(qs(".course-title"), title);
  setText(qs(".course-label"), author || "Course");
  setText(
    document.querySelector("title"),
    author ? `${title} · ${author}` : title
  );
}

/* ---------- lesson media / notes ---------- */

function showLessonChrome(): void {
  toggleClass(ui.welcome, "hidden", true);
  toggleClass(ui.lessonView, "hidden", false);
}

function updateLessonMedia(lesson: Lesson): void {
  if (!videoPlayer || !state.activeCourse) return;
  const src = State.resolveCourseAsset(state.activeCourse, lesson.video);
  if (src) {
    toggleClass(ui.noVideo, "hidden", true);
    toggleClass(ui.playerStage, "hidden", false);
    videoPlayer.showVideo(src, {
      startTime: Storage.loadLessonTime(state.activeCourse.data.id, lesson.id),
    });
    return;
  }
  videoPlayer.persistTimeNow();
  videoPlayer.hideVideo();
  toggleClass(ui.playerStage, "hidden", true);
  toggleClass(ui.noVideo, "hidden", true);
}

function updateLessonNavigation(lessonId: string): void {
  const index = State.indexOfLesson(lessonId);
  ui.prevBtn.disabled = index <= 0;
  ui.nextBtn.disabled = index < 0 || index >= state.lessons.length - 1;
}

/* ---------- files sidebar (same markup as before) ---------- */

function courseResources(): CourseResource[] {
  const list = state.activeCourse?.data?.resources;
  return Array.isArray(list) ? list : [];
}

function extensionLabel(path: string): string {
  const m = String(path || "").match(/\.([a-z0-9]+)$/i);
  return m ? m[1].toUpperCase() : "FILE";
}

function setSidebarTab(tab: "content" | "files"): void {
  const hasFiles = courseResources().length > 0;
  if (tab === "files" && !hasFiles) tab = "content";
  activeSidebarTab = tab;
  const isContent = tab === "content";

  toggleClass(ui.tabContent, "is-active", isContent);
  ui.tabContent?.setAttribute("aria-selected", String(isContent));
  toggleClass(ui.tabFiles, "is-active", !isContent);
  ui.tabFiles?.setAttribute("aria-selected", String(!isContent));

  toggleClass(ui.panelContent, "is-active", isContent);
  if (ui.panelContent) ui.panelContent.hidden = !isContent;
  toggleClass(ui.panelFiles, "is-active", !isContent);
  if (ui.panelFiles) ui.panelFiles.hidden = isContent;
}

function updateFilesTabVisibility(): void {
  const hasFiles = courseResources().length > 0;
  toggleClass(ui.tabFiles, "hidden", !hasFiles);
  toggleClass(ui.sidebarTabs, "is-single", !hasFiles);
  toggleClass(ui.sidebarTabs, "hidden", !hasFiles);

  if (!hasFiles) {
    toggleClass(ui.tabContent, "is-active", true);
    ui.tabContent?.setAttribute("aria-selected", "true");
    toggleClass(ui.panelContent, "is-active", true);
    if (ui.panelContent) ui.panelContent.hidden = false;
    toggleClass(ui.panelFiles, "is-active", false);
    if (ui.panelFiles) ui.panelFiles.hidden = true;
    activeSidebarTab = "content";
  } else if (activeSidebarTab === "files") {
    setSidebarTab("files");
  }
}

function groupResources(resources: CourseResource[]) {
  const groups: string[] = [];
  const byGroup: Record<string, CourseResource[]> = Object.create(null);
  for (const item of resources) {
    if (!item?.path) continue;
    const group = String(item.group || "Files").trim() || "Files";
    if (!byGroup[group]) {
      byGroup[group] = [];
      groups.push(group);
    }
    byGroup[group].push(item);
  }
  return { groups, byGroup };
}

function fileGroupToggle(name: string, count: number, open: boolean) {
  return el("button", {
    className: "category-toggle files-group-toggle",
    attrs: {
      type: "button",
      "aria-expanded": open ? "true" : "false",
    },
    on: {
      click: () => {
        openFileGroupId = openFileGroupId === name ? null : name;
        renderCourseFiles();
      },
    },
    children: [
      el("span", {
        className: "files-group-spacer",
        attrs: { "aria-hidden": "true" },
      }),
      el("span", {
        className: "category-text",
        children: [
          el("span", { className: "label", text: name }),
          el("span", {
            className: "meta",
            text: `${count} file${count === 1 ? "" : "s"}`,
          }),
        ],
      }),
      el("span", { className: "category-chevron", html: Icons.chevron() }),
    ],
  });
}

function fileItem(item: CourseResource): HTMLAnchorElement | null {
  const href = State.resolveCourseAsset(state.activeCourse, item.path);
  if (!href) return null;

  const textWrap = el("span", {
    className: "title-wrap",
    children: [
      el("span", { className: "title", text: item.title || item.path }),
      item.description
        ? el("span", { className: "lesson-meta", text: item.description })
        : null,
    ],
  });

  return el("a", {
    className: "files-item",
    attrs: {
      href,
      target: "_blank",
      rel: "noopener noreferrer",
      download: "",
    },
    children: [
      el("span", {
        className: "files-item-icon",
        html: Icons.fileType(item.path, 16),
        attrs: { "aria-hidden": "true" },
      }),
      textWrap,
      el("span", {
        className: "lesson-duration files-item-ext",
        text: extensionLabel(item.path),
      }),
    ],
  });
}

function renderCourseFiles(): void {
  if (!ui.filesBody) return;
  const resources = courseResources();
  updateFilesTabVisibility();
  ui.filesBody.innerHTML = "";

  if (!resources.length) {
    ui.filesBody.append(
      el("p", {
        className: "files-empty",
        text: "No downloadable files for this course.",
      })
    );
    return;
  }

  const { groups, byGroup } = groupResources(resources);
  const courseId = state.activeCourse?.data?.id ?? null;
  if (courseId && courseId !== fileGroupsCourseId) {
    fileGroupsCourseId = courseId;
    openFileGroupId = groups[0] ?? null;
  }

  ui.filesBody.classList.add("curriculum-list");

  for (const groupName of groups) {
    const items = byGroup[groupName] || [];
    if (!items.length) continue;
    const open = openFileGroupId === groupName;
    const body = el("div", {
      className: "category-lessons",
      children: items.map(fileItem).filter(Boolean) as Node[],
    });
    ui.filesBody.append(
      el("div", {
        className: "category" + (open ? " open" : ""),
        attrs: { "data-file-group": groupName },
        children: [fileGroupToggle(groupName, items.length, open), body],
      })
    );
  }
}

/* ---------- public API ---------- */

export function selectLesson(lessonId: string, vp?: VideoPlayer): void {
  if (vp) videoPlayer = vp;
  if (!state.activeCourse) return;
  const lesson = state.lessonsById[lessonId];
  if (!lesson) return;

  if (videoPlayer && state.activeLessonId && state.activeLessonId !== lessonId) {
    videoPlayer.persistTimeNow();
  }

  state.activeLessonId = lessonId;
  Storage.saveLastLessonId(state.activeCourse.data.id, lessonId);
  Curriculum.setOpenCategory(lesson.categoryId);

  showLessonChrome();
  setText(ui.lessonTitle, lesson.title);
  setText(ui.lessonMeta, State.categoryTitle(lesson));
  updateLessonMedia(lesson);
  renderCourseFiles();
  {
    const source = state.notesByLessonId[lesson.id];
    const has = hasNotes(source);
    toggleClass(ui.notesPanel, "is-empty", !has);
    renderNotesInto(ui.notesBody, has ? source : null);
  }
  setSidebarTab(activeSidebarTab);
  updateLessonNavigation(lessonId);
  updateDoneButton();
  Curriculum.renderCurriculum();
  if (ui.main) ui.main.scrollTop = 0;
}

function go(offset: number): void {
  const i = State.indexOfLesson(state.activeLessonId);
  if (i < 0) return;
  const next = state.lessons[i + offset];
  if (next) selectLesson(next.id);
}

export const goToPreviousLesson = (): void => go(-1);
export const goToNextLesson = (): void => go(1);

export function markActiveComplete(): void {
  if (!state.activeLessonId || !state.activeCourse) return;
  if (state.finishedIds.has(state.activeLessonId)) {
    state.finishedIds.delete(state.activeLessonId);
  } else {
    state.finishedIds.add(state.activeLessonId);
  }
  Storage.saveFinishedIds(state.activeCourse.data.id, state.finishedIds);
  updateProgress();
  updateDoneButton();
  Curriculum.renderCurriculum();
}

export function bindLessonEvents(): void {
  ui.prevBtn.addEventListener("click", goToPreviousLesson);
  ui.nextBtn.addEventListener("click", goToNextLesson);
  ui.doneBtn.addEventListener("click", markActiveComplete);
  ui.tabContent?.addEventListener("click", () => setSidebarTab("content"));
  ui.tabFiles?.addEventListener("click", () => setSidebarTab("files"));
}
