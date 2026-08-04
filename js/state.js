/**
 * Centralised app state and course-data helpers.
 *
 * All mutable session state lives here so every UI module can read/write
 * the same object without passing it through function chains.
 */
(function (global) {
  "use strict";

  var ns = (global.CourseDesk = global.CourseDesk || {});
  var Storage = ns.Storage;
  var hasNotes = ns.hasNotes;
  var formatTime = ns.formatTime;

  /* ---------- session state ---------- */

  var state = {
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

  /* ---------- course registry ---------- */

  /**
   * Build the list of available courses from global registries.
   * Course files (course.js, notes.js, catalog.js) set window globals;
   * we read them once here.
   */
  function buildAvailableCourses() {
    var registry = window.COURSES || {};
    var notesRegistry = window.COURSE_NOTES || {};
    var catalog = Array.isArray(window.COURSE_CATALOG)
      ? window.COURSE_CATALOG
      : Object.keys(registry).map(function (id) {
          return {
            id: id,
            title: registry[id].title,
            author: registry[id].author,
            description: registry[id].description,
          };
        });

    return catalog
      .map(function (entry) {
        var data = registry[entry.id];
        if (!data || !Array.isArray(data.lessons)) return null;
        return { meta: entry, data: data, notes: notesRegistry[entry.id] || {} };
      })
      .filter(Boolean);
  }

  /* ---------- path helpers ---------- */

  /**
   * Site-relative root for a course package, e.g. "courses/react-native-2026".
   * Prefer data.root; fall back to courses/<id>.
   */
  function courseRoot(course) {
    var explicit = course.data && course.data.root;
    if (explicit) return String(explicit).replace(/\/+$/, "");
    return "courses/" + course.data.id;
  }

  /**
   * Resolve a course-local asset path to a site-relative URL.
   * - Absolute/remote URLs are left alone
   * - Paths already under courses/ are left alone
   * - Otherwise joined with the course root (e.g. videos/a.mp4)
   */
  function resolveCourseAsset(course, assetPath) {
    if (!assetPath) return null;
    var raw = String(assetPath).trim();
    if (!raw) return null;
    if (/^(https?:|data:|blob:|file:)/i.test(raw)) return raw;
    if (raw.startsWith("courses/")) return raw.replace(/^\.\//, "");
    var root = courseRoot(course);
    var rel = raw.replace(/^\.\//, "").replace(/^\/+/, "");
    return root + "/" + rel;
  }

  /* ---------- lesson helpers ---------- */

  function lessonsInCategory(categoryId) {
    return state.lessons.filter(function (lesson) { return lesson.categoryId === categoryId; });
  }

  function indexOfLesson(id) {
    return state.lessons.findIndex(function (lesson) { return lesson.id === id; });
  }

  function lectureTypeLabel(lesson) {
    var hasVideo = Boolean(lesson.video);
    var hasNote = hasNotes(state.notesByLessonId[lesson.id]);
    if (hasVideo && hasNote) return "Lecture";
    if (hasVideo) return "Video";
    if (hasNote) return "Article";
    return "Lesson";
  }

  function categoryTitle(lesson) {
    if (lesson.category) return lesson.category;
    var cat = state.categories.find(function (c) { return c.id === lesson.categoryId; });
    return cat ? cat.title : "";
  }

  /* ---------- duration helpers ---------- */

  /** Lesson duration in seconds from course metadata (`duration`). */
  function lessonDurationSeconds(lesson) {
    if (!lesson) return 0;
    var raw = lesson.duration;
    if (typeof raw === "number" && isFinite(raw) && raw > 0) return raw;
    if (typeof raw === "string" && raw.trim() && isFinite(Number(raw))) {
      var n = Number(raw);
      return n > 0 ? n : 0;
    }
    return 0;
  }

  /** Compact clock time for a single lecture (e.g. 5:30 or 1:02:15). */
  function formatLessonTime(seconds) {
    if (!seconds) return "";
    return formatTime(seconds);
  }

  /** Human-readable total (e.g. 45m, 1h 12m). */
  function formatDurationTotal(seconds) {
    var total = Math.max(0, Math.round(Number(seconds) || 0));
    if (!total) return "0m";
    var h = Math.floor(total / 3600);
    var m = Math.floor((total % 3600) / 60);
    var s = total % 60;
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

  function sumLessonDurations(lessonList) {
    return lessonList.reduce(function (sum, lesson) { return sum + lessonDurationSeconds(lesson); }, 0);
  }

  /* ---------- completion helpers ---------- */

  function isLessonFinished(id) {
    return state.finishedIds.has(id);
  }

  function courseMonogram(title) {
    var words = String(title || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (!words.length) return "C";
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  }

  /* ---------- state mutations ---------- */

  function resetState() {
    state.activeCourse = null;
    state.activeLessonId = null;
    state.lessons = [];
    state.categories = [];
    state.lessonsById = {};
    state.notesByLessonId = {};
    state.finishedIds = new Set();
  }

  function loadCourseState(course) {
    state.activeCourse = course;
    state.lessons = course.data.lessons;
    state.categories = course.data.categories || [];
    
    state.lessonsById = {};
    state.lessons.forEach(function (l) { state.lessonsById[l.id] = l; });
    
    state.categoryIds = new Set(state.categories.map(function (c) { return c.id; }));
    state.notesByLessonId = course.notes || {};
    state.finishedIds = Storage.loadFinishedIds(course.data.id);
    state.openCategoryId =
      Storage.loadOpenCategoryId(course.data.id, state.categoryIds) ||
      (state.categories[0] ? state.categories[0].id : null);
  }

  ns.state = state;
  ns.State = {
    buildAvailableCourses: buildAvailableCourses,
    courseRoot: courseRoot,
    resolveCourseAsset: resolveCourseAsset,
    lessonsInCategory: lessonsInCategory,
    indexOfLesson: indexOfLesson,
    lectureTypeLabel: lectureTypeLabel,
    categoryTitle: categoryTitle,
    lessonDurationSeconds: lessonDurationSeconds,
    formatLessonTime: formatLessonTime,
    formatDurationTotal: formatDurationTotal,
    sumLessonDurations: sumLessonDurations,
    isLessonFinished: isLessonFinished,
    courseMonogram: courseMonogram,
    resetState: resetState,
    loadCourseState: loadCourseState,
  };
})(window);
