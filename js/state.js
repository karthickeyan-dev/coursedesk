/**
 * Centralised app state and course-data helpers.
 *
 * All mutable session state lives here so every UI module can read/write
 * the same object without passing it through function chains.
 */

import * as Storage from './storage.js';
import { hasNotes } from './notes.js';
import { formatTime } from './player.js';

/* ---------- session state ---------- */

const state = {
  activeCourse: null,   // { meta, data, notes }
  lessons: [],
  categories: [],
  lessonsById: {},
  categoryIds: new Set(),
  notesByLessonId: {},
  finishedIds: new Set(),
  openCategoryId: null,
  activeLessonId: null,
};

export default state;

/* ---------- course registry ---------- */

/**
 * Build the list of available courses from global registries.
 * Course files (course.js, notes.js, catalog.js) set window globals;
 * we read them once here.
 */
export function buildAvailableCourses() {
  const registry = window.COURSES || {};
  const notesRegistry = window.COURSE_NOTES || {};
  const catalog = Array.isArray(window.COURSE_CATALOG)
    ? window.COURSE_CATALOG
    : Object.keys(registry).map((id) => ({
        id,
        title: registry[id].title,
        author: registry[id].author,
        description: registry[id].description,
      }));

  return catalog
    .map((entry) => {
      const data = registry[entry.id];
      if (!data || !Array.isArray(data.lessons)) return null;
      return { meta: entry, data, notes: notesRegistry[entry.id] || {} };
    })
    .filter(Boolean);
}

/* ---------- path helpers ---------- */

/**
 * Site-relative root for a course package, e.g. "courses/react-native-2026".
 * Prefer data.root; fall back to courses/<id>.
 */
export function courseRoot(course) {
  const explicit = course.data && course.data.root;
  if (explicit) return String(explicit).replace(/\/+$/, "");
  return "courses/" + course.data.id;
}

/**
 * Resolve a course-local asset path to a site-relative URL.
 * - Absolute/remote URLs are left alone
 * - Paths already under courses/ are left alone
 * - Otherwise joined with the course root (e.g. videos/a.mp4)
 */
export function resolveCourseAsset(course, assetPath) {
  if (!assetPath) return null;
  const raw = String(assetPath).trim();
  if (!raw) return null;
  if (/^(https?:|data:|blob:|file:)/i.test(raw)) return raw;
  if (raw.startsWith("courses/")) return raw.replace(/^\.\//, "");
  const root = courseRoot(course);
  const rel = raw.replace(/^\.\//, "").replace(/^\/+/, "");
  return root + "/" + rel;
}

/* ---------- lesson helpers ---------- */

export function lessonsInCategory(categoryId) {
  return state.lessons.filter((lesson) => lesson.categoryId === categoryId);
}

export function indexOfLesson(id) {
  return state.lessons.findIndex((lesson) => lesson.id === id);
}

export function lectureTypeLabel(lesson) {
  const hasVideo = Boolean(lesson.video);
  const hasNote = hasNotes(state.notesByLessonId[lesson.id]);
  if (hasVideo && hasNote) return "Lecture";
  if (hasVideo) return "Video";
  if (hasNote) return "Article";
  return "Lesson";
}

export function categoryTitle(lesson) {
  if (lesson.category) return lesson.category;
  const cat = state.categories.find((c) => c.id === lesson.categoryId);
  return cat ? cat.title : "";
}

/* ---------- duration helpers ---------- */

/** Lesson duration in seconds from course metadata (`duration`). */
export function lessonDurationSeconds(lesson) {
  if (!lesson) return 0;
  const raw = lesson.duration;
  if (typeof raw === "number" && isFinite(raw) && raw > 0) return raw;
  if (typeof raw === "string" && raw.trim() && isFinite(Number(raw))) {
    const n = Number(raw);
    return n > 0 ? n : 0;
  }
  return 0;
}

/** Compact clock time for a single lecture (e.g. 5:30 or 1:02:15). */
export function formatLessonTime(seconds) {
  if (!seconds) return "";
  return formatTime(seconds);
}

/** Human-readable total (e.g. 45m, 1h 12m). */
export function formatDurationTotal(seconds) {
  const total = Math.max(0, Math.round(Number(seconds) || 0));
  if (!total) return "0m";
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) {
    if (m > 0) return h + "h " + m + "m";
    return h + "h";
  }
  if (m > 0) {
    if (m < 5 && s > 0) return m + "m " + s + "s";
    return m + "m";
  }
  return s + "s";
}

export function sumLessonDurations(lessonList) {
  return lessonList.reduce((sum, lesson) => sum + lessonDurationSeconds(lesson), 0);
}

/* ---------- completion helpers ---------- */

export function isLessonFinished(id) {
  return state.finishedIds.has(id);
}

export function courseMonogram(title) {
  const words = String(title || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return "C";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/* ---------- state mutations ---------- */

export function resetState() {
  state.activeCourse = null;
  state.activeLessonId = null;
  state.lessons = [];
  state.categories = [];
  state.lessonsById = {};
  state.notesByLessonId = {};
  state.finishedIds = new Set();
}

export function loadCourseState(course) {
  state.activeCourse = course;
  state.lessons = course.data.lessons;
  state.categories = course.data.categories || [];
  state.lessonsById = Object.fromEntries(state.lessons.map((l) => [l.id, l]));
  state.categoryIds = new Set(state.categories.map((c) => c.id));
  state.notesByLessonId = course.notes || {};
  state.finishedIds = Storage.loadFinishedIds(course.data.id);
  state.openCategoryId =
    Storage.loadOpenCategoryId(course.data.id, state.categoryIds) ||
    (state.categories[0] ? state.categories[0].id : null);
}
