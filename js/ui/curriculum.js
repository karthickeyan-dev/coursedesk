/**
 * Curriculum sidebar — renders the section/lesson list and handles toggles.
 */
(function (global) {
  "use strict";

  var ns = (global.CourseDesk = global.CourseDesk || {});
  var state = ns.state;
  var State = ns.State;
  var Storage = ns.Storage;
  var Icons = ns.Icons;

  /* ---------- DOM refs ---------- */

  var ui = {
    nav: document.getElementById("nav"),
  };

  /* ---------- internal state ---------- */

  /** Forward reference: set by lesson-view so curriculum clicks can select lessons. */
  var onSelectLesson = null;

  function setOnSelectLesson(fn) {
    onSelectLesson = fn;
  }

  /* ---------- category open/close ---------- */

  function setOpenCategory(categoryId) {
    if (!state.activeCourse) return;
    state.openCategoryId = categoryId;
    Storage.saveOpenCategoryId(state.activeCourse.data.id, state.openCategoryId);
  }

  function toggleCategorySection(categoryId) {
    setOpenCategory(state.openCategoryId === categoryId ? null : categoryId);
    renderCurriculum();
  }

  /* ---------- completion toggles ---------- */

  function toggleFinished(id) {
    if (!state.activeCourse) return;
    if (state.finishedIds.has(id)) state.finishedIds.delete(id);
    else state.finishedIds.add(id);
    Storage.saveFinishedIds(state.activeCourse.data.id, state.finishedIds);

    // Call synchronously now instead of dynamic import
    if (ns.LessonView) {
      ns.LessonView.updateProgress();
      ns.LessonView.updateDoneButton();
      renderCurriculum();
    }
  }

  /** Mark every lesson in a section complete, or clear them if already all complete. */
  function toggleSectionFinished(categoryLessons) {
    if (!state.activeCourse || !categoryLessons.length) return;
    var allDone = categoryLessons.every(function (l) { return state.finishedIds.has(l.id); });
    categoryLessons.forEach(function (lesson) {
      if (allDone) state.finishedIds.delete(lesson.id);
      else state.finishedIds.add(lesson.id);
    });
    Storage.saveFinishedIds(state.activeCourse.data.id, state.finishedIds);

    if (ns.LessonView) {
      ns.LessonView.updateProgress();
      ns.LessonView.updateDoneButton();
      renderCurriculum();
    }
  }

  /* ---------- DOM builders ---------- */

  function createCategoryToggle(category, sectionNumber, categoryLessons, isOpen) {
    var doneCount = categoryLessons.filter(function (l) { return State.isLessonFinished(l.id); }).length;
    var sectionSeconds = State.sumLessonDurations(categoryLessons);
    var allDone = doneCount === categoryLessons.length && categoryLessons.length > 0;
    var someDone = doneCount > 0 && !allDone;

    var toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className =
      "category-toggle" + (allDone ? " done" : "") + (someDone ? " partial" : "");
    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");

    var check = document.createElement("span");
    check.className = "check section-check";
    check.innerHTML = Icons.check();
    check.title = allDone ? "Mark section incomplete" : "Mark section complete";
    check.setAttribute("role", "checkbox");
    check.setAttribute("aria-checked", allDone ? "true" : someDone ? "mixed" : "false");
    check.addEventListener("click", function (event) {
      event.stopPropagation();
      toggleSectionFinished(categoryLessons);
    });

    var textWrap = document.createElement("span");
    textWrap.className = "category-text";

    var label = document.createElement("span");
    label.className = "label";
    label.textContent = "Section " + sectionNumber + ": " + category.title;

    var meta = document.createElement("span");
    meta.className = "meta";
    meta.textContent = sectionSeconds
      ? doneCount + "/" + categoryLessons.length + " · " + State.formatDurationTotal(sectionSeconds)
      : doneCount + "/" + categoryLessons.length;

    textWrap.append(label, meta);

    var chevronWrap = document.createElement("span");
    chevronWrap.className = "category-chevron";
    chevronWrap.innerHTML = Icons.chevron();

    toggle.append(check, textWrap, chevronWrap);
    toggle.addEventListener("click", function () { toggleCategorySection(category.id); });
    return toggle;
  }

  function createLessonButton(lesson) {
    var isActive = lesson.id === state.activeLessonId;
    var isDone = State.isLessonFinished(lesson.id);
    var seconds = State.lessonDurationSeconds(lesson);
    var timeLabel = State.formatLessonTime(seconds);

    var button = document.createElement("button");
    button.type = "button";
    button.className =
      "lesson-btn" + (isActive ? " active" : "") + (isDone ? " done" : "");
    button.dataset.id = lesson.id;

    var check = document.createElement("span");
    check.className = "check";
    check.innerHTML = Icons.check();
    check.title = isDone ? "Completed" : "Mark complete";
    check.addEventListener("click", function (event) {
      event.stopPropagation();
      toggleFinished(lesson.id);
    });

    var titleWrap = document.createElement("span");
    titleWrap.className = "title-wrap";

    var title = document.createElement("span");
    title.className = "title";
    title.textContent = lesson.title;

    var meta = document.createElement("span");
    meta.className = "lesson-meta";
    meta.textContent = State.lectureTypeLabel(lesson);

    titleWrap.append(title, meta);

    button.append(check, titleWrap);

    if (timeLabel) {
      var durationEl = document.createElement("span");
      durationEl.className = "lesson-duration";
      durationEl.textContent = timeLabel;
      durationEl.title = State.formatDurationTotal(seconds);
      button.appendChild(durationEl);
    }

    button.addEventListener("click", function () {
      if (onSelectLesson) onSelectLesson(lesson.id);
    });
    return button;
  }

  /* ---------- public ---------- */

  function renderCurriculum() {
    ui.nav.innerHTML = "";
    if (!state.activeCourse) return;

    state.categories.forEach(function (category, index) {
      var categoryLessons = State.lessonsInCategory(category.id);
      if (!categoryLessons.length) return;

      var isOpen = state.openCategoryId === category.id;
      var section = document.createElement("div");
      section.className = "category" + (isOpen ? " open" : "");
      section.dataset.categoryId = category.id;

      var list = document.createElement("div");
      list.className = "category-lessons";
      categoryLessons.forEach(function (lesson) { list.appendChild(createLessonButton(lesson)); });

      section.append(
        createCategoryToggle(category, index + 1, categoryLessons, isOpen),
        list
      );
      ui.nav.appendChild(section);
    });

    var activeButton = ui.nav.querySelector(".lesson-btn.active");
    if (activeButton && typeof activeButton.scrollIntoView === "function") {
      activeButton.scrollIntoView({ block: "nearest" });
    }
  }

  ns.Curriculum = {
    setOnSelectLesson: setOnSelectLesson,
    setOpenCategory: setOpenCategory,
    renderCurriculum: renderCurriculum,
  };
})(window);
