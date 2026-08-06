/**
 * localStorage helpers — prefs and course progress as separate keys.
 *
 *   coursedesk.theme         "dark" | "light"
 *   coursedesk.sidebar       "1" | "0"  (curriculum open)
 *   coursedesk.activeCourse  course id (removed when on library)
 *   coursedesk.courses       JSON map of courseId → progress
 *
 * Progress record:
 *   { completedLessonIds, lastLessonId, openCategoryId, playbackPositions }
 *
 * Public load/save methods keep stable signatures for UI modules.
 * Orphaned course entries are removed via pruneCourses(validIds).
 */
(function (global) {
  "use strict";

  var ns = (global.CourseDesk = global.CourseDesk || {});

  var PREFIX = "coursedesk";

  function storeKey(name) {
    return PREFIX + "." + name;
  }

  var KEY_THEME = storeKey("theme");
  var KEY_SIDEBAR = storeKey("sidebar");
  var KEY_ACTIVE_COURSE = storeKey("activeCourse");
  var KEY_COURSES = storeKey("courses");

  /** In-memory courses map; loaded once, written on course mutations. */
  var coursesCache = null;

  /* ---------- raw I/O ---------- */

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

  function removeRaw(name) {
    try {
      localStorage.removeItem(name);
    } catch (e) {
      /* ignore */
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

  /* ---------- course record shape ---------- */

  function emptyCourseRecord() {
    return {
      completedLessonIds: [],
      lastLessonId: null,
      openCategoryId: null,
      playbackPositions: {},
    };
  }

  function isPlainObject(value) {
    return value != null && typeof value === "object" && !Array.isArray(value);
  }

  function normalizePlaybackPositions(raw) {
    if (!isPlainObject(raw)) return {};
    var out = {};
    Object.keys(raw).forEach(function (lessonId) {
      var n = typeof raw[lessonId] === "number" ? raw[lessonId] : Number(raw[lessonId]);
      if (isFinite(n) && n >= 3) out[lessonId] = Math.floor(n);
    });
    return out;
  }

  function normalizeCourseRecord(raw) {
    var base = emptyCourseRecord();
    if (!isPlainObject(raw)) return base;

    var finished = raw.completedLessonIds;
    base.completedLessonIds = Array.isArray(finished)
      ? finished.filter(function (id) {
          return typeof id === "string" && id;
        })
      : [];

    var last = raw.lastLessonId;
    base.lastLessonId = typeof last === "string" && last ? last : null;

    var open = raw.openCategoryId;
    base.openCategoryId = typeof open === "string" && open ? open : null;

    base.playbackPositions = normalizePlaybackPositions(raw.playbackPositions);

    return base;
  }

  function normalizeCoursesMap(parsed) {
    var map = {};
    if (!isPlainObject(parsed)) return map;
    Object.keys(parsed).forEach(function (courseId) {
      if (!courseId) return;
      map[courseId] = normalizeCourseRecord(parsed[courseId]);
    });
    return map;
  }

  function ensureCourses() {
    if (coursesCache) return coursesCache;
    coursesCache = normalizeCoursesMap(readJson(KEY_COURSES, {}));
    return coursesCache;
  }

  function persistCourses() {
    if (!coursesCache) return false;
    return writeJson(KEY_COURSES, coursesCache);
  }

  function ensureCourse(courseId) {
    var map = ensureCourses();
    if (!courseId) return emptyCourseRecord();
    if (!map[courseId]) {
      map[courseId] = emptyCourseRecord();
    }
    return map[courseId];
  }

  /* ---------- global prefs ---------- */

  function loadTheme() {
    var val = readRaw(KEY_THEME);
    return val === "light" ? "light" : "dark";
  }

  function saveTheme(theme) {
    writeRaw(KEY_THEME, theme === "light" ? "light" : "dark");
  }

  function loadCurriculumOpen(defaultOpen) {
    var val = readRaw(KEY_SIDEBAR);
    if (val === "0") return false;
    if (val === "1") return true;
    return defaultOpen;
  }

  function saveCurriculumOpen(isOpen) {
    writeRaw(KEY_SIDEBAR, isOpen ? "1" : "0");
  }

  function loadActiveCourseId() {
    return readRaw(KEY_ACTIVE_COURSE) || null;
  }

  function saveActiveCourseId(courseId) {
    // null/empty clears — used when returning to the course list so refresh stays there
    if (courseId) writeRaw(KEY_ACTIVE_COURSE, String(courseId));
    else removeRaw(KEY_ACTIVE_COURSE);
  }

  /* ---------- per-course progress ---------- */

  function loadFinishedIds(courseId) {
    if (!courseId) return new Set();
    var course = ensureCourses()[courseId];
    var list =
      course && Array.isArray(course.completedLessonIds)
        ? course.completedLessonIds
        : [];
    return new Set(list);
  }

  function saveFinishedIds(courseId, finishedSet) {
    if (!courseId) return;
    var course = ensureCourse(courseId);
    course.completedLessonIds = Array.from(finishedSet || []);
    persistCourses();
  }

  function loadLastLessonId(courseId) {
    if (!courseId) return null;
    var course = ensureCourses()[courseId];
    return course && course.lastLessonId ? course.lastLessonId : null;
  }

  function saveLastLessonId(courseId, lessonId) {
    if (!courseId || !lessonId) return;
    var course = ensureCourse(courseId);
    course.lastLessonId = lessonId;
    persistCourses();
  }

  function loadOpenCategoryId(courseId, validIds) {
    if (!courseId) return null;
    var course = ensureCourses()[courseId];
    var id = course && course.openCategoryId ? course.openCategoryId : null;
    if (id && validIds && typeof validIds.has === "function" && validIds.has(id)) {
      return id;
    }
    return null;
  }

  function saveOpenCategoryId(courseId, categoryId) {
    if (!courseId || !categoryId) return;
    var course = ensureCourse(courseId);
    course.openCategoryId = categoryId;
    persistCourses();
  }

  /** Map of lessonId → last playback position in seconds. */
  function loadLessonTimes(courseId) {
    if (!courseId) return {};
    var course = ensureCourses()[courseId];
    return course && isPlainObject(course.playbackPositions)
      ? Object.assign({}, course.playbackPositions)
      : {};
  }

  function loadLessonTime(courseId, lessonId) {
    if (!courseId || !lessonId) return 0;
    var map = loadLessonTimes(courseId);
    var raw = map[lessonId];
    var n = typeof raw === "number" ? raw : Number(raw);
    return isFinite(n) && n > 0 ? n : 0;
  }

  function saveLessonTime(courseId, lessonId, seconds) {
    if (!courseId || !lessonId) return;
    var t = Math.floor(Number(seconds) || 0);
    if (t < 0) t = 0;

    var course = ensureCourse(courseId);
    var map = course.playbackPositions;
    if (!isPlainObject(map)) {
      map = {};
      course.playbackPositions = map;
    }

    if (t < 3) {
      // Near the start — drop the key so we don't resume at 0–2s
      if (map[lessonId] != null) {
        delete map[lessonId];
        persistCourses();
      }
      return;
    }

    map[lessonId] = t;
    persistCourses();
  }

  /**
   * Drop progress for courses no longer registered.
   * @param {string[]|Set<string>} validIds
   */
  function pruneCourses(validIds) {
    var map = ensureCourses();
    var valid = new Set();

    if (validIds && typeof validIds.forEach === "function") {
      validIds.forEach(function (id) {
        if (id) valid.add(String(id));
      });
    }

    var changed = false;
    Object.keys(map).forEach(function (courseId) {
      if (!valid.has(courseId)) {
        delete map[courseId];
        changed = true;
      }
    });

    if (changed) persistCourses();

    var active = loadActiveCourseId();
    if (active && !valid.has(active)) {
      saveActiveCourseId(null);
    }
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
    loadLessonTimes: loadLessonTimes,
    loadLessonTime: loadLessonTime,
    saveLessonTime: saveLessonTime,
    pruneCourses: pruneCourses,
  };
})(window);
