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
  var Icons = ns.Icons;

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
    filesBody: document.getElementById("filesBody"),
    sidebarTabs: document.getElementById("sidebarTabs"),
    tabContent: document.getElementById("tabContent"),
    tabFiles: document.getElementById("tabFiles"),
    panelContent: document.getElementById("panelContent"),
    panelFiles: document.getElementById("panelFiles"),
    main: document.querySelector(".main"),
    playerStage: document.querySelector(".player-stage"),
    progressText: document.getElementById("progressText"),
    progressRing: document.getElementById("progressRing"),
    progressPill: document.getElementById("progressPill"),
    progressLecturesTotal: document.getElementById("progressLecturesTotal"),
    progressLecturesDone: document.getElementById("progressLecturesDone"),
    progressLecturesLeft: document.getElementById("progressLecturesLeft"),
    progressTimeTotal: document.getElementById("progressTimeTotal"),
    progressTimeDone: document.getElementById("progressTimeDone"),
    progressTimeLeft: document.getElementById("progressTimeLeft"),
  };

  /** Injected by main.js during init */
  var videoPlayer = null;
  /** Active sidebar tab: "content" | "files" */
  var activeSidebarTab = "content";
  /** Open resource group in the Files accordion (one at a time, like Content) */
  var openFileGroupId = null;
  var fileGroupsCourseId = null;

  function setVideoPlayer(vp) {
    videoPlayer = vp;
    if (
      videoPlayer &&
      typeof videoPlayer.setTimePersistHandler === "function"
    ) {
      videoPlayer.setTimePersistHandler(function (seconds) {
        if (!state.activeCourse || !state.activeLessonId) return;
        Storage.saveLessonTime(
          state.activeCourse.data.id,
          state.activeLessonId,
          seconds
        );
      });
    }
  }

  /* ---------- progress ---------- */

  /**
   * Aggregate progress across every registered course (library header).
   */
  function libraryProgressTotals() {
    var courses =
      ns.CoursePicker && typeof ns.CoursePicker.getAvailableCourses === "function"
        ? ns.CoursePicker.getAvailableCourses()
        : State.buildAvailableCourses();

    var total = 0;
    var done = 0;
    var totalSeconds = 0;
    var doneSeconds = 0;

    (courses || []).forEach(function (course) {
      var lessons = (course.data && course.data.lessons) || [];
      var finished = Storage.loadFinishedIds(course.data.id);
      lessons.forEach(function (lesson) {
        total += 1;
        var sec = State.lessonDurationSeconds(lesson);
        totalSeconds += sec;
        if (finished.has(lesson.id)) {
          done += 1;
          doneSeconds += sec;
        }
      });
    });

    return {
      total: total,
      done: done,
      totalSeconds: totalSeconds,
      doneSeconds: doneSeconds,
      overall: true,
    };
  }

  function courseProgressTotals() {
    var lessons = state.lessons || [];
    var doneLessons = lessons.filter(function (l) {
      return State.isLessonFinished(l.id);
    });
    return {
      total: lessons.length,
      done: Math.min(doneLessons.length, lessons.length),
      totalSeconds: State.sumLessonDurations(lessons),
      doneSeconds: State.sumLessonDurations(doneLessons),
      overall: false,
    };
  }

  function updateProgress() {
    var stats = state.activeCourse
      ? courseProgressTotals()
      : libraryProgressTotals();

    var total = stats.total;
    var done = stats.done;
    var remaining = Math.max(total - done, 0);
    var percent = total ? Math.round((done / total) * 100) : 0;
    var totalSeconds = stats.totalSeconds;
    var doneSeconds = stats.doneSeconds;
    var remainingSeconds = Math.max(totalSeconds - doneSeconds, 0);
    var scopeLabel = stats.overall ? "Overall" : "";

    if (ui.progressText) {
      ui.progressText.textContent = stats.overall
        ? percent + "% overall"
        : percent + "% complete";
    }
    if (ui.progressRing) {
      ui.progressRing.setAttribute("stroke-dasharray", percent + ", 100");
    }
    if (ui.progressLecturesTotal) {
      ui.progressLecturesTotal.textContent = String(total);
    }
    if (ui.progressLecturesDone) {
      ui.progressLecturesDone.textContent = String(done);
    }
    if (ui.progressLecturesLeft) {
      ui.progressLecturesLeft.textContent = String(remaining);
    }
    if (ui.progressTimeTotal) {
      ui.progressTimeTotal.textContent =
        State.formatDurationTotal(totalSeconds);
    }
    if (ui.progressTimeDone) {
      ui.progressTimeDone.textContent =
        State.formatDurationTotal(doneSeconds);
    }
    if (ui.progressTimeLeft) {
      ui.progressTimeLeft.textContent =
        State.formatDurationTotal(remainingSeconds);
    }
    if (ui.progressPill) {
      ui.progressPill.classList.toggle("is-empty", total === 0);
      ui.progressPill.setAttribute(
        "title",
        stats.overall ? "Overall progress" : "Course progress"
      );
      ui.progressPill.setAttribute(
        "aria-label",
        (scopeLabel ? scopeLabel + " " : "") +
          percent +
          "% complete. " +
          done +
          " of " +
          total +
          " lectures completed, " +
          remaining +
          " remaining. " +
          State.formatDurationTotal(doneSeconds) +
          " of " +
          State.formatDurationTotal(totalSeconds) +
          " watched, " +
          State.formatDurationTotal(remainingSeconds) +
          " remaining."
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
      var startTime = Storage.loadLessonTime(
        state.activeCourse.data.id,
        lesson.id
      );
      videoPlayer.showVideo(videoSrc, { startTime: startTime });
      return;
    }
    if (videoPlayer && typeof videoPlayer.persistTimeNow === "function") {
      videoPlayer.persistTimeNow();
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

  function courseResources() {
    if (!state.activeCourse || !state.activeCourse.data) return [];
    var list = state.activeCourse.data.resources;
    return Array.isArray(list) ? list : [];
  }

  function extensionLabel(path) {
    var m = String(path || "").match(/\.([a-z0-9]+)$/i);
    return m ? m[1].toUpperCase() : "FILE";
  }

  function setSidebarTab(tab) {
    var resources = courseResources();
    var hasFiles = resources.length > 0;
    if (tab === "files" && !hasFiles) tab = "content";
    activeSidebarTab = tab === "files" ? "files" : "content";

    if (ui.tabContent) {
      ui.tabContent.classList.toggle("is-active", activeSidebarTab === "content");
      ui.tabContent.setAttribute(
        "aria-selected",
        activeSidebarTab === "content" ? "true" : "false"
      );
    }
    if (ui.tabFiles) {
      ui.tabFiles.classList.toggle("is-active", activeSidebarTab === "files");
      ui.tabFiles.setAttribute(
        "aria-selected",
        activeSidebarTab === "files" ? "true" : "false"
      );
    }
    if (ui.panelContent) {
      ui.panelContent.classList.toggle("is-active", activeSidebarTab === "content");
      ui.panelContent.hidden = activeSidebarTab !== "content";
    }
    if (ui.panelFiles) {
      ui.panelFiles.classList.toggle("is-active", activeSidebarTab === "files");
      ui.panelFiles.hidden = activeSidebarTab !== "files";
    }
  }

  function updateFilesTabVisibility() {
    var resources = courseResources();
    var hasFiles = resources.length > 0;
    if (ui.tabFiles) {
      ui.tabFiles.classList.toggle("hidden", !hasFiles);
    }
    if (ui.sidebarTabs) {
      ui.sidebarTabs.classList.toggle("is-single", !hasFiles);
      ui.sidebarTabs.classList.toggle("hidden", !hasFiles);
    }
    // When no files, only Content is shown — still show the curriculum panel
    if (!hasFiles) {
      if (ui.tabContent) {
        ui.tabContent.classList.add("is-active");
        ui.tabContent.setAttribute("aria-selected", "true");
      }
      if (ui.panelContent) {
        ui.panelContent.classList.add("is-active");
        ui.panelContent.hidden = false;
      }
      if (ui.panelFiles) {
        ui.panelFiles.classList.remove("is-active");
        ui.panelFiles.hidden = true;
      }
      activeSidebarTab = "content";
    } else if (activeSidebarTab === "files") {
      setSidebarTab("files");
    }
  }

  function groupResources(resources) {
    var groups = [];
    var byGroup = Object.create(null);
    resources.forEach(function (item) {
      if (!item || !item.path) return;
      var group = String(item.group || "Files").trim() || "Files";
      if (!byGroup[group]) {
        byGroup[group] = [];
        groups.push(group);
      }
      byGroup[group].push(item);
    });
    return { groups: groups, byGroup: byGroup };
  }

  function toggleFileGroup(groupName) {
    // Same behavior as Content: only one section open at a time
    openFileGroupId = openFileGroupId === groupName ? null : groupName;
    renderCourseFiles();
  }

  function createFileGroupToggle(groupName, count, isOpen) {
    var toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "category-toggle files-group-toggle";
    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");

    var spacer = document.createElement("span");
    spacer.className = "files-group-spacer";
    spacer.setAttribute("aria-hidden", "true");

    var textWrap = document.createElement("span");
    textWrap.className = "category-text";

    var label = document.createElement("span");
    label.className = "label";
    label.textContent = groupName;

    var meta = document.createElement("span");
    meta.className = "meta";
    meta.textContent = count + (count === 1 ? " file" : " files");

    textWrap.append(label, meta);

    var chevronWrap = document.createElement("span");
    chevronWrap.className = "category-chevron";
    chevronWrap.innerHTML =
      Icons && typeof Icons.chevron === "function" ? Icons.chevron() : "";

    toggle.append(spacer, textWrap, chevronWrap);
    toggle.addEventListener("click", function () {
      toggleFileGroup(groupName);
    });
    return toggle;
  }

  function createFileItem(item) {
    var href = State.resolveCourseAsset(state.activeCourse, item.path);
    if (!href) return null;

    var title = item.title || item.path;
    var desc = item.description || "";
    var ext = extensionLabel(item.path);

    var link = document.createElement("a");
    link.className = "files-item";
    link.href = href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.setAttribute("download", "");

    var icon = document.createElement("span");
    icon.className = "files-item-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML =
      Icons && typeof Icons.fileType === "function"
        ? Icons.fileType(item.path, 16)
        : "";

    var textWrap = document.createElement("span");
    textWrap.className = "title-wrap";

    var titleEl = document.createElement("span");
    titleEl.className = "title";
    titleEl.textContent = title;

    textWrap.appendChild(titleEl);
    if (desc) {
      var meta = document.createElement("span");
      meta.className = "lesson-meta";
      meta.textContent = desc;
      textWrap.appendChild(meta);
    }

    var extEl = document.createElement("span");
    extEl.className = "lesson-duration files-item-ext";
    extEl.textContent = ext;

    link.append(icon, textWrap, extEl);
    return link;
  }

  function renderCourseFiles() {
    if (!ui.filesBody) return;
    var resources = courseResources();
    updateFilesTabVisibility();
    ui.filesBody.innerHTML = "";

    if (!resources.length) {
      var empty = document.createElement("p");
      empty.className = "files-empty";
      empty.textContent = "No downloadable files for this course.";
      ui.filesBody.appendChild(empty);
      return;
    }

    var grouped = groupResources(resources);
    var groups = grouped.groups;
    var byGroup = grouped.byGroup;

    // Per course: expand the first group on first render
    var courseId = state.activeCourse && state.activeCourse.data
      ? state.activeCourse.data.id
      : null;
    if (courseId && courseId !== fileGroupsCourseId) {
      fileGroupsCourseId = courseId;
      openFileGroupId = groups.length ? groups[0] : null;
    }

    // Match Content: scrollable list of collapsible .category sections
    ui.filesBody.classList.add("curriculum-list");

    groups.forEach(function (groupName) {
      var items = byGroup[groupName] || [];
      if (!items.length) return;

      var isOpen = openFileGroupId === groupName;
      var section = document.createElement("div");
      section.className = "category" + (isOpen ? " open" : "");
      section.dataset.fileGroup = groupName;

      var body = document.createElement("div");
      body.className = "category-lessons";
      items.forEach(function (item) {
        var row = createFileItem(item);
        if (row) body.appendChild(row);
      });

      section.append(
        createFileGroupToggle(groupName, items.length, isOpen),
        body
      );
      ui.filesBody.appendChild(section);
    });
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

    // Save playback position for the lesson we're leaving
    if (
      videoPlayer &&
      typeof videoPlayer.persistTimeNow === "function" &&
      state.activeLessonId &&
      state.activeLessonId !== id
    ) {
      videoPlayer.persistTimeNow();
    }

    state.activeLessonId = id;
    Storage.saveLastLessonId(state.activeCourse.data.id, id);
    Curriculum.setOpenCategory(lesson.categoryId);

    showLessonChrome();
    updateLessonHeader(lesson);
    updateLessonMedia(lesson);
    renderCourseFiles();
    renderLessonNotes(lesson);
    setSidebarTab(activeSidebarTab);
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

    if (ui.tabContent) {
      ui.tabContent.addEventListener("click", function () {
        setSidebarTab("content");
      });
    }
    if (ui.tabFiles) {
      ui.tabFiles.addEventListener("click", function () {
        setSidebarTab("files");
      });
    }
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
