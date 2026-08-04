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
      card.className = "course-card";
      card.setAttribute("role", "listitem");
      card.style.setProperty("--card-hue", String((index * 47 + 268) % 360));

      var title = course.data.title || course.meta.title || "Course";
      var author = course.data.author || course.meta.author || "Course";
      var description =
        course.data.description || course.meta.description || "";
      var lessonCount = course.data.lessons.length;
      var videoCount = course.data.lessons.filter(function (l) { return l.video; }).length;
      var notesCount = Object.keys(course.notes || {}).length;
      var finished = Storage.loadFinishedIds(course.data.id);
      var done = Math.min(finished.size, lessonCount);
      var percent = lessonCount ? Math.round((done / lessonCount) * 100) : 0;
      var ctaLabel =
        percent > 0 && percent < 100
          ? "Continue"
          : percent === 100
          ? "Review"
          : "Start course";

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

      card.querySelector(".course-card-mono").textContent =
        State.courseMonogram(title);
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

      card.addEventListener("click", function () { openCourse(course.data.id, ns.videoPlayerRef); });
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
