import type { AvailableCourse, Category, CourseNotesMap, Lesson } from "../types/course";
import { hasNotes } from "./notes";
import { formatTime } from "./player";
import * as Storage from "./storage";

export interface AppState {
  activeCourse: AvailableCourse | null;
  lessons: Lesson[];
  categories: Category[];
  lessonsById: Record<string, Lesson>;
  categoryIds: Set<string>;
  notesByLessonId: CourseNotesMap;
  finishedIds: Set<string>;
  openCategoryId: string | null;
  activeLessonId: string | null;
}

export const state: AppState = {
  activeCourse: null,
  lessons: [],
  categories: [],
  lessonsById: {},
  categoryIds: new Set(),
  notesByLessonId: {},
  finishedIds: new Set(),
  openCategoryId: null,
  activeLessonId: null,
};

export function buildAvailableCourses(): AvailableCourse[] {
  const registry = window.COURSES || {};
  const notesRegistry = window.COURSE_NOTES || {};
  const result: AvailableCourse[] = [];

  for (const id of Object.keys(registry).sort()) {
    const data = registry[id];
    if (!data || !Array.isArray(data.lessons)) continue;
    const courseId = data.id || id;
    result.push({
      meta: {
        id: courseId,
        title: data.title,
        author: data.author,
        description: data.description,
      },
      data,
      notes: notesRegistry[courseId] || notesRegistry[id] || {},
    });
  }

  return result;
}

export function courseRoot(course: AvailableCourse): string {
  const explicit = course.data?.root;
  if (explicit) return String(explicit).replace(/\/+$/, "");
  return `courses/${course.data.id}`;
}

export function resolveCourseAsset(
  course: AvailableCourse | null,
  assetPath: string | undefined | null
): string | null {
  if (!course || !assetPath) return null;
  const raw = String(assetPath).trim();
  if (!raw) return null;
  if (/^(https?:|data:|blob:|file:)/i.test(raw)) return raw;
  if (raw.startsWith("courses/")) return raw.replace(/^\.\//, "");
  const root = courseRoot(course);
  const rel = raw.replace(/^\.\//, "").replace(/^\/+/, "");
  return `${root}/${rel}`;
}

export function lessonsInCategory(categoryId: string): Lesson[] {
  return state.lessons.filter((lesson) => lesson.categoryId === categoryId);
}

export function indexOfLesson(id: string | null): number {
  if (!id) return -1;
  return state.lessons.findIndex((lesson) => lesson.id === id);
}

export function lectureTypeLabel(lesson: Lesson): string {
  const hasVideo = Boolean(lesson.video);
  const hasNote = hasNotes(state.notesByLessonId[lesson.id]);
  if (hasVideo && hasNote) return "Lecture";
  if (hasVideo) return "Video";
  if (hasNote) return "Article";
  return "Lesson";
}

export function categoryTitle(lesson: Lesson): string {
  if (lesson.category) return lesson.category;
  const cat = state.categories.find((c) => c.id === lesson.categoryId);
  return cat ? cat.title : "";
}

export function lessonDurationSeconds(lesson: Lesson | null | undefined): number {
  if (!lesson) return 0;
  const raw = lesson.duration;
  if (typeof raw === "number" && isFinite(raw) && raw > 0) return raw;
  if (typeof raw === "string" && raw.trim() && isFinite(Number(raw))) {
    const n = Number(raw);
    return n > 0 ? n : 0;
  }
  return 0;
}

export function formatLessonTime(seconds: number): string {
  if (!seconds) return "";
  return formatTime(seconds);
}

export function formatDurationTotal(seconds: number): string {
  const total = Math.max(0, Math.round(Number(seconds) || 0));
  if (!total) return "0m";
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) {
    if (m > 0) return `${h}h ${m}m`;
    return `${h}h`;
  }
  if (m > 0) {
    if (m < 5 && s > 0) return `${m}m ${s}s`;
    return `${m}m`;
  }
  return `${s}s`;
}

export function sumLessonDurations(lessonList: Lesson[]): number {
  return lessonList.reduce((sum, lesson) => sum + lessonDurationSeconds(lesson), 0);
}

export function isLessonFinished(id: string): boolean {
  return state.finishedIds.has(id);
}

export function courseMonogram(title: string): string {
  const words = String(title || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return "C";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function resetState(): void {
  state.activeCourse = null;
  state.activeLessonId = null;
  state.lessons = [];
  state.categories = [];
  state.lessonsById = {};
  state.notesByLessonId = {};
  state.finishedIds = new Set();
}

export function loadCourseState(course: AvailableCourse): void {
  state.activeCourse = course;
  state.lessons = course.data.lessons;
  state.categories = course.data.categories || [];

  state.lessonsById = {};
  for (const l of state.lessons) {
    state.lessonsById[l.id] = l;
  }

  state.categoryIds = new Set(state.categories.map((c) => c.id));
  state.notesByLessonId = course.notes || {};
  state.finishedIds = Storage.loadFinishedIds(course.data.id);
  state.openCategoryId =
    Storage.loadOpenCategoryId(course.data.id, state.categoryIds) ||
    (state.categories[0] ? state.categories[0].id : null);
}
