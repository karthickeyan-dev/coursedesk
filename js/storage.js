/**
 * Safe localStorage helpers. Progress is scoped per course id.
 */

const PREFIX = "cwb.v2";

function key(...parts) {
  return [PREFIX, ...parts].join(".");
}

function readRaw(name) {
  try {
    return localStorage.getItem(name);
  } catch {
    return null;
  }
}

function writeRaw(name, value) {
  try {
    localStorage.setItem(name, value);
    return true;
  } catch {
    return false;
  }
}

function readJson(name, fallback) {
  const raw = readRaw(name);
  if (raw == null) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJson(name, value) {
  return writeRaw(name, JSON.stringify(value));
}

/* ---------- global prefs ---------- */

export function loadTheme() {
  const val = readRaw(key("theme"));
  return val === "light" ? "light" : "dark";
}

export function saveTheme(theme) {
  writeRaw(key("theme"), theme === "light" ? "light" : "dark");
}

export function loadCurriculumOpen(defaultOpen) {
  const val = readRaw(key("curriculumOpen"));
  if (val === "0") return false;
  if (val === "1") return true;
  return defaultOpen;
}

export function saveCurriculumOpen(isOpen) {
  writeRaw(key("curriculumOpen"), isOpen ? "1" : "0");
}

export function loadActiveCourseId() {
  return readRaw(key("activeCourse"));
}

export function saveActiveCourseId(courseId) {
  if (courseId) writeRaw(key("activeCourse"), courseId);
}

/* ---------- per-course progress ---------- */

export function loadFinishedIds(courseId) {
  const parsed = readJson(key(courseId, "finished"), []);
  return new Set(Array.isArray(parsed) ? parsed : []);
}

export function saveFinishedIds(courseId, finishedSet) {
  writeJson(key(courseId, "finished"), [...finishedSet]);
}

export function loadLastLessonId(courseId) {
  return readRaw(key(courseId, "lastLesson"));
}

export function saveLastLessonId(courseId, lessonId) {
  if (lessonId) writeRaw(key(courseId, "lastLesson"), lessonId);
}

export function loadOpenCategoryId(courseId, validIds) {
  const id = readRaw(key(courseId, "openCategory"));
  if (id && validIds.has(id)) return id;
  return null;
}

export function saveOpenCategoryId(courseId, categoryId) {
  if (categoryId) writeRaw(key(courseId, "openCategory"), categoryId);
}
