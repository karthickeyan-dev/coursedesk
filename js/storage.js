/**
 * Safe localStorage helpers. Progress is scoped per course id.
 */
(function (global) {
  "use strict";

  var ns = (global.CourseDesk = global.CourseDesk || {});

  var PREFIX = "cwb.v2";

  function key() {
    var parts = [PREFIX];
    for (var i = 0; i < arguments.length; i++) parts.push(arguments[i]);
    return parts.join(".");
  }

  function readRaw(name) {
    try {
      return localStorage.getItem(name);
    } catch (e) {
      return null;
    }
  }

  function writeRaw(name, value) {
    try {
      localStorage.setItem(name, value);
      return true;
    } catch (e) {
      return false;
    }
  }

  function readJson(name, fallback) {
    var raw = readRaw(name);
    if (raw == null) return fallback;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function writeJson(name, value) {
    return writeRaw(name, JSON.stringify(value));
  }

  /* ---------- global prefs ---------- */

  function loadTheme() {
    var val = readRaw(key("theme"));
    return val === "light" ? "light" : "dark";
  }

  function saveTheme(theme) {
    writeRaw(key("theme"), theme === "light" ? "light" : "dark");
  }

  function loadCurriculumOpen(defaultOpen) {
    var val = readRaw(key("curriculumOpen"));
    if (val === "0") return false;
    if (val === "1") return true;
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

  function loadFinishedIds(courseId) {
    var parsed = readJson(key(courseId, "finished"), []);
    return new Set(Array.isArray(parsed) ? parsed : []);
  }

  function saveFinishedIds(courseId, finishedSet) {
    writeJson(key(courseId, "finished"), Array.from(finishedSet));
  }

  function loadLastLessonId(courseId) {
    return readRaw(key(courseId, "lastLesson"));
  }

  function saveLastLessonId(courseId, lessonId) {
    if (lessonId) writeRaw(key(courseId, "lastLesson"), lessonId);
  }

  function loadOpenCategoryId(courseId, validIds) {
    var id = readRaw(key(courseId, "openCategory"));
    if (id && validIds.has(id)) return id;
    return null;
  }

  function saveOpenCategoryId(courseId, categoryId) {
    if (categoryId) writeRaw(key(courseId, "openCategory"), categoryId);
  }

  ns.Storage = {
    loadTheme: loadTheme,
    saveTheme: saveTheme,
    loadCurriculumOpen: loadCurriculumOpen,
    saveCurriculumOpen: saveCurriculumOpen,
    loadActiveCourseId: loadActiveCourseId,
    saveActiveCourseId: saveActiveCourseId,
    loadFinishedIds: loadFinishedIds,
    saveFinishedIds: saveFinishedIds,
    loadLastLessonId: loadLastLessonId,
    saveLastLessonId: saveLastLessonId,
    loadOpenCategoryId: loadOpenCategoryId,
    saveOpenCategoryId: saveOpenCategoryId,
  };
})(window);
