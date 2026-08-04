/**
 * Multi-course offline player.
 * Depends on: COURSE_CATALOG, COURSES, COURSE_NOTES?, CourseStorage, CourseIcons, CourseNotes, CourseVideo
 */
(function () {
  "use strict";

  const Storage = window.CourseStorage;
  const Icons = window.CourseIcons;
  const Notes = window.CourseNotes;
  const Video = window.CourseVideo;

  if (!Storage || !Icons || !Notes || !Video) {
    console.error("Course modules missing. Load storage, icons, notes, and player first.");
    return;
  }

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

  const availableCourses = catalog
    .map((entry) => {
      const data = registry[entry.id];
      if (!data || !Array.isArray(data.lessons)) return null;
      return {
        meta: entry,
        data,
        notes: notesRegistry[entry.id] || {},
      };
    })
    .filter(Boolean);

  if (!availableCourses.length) {
    console.error(
      "No courses registered. Add courses/<id>/course.js (+ assets) and list it in catalog.js."
    );
    return;
  }

  /**
   * Site-relative root for a course package, e.g. "courses/react-native-2026".
   * Prefer data.root; fall back to courses/<id>.
   */
  function courseRoot(course) {
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
  function resolveCourseAsset(course, assetPath) {
    if (!assetPath) return null;
    const raw = String(assetPath).trim();
    if (!raw) return null;
    if (/^(https?:|data:|blob:|file:)/i.test(raw)) return raw;
    if (raw.startsWith("courses/")) return raw.replace(/^\.\//, "");
    const root = courseRoot(course);
    const rel = raw.replace(/^\.\//, "").replace(/^\/+/, "");
    return root + "/" + rel;
  }

  /* ---------- DOM ---------- */

  const ui = {
    courseLabel: document.querySelector(".course-label"),
    courseTitle: document.querySelector(".course-title"),
    pageTitle: document.querySelector("title"),
    nav: document.getElementById("nav"),
    themeBtn: document.getElementById("themeBtn"),
    progressText: document.getElementById("progressText"),
    progressRing: document.getElementById("progressRing"),
    progressPill: document.getElementById("progressPill"),
    progressLecturesStat: document.getElementById("progressLecturesStat"),
    progressTimeStat: document.getElementById("progressTimeStat"),
    welcome: document.getElementById("welcome"),
    coursePicker: document.getElementById("coursePicker"),
    courseCountBadge: document.getElementById("courseCountBadge"),
    lessonView: document.getElementById("lessonView"),
    lessonTitle: document.getElementById("lessonTitle"),
    lessonMeta: document.getElementById("lessonMeta"),
    prevBtn: document.getElementById("prevBtn"),
    nextBtn: document.getElementById("nextBtn"),
    doneBtn: document.getElementById("doneBtn"),
    noVideo: document.getElementById("noVideo"),
    notesPanel: document.querySelector(".notes-panel"),
    notesBody: document.getElementById("notesBody"),
    backToCoursesBtn: document.getElementById("backToCoursesBtn"),
    curriculum: document.getElementById("curriculum"),
    curriculumToggle: document.getElementById("curriculumToggle"),
    workspace: document.querySelector(".workspace"),
    main: document.querySelector(".main"),
    playerStage: document.querySelector(".player-stage"),
    player: document.getElementById("player"),
    playerControls: document.getElementById("playerControls"),
    playPauseBtn: document.getElementById("playPauseBtn"),
    muteBtn: document.getElementById("muteBtn"),
    fullscreenBtn: document.getElementById("fsBtn"),
    seekBar: document.getElementById("seekBar"),
    volumeBar: document.getElementById("volumeBar"),
    currentTime: document.getElementById("currentTime"),
    durationTime: document.getElementById("durationTime"),
    playerHud: document.getElementById("playerHud"),
    playerHudIcon: document.getElementById("playerHudIcon"),
    playerHudLabel: document.getElementById("playerHudLabel"),
    playerHudMeter: document.getElementById("playerHudMeter"),
    playerHudMeterFill: document.getElementById("playerHudMeterFill"),
  };

  const videoPlayer = Video.createVideoPlayer({
    video: ui.player,
    stage: ui.playerStage,
    controls: ui.playerControls,
    playPauseBtn: ui.playPauseBtn,
    muteBtn: ui.muteBtn,
    fullscreenBtn: ui.fullscreenBtn,
    seekBar: ui.seekBar,
    volumeBar: ui.volumeBar,
    currentTime: ui.currentTime,
    durationTime: ui.durationTime,
    hud: ui.playerHud,
    hudIcon: ui.playerHudIcon,
    hudLabel: ui.playerHudLabel,
    hudMeter: ui.playerHudMeter,
    hudMeterFill: ui.playerHudMeterFill,
  });

  /* ---------- session state ---------- */

  let activeCourse = null; // { meta, data, notes }
  let lessons = [];
  let categories = [];
  let lessonsById = {};
  let categoryIds = new Set();
  let notesByLessonId = {};
  let finishedIds = new Set();
  let openCategoryId = null;
  let activeLessonId = null;

  /* ---------- helpers ---------- */

  function lessonsInCategory(categoryId) {
    return lessons.filter((lesson) => lesson.categoryId === categoryId);
  }

  function indexOfLesson(id) {
    return lessons.findIndex((lesson) => lesson.id === id);
  }

  function lectureTypeLabel(lesson) {
    const hasVideo = Boolean(lesson.video);
    const hasNotes = Notes.hasNotes(notesByLessonId[lesson.id]);
    if (hasVideo && hasNotes) return "Lecture";
    if (hasVideo) return "Video";
    if (hasNotes) return "Article";
    return "Lesson";
  }

  function categoryTitle(lesson) {
    if (lesson.category) return lesson.category;
    const cat = categories.find((c) => c.id === lesson.categoryId);
    return cat ? cat.title : "";
  }

  /** Lesson duration in seconds from course metadata (`duration`). */
  function lessonDurationSeconds(lesson) {
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
  function formatLessonTime(seconds) {
    if (!seconds) return "";
    return Video.formatTime(seconds);
  }

  /** Human-readable total (e.g. 45m, 1h 12m). */
  function formatDurationTotal(seconds) {
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

  function sumLessonDurations(lessonList) {
    return lessonList.reduce((sum, lesson) => sum + lessonDurationSeconds(lesson), 0);
  }

  /* ---------- theme / sidebar ---------- */

  function applyTheme(theme) {
    const next = theme === "light" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    Storage.saveTheme(next);
    syncThemeButton(next);
  }

  function syncThemeButton(theme) {
    const isLight = theme === "light";
    ui.themeBtn.setAttribute(
      "aria-label",
      isLight ? "Switch to dark theme" : "Switch to light theme"
    );
    ui.themeBtn.title = isLight ? "Dark mode" : "Light mode";
    ui.themeBtn.innerHTML = isLight ? Icons.moon() : Icons.sun();
  }

  function toggleTheme() {
    applyTheme(Storage.loadTheme() === "light" ? "dark" : "light");
  }

  function isCurriculumOpen() {
    return !ui.workspace.classList.contains("curriculum-collapsed");
  }

  function setCurriculumOpen(open) {
    ui.workspace.classList.toggle("curriculum-collapsed", !open);
    ui.curriculumToggle.setAttribute("aria-expanded", open ? "true" : "false");
    Storage.saveCurriculumOpen(open);
  }

  function toggleCurriculum() {
    setCurriculumOpen(!isCurriculumOpen());
  }

  /* ---------- progress / completion ---------- */

  function updateProgress() {
    const total = lessons.length;
    const doneLessons = lessons.filter((l) => isLessonFinished(l.id));
    const done = Math.min(doneLessons.length, total);
    const percent = total ? Math.round((done / total) * 100) : 0;
    const totalSeconds = sumLessonDurations(lessons);
    const doneSeconds = sumLessonDurations(doneLessons);

    if (ui.progressText) ui.progressText.textContent = percent + "% complete";
    if (ui.progressRing) {
      ui.progressRing.setAttribute("stroke-dasharray", percent + ", 100");
    }
    if (ui.progressLecturesStat) {
      ui.progressLecturesStat.textContent = done + " / " + total;
    }
    if (ui.progressTimeStat) {
      ui.progressTimeStat.textContent =
        formatDurationTotal(doneSeconds) + " / " + formatDurationTotal(totalSeconds);
    }
    if (ui.progressPill) {
      ui.progressPill.classList.toggle("is-empty", !activeCourse || total === 0);
      ui.progressPill.setAttribute(
        "aria-label",
        percent +
          "% complete. " +
          done +
          " of " +
          total +
          " lectures. " +
          formatDurationTotal(doneSeconds) +
          " of " +
          formatDurationTotal(totalSeconds) +
          " watched."
      );
    }
  }

  function isLessonFinished(id) {
    return finishedIds.has(id);
  }

  function toggleFinished(id) {
    if (!activeCourse) return;
    if (finishedIds.has(id)) finishedIds.delete(id);
    else finishedIds.add(id);
    Storage.saveFinishedIds(activeCourse.data.id, finishedIds);
    updateProgress();
    updateDoneButton();
    renderCurriculum();
  }

  /** Mark every lesson in a section complete, or clear them if already all complete. */
  function toggleSectionFinished(categoryLessons) {
    if (!activeCourse || !categoryLessons.length) return;
    const allDone = categoryLessons.every((l) => finishedIds.has(l.id));
    categoryLessons.forEach((lesson) => {
      if (allDone) finishedIds.delete(lesson.id);
      else finishedIds.add(lesson.id);
    });
    Storage.saveFinishedIds(activeCourse.data.id, finishedIds);
    updateProgress();
    updateDoneButton();
    renderCurriculum();
  }

  function updateDoneButton() {
    const label = ui.doneBtn.querySelector(".done-label");
    if (!activeLessonId) {
      ui.doneBtn.disabled = true;
      ui.doneBtn.classList.remove("is-done");
      if (label) label.textContent = "Mark as complete";
      return;
    }
    const done = isLessonFinished(activeLessonId);
    ui.doneBtn.disabled = false;
    ui.doneBtn.classList.toggle("is-done", done);
    if (label) label.textContent = done ? "Completed" : "Mark as complete";
  }

  /* ---------- curriculum ---------- */

  function setOpenCategory(categoryId) {
    if (!activeCourse) return;
    openCategoryId = categoryId;
    Storage.saveOpenCategoryId(activeCourse.data.id, openCategoryId);
  }

  function toggleCategorySection(categoryId) {
    setOpenCategory(openCategoryId === categoryId ? null : categoryId);
    renderCurriculum();
  }

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
    const isActive = lesson.id === activeLessonId;
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

    button.addEventListener("click", () => selectLesson(lesson.id));
    return button;
  }

  function renderCurriculum() {
    ui.nav.innerHTML = "";
    if (!activeCourse) return;

    categories.forEach((category, index) => {
      const categoryLessons = lessonsInCategory(category.id);
      if (!categoryLessons.length) return;

      const isOpen = openCategoryId === category.id;
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

  /* ---------- course chrome ---------- */

  function updateCourseChrome(course) {
    const title = course.data.title || course.meta.title || "Course";
    const author = course.data.author || course.meta.author || "";
    if (ui.courseTitle) ui.courseTitle.textContent = title;
    if (ui.courseLabel) ui.courseLabel.textContent = author || "Course";
    if (ui.pageTitle) ui.pageTitle.textContent = author ? title + " · " + author : title;
  }

  function showCoursePicker() {
    activeCourse = null;
    activeLessonId = null;
    lessons = [];
    categories = [];
    lessonsById = {};
    notesByLessonId = {};
    finishedIds = new Set();

    videoPlayer.hideVideo();
    ui.lessonView.classList.add("hidden");
    ui.welcome.classList.remove("hidden");
    ui.nav.innerHTML = "";
    if (ui.workspace) ui.workspace.classList.add("library-mode");
    updateProgress();
    renderCoursePicker();

    if (ui.courseTitle) ui.courseTitle.textContent = "Your courses";
    if (ui.courseLabel) ui.courseLabel.textContent = "CourseDesk";
    if (ui.pageTitle) ui.pageTitle.textContent = "CourseDesk";
    if (ui.backToCoursesBtn) ui.backToCoursesBtn.classList.add("hidden");
  }

  function courseMonogram(title) {
    const words = String(title || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (!words.length) return "C";
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  }

  function renderCoursePicker() {
    if (!ui.coursePicker) return;
    ui.coursePicker.innerHTML = "";

    const count = availableCourses.length;
    if (ui.courseCountBadge) {
      ui.courseCountBadge.textContent =
        count + (count === 1 ? " course" : " courses");
    }

    availableCourses.forEach((course, index) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "course-card";
      card.setAttribute("role", "listitem");
      card.style.setProperty("--card-hue", String((index * 47 + 268) % 360));

      const title = course.data.title || course.meta.title || "Course";
      const author = course.data.author || course.meta.author || "Course";
      const description =
        course.data.description || course.meta.description || "";
      const lessonCount = course.data.lessons.length;
      const videoCount = course.data.lessons.filter((l) => l.video).length;
      const notesCount = Object.keys(course.notes || {}).length;
      const finished = Storage.loadFinishedIds(course.data.id);
      const done = Math.min(finished.size, lessonCount);
      const percent = lessonCount ? Math.round((done / lessonCount) * 100) : 0;
      const ctaLabel = percent > 0 && percent < 100 ? "Continue" : percent === 100 ? "Review" : "Start course";

      card.innerHTML =
        '<div class="course-card-cover" aria-hidden="true">' +
        '<span class="course-card-mono"></span>' +
        '<span class="course-card-cover-label">Course</span>' +
        "</div>" +
        '<div class="course-card-body">' +
        '<div class="course-card-top">' +
        '<div class="course-card-author"></div>' +
        '<div class="course-card-progress-label"></div>' +
        "</div>" +
        '<h3 class="course-card-title"></h3>' +
        '<p class="course-card-desc"></p>' +
        '<div class="course-card-stats">' +
        '<span class="course-stat" data-stat="lessons"></span>' +
        '<span class="course-stat" data-stat="videos"></span>' +
        '<span class="course-stat" data-stat="notes"></span>' +
        "</div>" +
        '<div class="course-card-footer">' +
        '<div class="course-card-progress-track" aria-hidden="true">' +
        '<div class="course-card-progress-fill"></div>' +
        "</div>" +
        '<span class="course-card-cta"></span>' +
        "</div>" +
        "</div>";

      card.querySelector(".course-card-mono").textContent = courseMonogram(title);
      card.querySelector(".course-card-author").textContent = author;
      card.querySelector(".course-card-progress-label").textContent =
        percent + "% complete";
      card.querySelector(".course-card-title").textContent = title;
      card.querySelector(".course-card-desc").textContent = description;
      card.querySelector('[data-stat="lessons"]').textContent =
        lessonCount + (lessonCount === 1 ? " lesson" : " lessons");
      card.querySelector('[data-stat="videos"]').textContent =
        videoCount + (videoCount === 1 ? " video" : " videos");
      card.querySelector('[data-stat="notes"]').textContent =
        notesCount + (notesCount === 1 ? " note" : " notes");
      card.querySelector(".course-card-progress-fill").style.width =
        percent + "%";
      card.querySelector(".course-card-cta").textContent = ctaLabel;

      card.addEventListener("click", () => openCourse(course.data.id));
      ui.coursePicker.appendChild(card);
    });
  }

  function openCourse(courseId) {
    const course = availableCourses.find((c) => c.data.id === courseId);
    if (!course) return;

    activeCourse = course;
    lessons = course.data.lessons;
    categories = course.data.categories || [];
    lessonsById = Object.fromEntries(lessons.map((l) => [l.id, l]));
    categoryIds = new Set(categories.map((c) => c.id));
    notesByLessonId = course.notes || {};
    finishedIds = Storage.loadFinishedIds(course.data.id);
    openCategoryId =
      Storage.loadOpenCategoryId(course.data.id, categoryIds) ||
      (categories[0] ? categories[0].id : null);

    Storage.saveActiveCourseId(course.data.id);
    if (ui.workspace) ui.workspace.classList.remove("library-mode");
    updateCourseChrome(course);
    updateProgress();
    renderCurriculum();

    if (ui.backToCoursesBtn) {
      ui.backToCoursesBtn.classList.remove("hidden");
    }

    const lastId = Storage.loadLastLessonId(course.data.id);
    if (lastId && lessonsById[lastId]) {
      selectLesson(lastId);
    } else if (lessons[0]) {
      // Stay on welcome-within-course? Show first lesson or keep picker hidden with empty lesson view
      ui.welcome.classList.add("hidden");
      // Show curriculum ready; auto-start first lesson for single-course UX
      selectLesson(lessons[0].id);
    } else {
      ui.welcome.classList.add("hidden");
      ui.lessonView.classList.add("hidden");
    }
  }

  /* ---------- lesson view ---------- */

  function showLessonChrome() {
    ui.welcome.classList.add("hidden");
    ui.lessonView.classList.remove("hidden");
  }

  function updateLessonHeader(lesson) {
    ui.lessonTitle.textContent = lesson.title;
    ui.lessonMeta.textContent = categoryTitle(lesson);
  }

  function updateLessonMedia(lesson) {
    const videoSrc = resolveCourseAsset(activeCourse, lesson.video);
    if (videoSrc) {
      ui.noVideo.classList.add("hidden");
      ui.playerStage.classList.remove("hidden");
      videoPlayer.showVideo(videoSrc);
      return;
    }
    videoPlayer.hideVideo();
    // Notes-only lesson: hide the whole player stage for a cleaner article layout
    ui.playerStage.classList.add("hidden");
    ui.noVideo.classList.add("hidden");
  }

  function updateLessonNavigation(lessonId) {
    const index = indexOfLesson(lessonId);
    ui.prevBtn.disabled = index <= 0;
    ui.nextBtn.disabled = index < 0 || index >= lessons.length - 1;
  }

  function renderLessonNotes(lesson) {
    const source = notesByLessonId[lesson.id];
    const has = Notes.hasNotes(source);

    if (ui.notesPanel) {
      ui.notesPanel.classList.toggle("is-empty", !has);
    }

    Notes.renderNotesInto(ui.notesBody, has ? source : null);
  }

  function selectLesson(id) {
    if (!activeCourse) return;
    const lesson = lessonsById[id];
    if (!lesson) return;

    activeLessonId = id;
    Storage.saveLastLessonId(activeCourse.data.id, id);
    setOpenCategory(lesson.categoryId);

    showLessonChrome();
    updateLessonHeader(lesson);
    updateLessonMedia(lesson);
    renderLessonNotes(lesson);
    updateLessonNavigation(id);
    updateDoneButton();
    renderCurriculum();

    if (ui.main) ui.main.scrollTop = 0;
  }

  function goToAdjacentLesson(offset) {
    const index = indexOfLesson(activeLessonId);
    if (index < 0) return;
    const next = lessons[index + offset];
    if (next) selectLesson(next.id);
  }

  function goToPreviousLesson() {
    goToAdjacentLesson(-1);
  }

  function goToNextLesson() {
    goToAdjacentLesson(1);
  }

  function markActiveComplete() {
    if (activeLessonId) toggleFinished(activeLessonId);
  }

  /* ---------- keyboard ---------- */

  function isTypingTarget(target) {
    if (!target || !target.tagName) return false;
    const tag = target.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
  }

  function handleKeydown(event) {
    if (event.defaultPrevented) return;
    if (isTypingTarget(event.target)) return;

    // Arrow keys are reserved for the video player (seek / volume).
    // Lesson navigation: [ previous, ] next.
    switch (event.key) {
      case "[":
        event.preventDefault();
        goToPreviousLesson();
        break;
      case "]":
        event.preventDefault();
        goToNextLesson();
        break;
      case "f":
      case "F":
        // Player uses F for fullscreen when a video is active
        if (
          ui.player &&
          !ui.player.classList.contains("hidden") &&
          ui.player.getAttribute("src")
        ) {
          return;
        }
        if (!event.metaKey && !event.ctrlKey && activeLessonId) {
          event.preventDefault();
          markActiveComplete();
        }
        break;
      default:
        break;
    }
  }

  /* ---------- boot ---------- */

  function bindUiEvents() {
    ui.themeBtn.addEventListener("click", toggleTheme);
    ui.prevBtn.addEventListener("click", goToPreviousLesson);
    ui.nextBtn.addEventListener("click", goToNextLesson);
    ui.doneBtn.addEventListener("click", markActiveComplete);
    ui.curriculumToggle.addEventListener("click", toggleCurriculum);
    document.addEventListener("keydown", handleKeydown);

    if (ui.backToCoursesBtn) {
      ui.backToCoursesBtn.addEventListener("click", () => {
        showCoursePicker();
      });
    }
  }

  function boot() {
    videoPlayer.bindEvents();
    bindUiEvents();
    applyTheme(Storage.loadTheme());
    setCurriculumOpen(Storage.loadCurriculumOpen(true));

    // Always show the catalog (even with one course), unless a prior session has an active course.
    const lastCourseId = Storage.loadActiveCourseId();
    if (lastCourseId && availableCourses.some((c) => c.data.id === lastCourseId)) {
      openCourse(lastCourseId);
    } else {
      showCoursePicker();
    }
  }

  boot();
})();
