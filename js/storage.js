/**
 * Safe localStorage helpers. Progress is scoped per course id.
 */
(function (global) {
  "use strict";

  const PREFIX = "cwb.v2";
  const LEGACY = Object.freeze({
    finished: "cwb-rn-finished",
    theme: "cwb-rn-theme",
    lastLesson: "cwb-rn-last-lesson",
    openCategory: "cwb-rn-open-category",
    curriculumOpen: "cwb-rn-curriculum-open",
  });

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

  function loadTheme() {
    const modern = readRaw(key("theme"));
    if (modern === "light" || modern === "dark") return modern;
    return readRaw(LEGACY.theme) === "light" ? "light" : "dark";
  }

  function saveTheme(theme) {
    writeRaw(key("theme"), theme === "light" ? "light" : "dark");
  }

  function loadCurriculumOpen(defaultOpen) {
    const modern = readRaw(key("curriculumOpen"));
    if (modern === "0") return false;
    if (modern === "1") return true;
    const legacy = readRaw(LEGACY.curriculumOpen);
    if (legacy === "0") return false;
    if (legacy === "1") return true;
    return defaultOpen;
  }

  function saveCurriculumOpen(isOpen) {
    writeRaw(key("curriculumOpen"), isOpen ? "1" : "0");
  }

  function loadActiveCourseId() {
    return readRaw(key("activeCourse"));
  }

  function saveActiveCourseId(courseId) {
    if (courseId) writeRaw(key("activeCourse"), courseId);
  }

  /* ---------- per-course progress ---------- */

  /**
   * One-time migration from the single-course v1 keys into react-native-2026.
   */
  function migrateLegacyProgress(courseId) {
    if (courseId !== "react-native-2026") return;
    if (readRaw(key(courseId, "migrated")) === "1") return;

    if (readRaw(key(courseId, "finished")) == null) {
      const legacyFinished = readJson(LEGACY.finished, null);
      if (Array.isArray(legacyFinished)) {
        writeJson(key(courseId, "finished"), legacyFinished);
      }
    }

    if (readRaw(key(courseId, "lastLesson")) == null) {
      const last = readRaw(LEGACY.lastLesson);
      if (last) writeRaw(key(courseId, "lastLesson"), last);
    }

    if (readRaw(key(courseId, "openCategory")) == null) {
      const cat = readRaw(LEGACY.openCategory);
      if (cat) writeRaw(key(courseId, "openCategory"), cat);
    }

    writeRaw(key(courseId, "migrated"), "1");
  }

  function loadFinishedIds(courseId) {
    migrateLegacyProgress(courseId);
    const parsed = readJson(key(courseId, "finished"), []);
    return new Set(Array.isArray(parsed) ? parsed : []);
  }

  function saveFinishedIds(courseId, finishedSet) {
    writeJson(key(courseId, "finished"), [...finishedSet]);
  }

  function loadLastLessonId(courseId) {
    migrateLegacyProgress(courseId);
    return readRaw(key(courseId, "lastLesson"));
  }

  function saveLastLessonId(courseId, lessonId) {
    if (lessonId) writeRaw(key(courseId, "lastLesson"), lessonId);
  }

  function loadOpenCategoryId(courseId, validIds) {
    migrateLegacyProgress(courseId);
    const id = readRaw(key(courseId, "openCategory"));
    if (id && validIds.has(id)) return id;
    return null;
  }

  function saveOpenCategoryId(courseId, categoryId) {
    if (categoryId) writeRaw(key(courseId, "openCategory"), categoryId);
  }

  global.CourseStorage = {
    loadTheme,
    saveTheme,
    loadCurriculumOpen,
    saveCurriculumOpen,
    loadActiveCourseId,
    saveActiveCourseId,
    loadFinishedIds,
    saveFinishedIds,
    loadLastLessonId,
    saveLastLessonId,
    loadOpenCategoryId,
    saveOpenCategoryId,
  };
})(window);
