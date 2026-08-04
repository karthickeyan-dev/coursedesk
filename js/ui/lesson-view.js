/**
 * Lesson view — video loading, notes rendering, progress tracking, and nav.
 */
(function (global) {
  "use strict";

  var ns = (global.CourseDesk = global.CourseDesk || {});
  var state = ns.state;
  var State = ns.State;
  var Storage = ns.Storage;
  var renderNotesInto = ns.renderNotesInto;
  var hasNotes = ns.hasNotes;
  var Curriculum = ns.Curriculum;

  /* ---------- DOM refs ---------- */

  var ui = {
    welcome: document.getElementById("welcome"),
    lessonView: document.getElementById("lessonView"),
    lessonTitle: document.getElementById("lessonTitle"),
    lessonMeta: document.getElementById("lessonMeta"),
    prevBtn: document.getElementById("prevBtn"),
    nextBtn: document.getElementById("nextBtn"),
    doneBtn: document.getElementById("doneBtn"),
    noVideo: document.getElementById("noVideo"),
    notesPanel: document.querySelector(".notes-panel"),
    notesBody: document.getElementById("notesBody"),
    main: document.querySelector(".main"),
    playerStage: document.querySelector(".player-stage"),
    progressText: document.getElementById("progressText"),
    progressRing: document.getElementById("progressRing"),
    progressPill: document.getElementById("progressPill"),
    progressLecturesStat: document.getElementById("progressLecturesStat"),
    progressTimeStat: document.getElementById("progressTimeStat"),
  };

  /** Injected by main.js during init */
  var videoPlayer = null;

  function setVideoPlayer(vp) {
    videoPlayer = vp;
  }

  /* ---------- progress ---------- */

  function updateProgress() {
    var total = state.lessons.length;
    var doneLessons = state.lessons.filter(function (l) { return State.isLessonFinished(l.id); });
    var done = Math.min(doneLessons.length, total);
    var percent = total ? Math.round((done / total) * 100) : 0;
    var totalSeconds = State.sumLessonDurations(state.lessons);
    var doneSeconds = State.sumLessonDurations(doneLessons);

    if (ui.progressText) ui.progressText.textContent = percent + "% complete";
    if (ui.progressRing) {
      ui.progressRing.setAttribute("stroke-dasharray", percent + ", 100");
    }
    if (ui.progressLecturesStat) {
      ui.progressLecturesStat.textContent = done + " / " + total;
    }
    if (ui.progressTimeStat) {
      ui.progressTimeStat.textContent =
        State.formatDurationTotal(doneSeconds) + " / " + State.formatDurationTotal(totalSeconds);
    }
    if (ui.progressPill) {
      ui.progressPill.classList.toggle("is-empty", !state.activeCourse || total === 0);
      ui.progressPill.setAttribute(
        "aria-label",
        percent +
          "% complete. " +
          done +
          " of " +
          total +
          " lectures. " +
          State.formatDurationTotal(doneSeconds) +
          " of " +
          State.formatDurationTotal(totalSeconds) +
          " watched."
      );
    }
  }

  function updateDoneButton() {
    var label = ui.doneBtn.querySelector(".done-label");
    if (!state.activeLessonId) {
      ui.doneBtn.disabled = true;
      ui.doneBtn.classList.remove("is-done");
      if (label) label.textContent = "Mark as complete";
      return;
    }
    var done = State.isLessonFinished(state.activeLessonId);
    ui.doneBtn.disabled = false;
    ui.doneBtn.classList.toggle("is-done", done);
    if (label) label.textContent = done ? "Completed" : "Mark as complete";
  }

  function updateCourseChrome(course) {
    var courseTitle = document.querySelector(".course-title");
    var courseLabel = document.querySelector(".course-label");
    var pageTitle = document.querySelector("title");

    var title = course.data.title || course.meta.title || "Course";
    var author = course.data.author || course.meta.author || "";
    if (courseTitle) courseTitle.textContent = title;
    if (courseLabel) courseLabel.textContent = author || "Course";
    if (pageTitle) pageTitle.textContent = author ? title + " · " + author : title;
  }

  /* ---------- lesson selection ---------- */

  function showLessonChrome() {
    ui.welcome.classList.add("hidden");
    ui.lessonView.classList.remove("hidden");
  }

  function updateLessonHeader(lesson) {
    ui.lessonTitle.textContent = lesson.title;
    ui.lessonMeta.textContent = State.categoryTitle(lesson);
  }

  function updateLessonMedia(lesson) {
    var videoSrc = State.resolveCourseAsset(state.activeCourse, lesson.video);
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
    var index = State.indexOfLesson(lessonId);
    ui.prevBtn.disabled = index <= 0;
    ui.nextBtn.disabled = index < 0 || index >= state.lessons.length - 1;
  }

  function renderLessonNotes(lesson) {
    var source = state.notesByLessonId[lesson.id];
    var has = hasNotes(source);

    if (ui.notesPanel) {
      ui.notesPanel.classList.toggle("is-empty", !has);
    }

    renderNotesInto(ui.notesBody, has ? source : null);
  }

  function selectLesson(id, vp) {
    if (vp) videoPlayer = vp;
    if (!state.activeCourse) return;
    var lesson = state.lessonsById[id];
    if (!lesson) return;

    state.activeLessonId = id;
    Storage.saveLastLessonId(state.activeCourse.data.id, id);
    Curriculum.setOpenCategory(lesson.categoryId);

    showLessonChrome();
    updateLessonHeader(lesson);
    updateLessonMedia(lesson);
    renderLessonNotes(lesson);
    updateLessonNavigation(id);
    updateDoneButton();
    Curriculum.renderCurriculum();

    if (ui.main) ui.main.scrollTop = 0;
  }

  /* ---------- nav helpers ---------- */

  function goToAdjacentLesson(offset) {
    var index = State.indexOfLesson(state.activeLessonId);
    if (index < 0) return;
    var next = state.lessons[index + offset];
    if (next) selectLesson(next.id);
  }

  function goToPreviousLesson() {
    goToAdjacentLesson(-1);
  }

  function goToNextLesson() {
    goToAdjacentLesson(1);
  }

  function markActiveComplete() {
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

  /* ---------- event binding ---------- */

  function bindLessonEvents() {
    ui.prevBtn.addEventListener("click", goToPreviousLesson);
    ui.nextBtn.addEventListener("click", goToNextLesson);
    ui.doneBtn.addEventListener("click", markActiveComplete);
  }

  ns.LessonView = {
    setVideoPlayer: setVideoPlayer,
    updateProgress: updateProgress,
    updateDoneButton: updateDoneButton,
    updateCourseChrome: updateCourseChrome,
    selectLesson: selectLesson,
    goToPreviousLesson: goToPreviousLesson,
    goToNextLesson: goToNextLesson,
    markActiveComplete: markActiveComplete,
    bindLessonEvents: bindLessonEvents,
  };
})(window);
