/**
 * Course picker — renders the library grid and handles course selection.
 */
(function (global) {
  "use strict";

  var ns = (global.CourseDesk = global.CourseDesk || {});
  var state = ns.state;
  var State = ns.State;
  var Storage = ns.Storage;
  var Curriculum = ns.Curriculum;
  var LessonView = ns.LessonView;

  var availableCourses = [];

  /* ---------- DOM refs ---------- */

  var ui = {
    workspace: document.querySelector(".workspace"),
    courseTitle: document.querySelector(".course-title"),
    courseLabel: document.querySelector(".course-label"),
    pageTitle: document.querySelector("title"),
    welcome: document.getElementById("welcome"),
    coursePicker: document.getElementById("coursePicker"),
    courseCountBadge: document.getElementById("courseCountBadge"),
    lessonView: document.getElementById("lessonView"),
    nav: document.getElementById("nav"),
    backToCoursesBtn: document.getElementById("backToCoursesBtn"),
  };

  /* ---------- public ---------- */

  function initCourses() {
    availableCourses = State.buildAvailableCourses();

    if (!availableCourses.length) {
      console.error(
        "No courses registered. Add courses/<id>/course.js (+ assets) and list it in catalog.js."
      );
    }

    return availableCourses;
  }

  function getAvailableCourses() {
    return availableCourses;
  }

  function showCoursePicker(videoPlayer) {
    State.resetState();
    // Clear so a refresh on the library stays on the library (not last course).
    Storage.saveActiveCourseId(null);

    videoPlayer.hideVideo();
    ui.lessonView.classList.add("hidden");
    ui.welcome.classList.remove("hidden");
    ui.nav.innerHTML = "";
    if (ui.workspace) ui.workspace.classList.add("library-mode");
    LessonView.updateProgress();
    renderCoursePicker();

    if (ui.courseTitle) ui.courseTitle.textContent = "Your courses";
    if (ui.courseLabel) ui.courseLabel.textContent = "CourseDesk";
    if (ui.pageTitle) ui.pageTitle.textContent = "CourseDesk";
    if (ui.backToCoursesBtn) ui.backToCoursesBtn.classList.add("hidden");
  }

  function openCourse(courseId, videoPlayer) {
    var course = availableCourses.find(function (c) { return c.data.id === courseId; });
    if (!course) return;

    State.loadCourseState(course);

    Storage.saveActiveCourseId(course.data.id);
    if (ui.workspace) ui.workspace.classList.remove("library-mode");
    LessonView.updateCourseChrome(course);
    LessonView.updateProgress();
    Curriculum.renderCurriculum();

    if (ui.backToCoursesBtn) {
      ui.backToCoursesBtn.classList.remove("hidden");
    }

    var lastId = Storage.loadLastLessonId(course.data.id);
    if (lastId && state.lessonsById[lastId]) {
      LessonView.selectLesson(lastId, videoPlayer);
    } else if (state.lessons[0]) {
      ui.welcome.classList.add("hidden");
      LessonView.selectLesson(state.lessons[0].id, videoPlayer);
    } else {
      ui.welcome.classList.add("hidden");
      ui.lessonView.classList.add("hidden");
    }
  }

  /* ---------- internal ---------- */

  function renderCoursePicker() {
    if (!ui.coursePicker) return;
    ui.coursePicker.innerHTML = "";

    var count = availableCourses.length;
    if (ui.courseCountBadge) {
      ui.courseCountBadge.textContent =
        count + (count === 1 ? " course" : " courses");
    }

    availableCourses.forEach(function (course, index) {
      var card = document.createElement("button");
      card.type = "button";
      card.className = "course-thumb";
      card.setAttribute("role", "listitem");
      card.style.setProperty("--card-hue", String((index * 47 + 268) % 360));

      var title = course.data.title || course.meta.title || "Course";
      var author = course.data.author || course.meta.author || "Course";
      var lessons = course.data.lessons || [];
      var lessonCount = lessons.length;
      var finished = Storage.loadFinishedIds(course.data.id);
      var done = lessons.reduce(function (n, lesson) {
        return n + (finished.has(lesson.id) ? 1 : 0);
      }, 0);
      var percent = lessonCount ? Math.round((done / lessonCount) * 100) : 0;
      var totalSeconds = State.sumLessonDurations(lessons);
      var durationLabel =
        totalSeconds > 0 ? State.formatDurationTotal(totalSeconds) : "";
      var progressLabel =
        percent === 0
          ? "Not started"
          : percent === 100
          ? "Completed"
          : done + " / " + lessonCount + " · " + percent + "%";
      var metaParts = [
        lessonCount + (lessonCount === 1 ? " lesson" : " lessons"),
      ];
      if (durationLabel) metaParts.push(durationLabel);

      card.innerHTML =
        '<div class="course-thumb-media" aria-hidden="true">' +
        '<span class="course-thumb-mono"></span>' +
        '<span class="course-thumb-badge"></span>' +
        '<div class="course-thumb-progress-track">' +
        '<div class="course-thumb-progress-fill"></div>' +
        "</div>" +
        "</div>" +
        '<div class="course-thumb-body">' +
        '<h3 class="course-thumb-title"></h3>' +
        '<p class="course-thumb-author"></p>' +
        '<p class="course-thumb-meta"></p>' +
        '<p class="course-thumb-progress-label"></p>' +
        "</div>";

      card.querySelector(".course-thumb-mono").textContent =
        State.courseMonogram(title);
      card.querySelector(".course-thumb-badge").textContent =
        percent > 0 ? percent + "%" : "New";
      card.querySelector(".course-thumb-progress-fill").style.width =
        percent + "%";
      card.querySelector(".course-thumb-title").textContent = title;
      card.querySelector(".course-thumb-author").textContent = author;
      card.querySelector(".course-thumb-meta").textContent = metaParts.join(" · ");
      card.querySelector(".course-thumb-progress-label").textContent =
        progressLabel;
      card.setAttribute(
        "aria-label",
        title + " by " + author + ". " + progressLabel + "."
      );

      card.addEventListener("click", function () {
        openCourse(course.data.id, ns.videoPlayerRef);
      });
      ui.coursePicker.appendChild(card);
    });
  }

  ns.CoursePicker = {
    initCourses: initCourses,
    getAvailableCourses: getAvailableCourses,
    showCoursePicker: showCoursePicker,
    openCourse: openCourse,
  };
})(window);
