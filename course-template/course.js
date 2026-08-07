/**
 * TEMPLATE — copy this entire folder to:
 *   courses/<your-course-id>/
 *
 * Then rename keys/ids from "example-course" to your real course id.
 * See course-template/AGENTS.md for the full packaging guide.
 *
 * Self-contained package (all under courses/<id>/):
 *   course.js     required  metadata + curriculum (+ library card text)
 *   notes.js      optional  markdown notes keyed by lesson id
 *   videos/       optional  lecture video files
 *   assets/       optional  images, pdfs, downloads, etc.
 *
 * No app registration — drop the folder under courses/ and refresh.
 * Paths in this file are relative to the course folder root.
 * The player resolves them to: courses/<id>/<path>
 *
 * Lesson fields:
 *   id          string  required  unique within the course (stable slug)
 *   title       string  required
 *   categoryId  string  required  must match a category.id
 *   category    string  optional  display label (usually category title)
 *   num         string  optional  lecture number shown in UI
 *   video       string  optional  e.g. "videos/01-welcome.mp4"
 *   duration    number  optional  length in seconds (curriculum UI)
 *
 * Optional course.resources[] powers the Files tab in the course sidebar:
 *   id           string  required  stable id
 *   title        string  required
 *   path         string  required  relative to course root (e.g. assets/brief.pdf)
 *   description  string  optional
 *   group        string  optional  section heading in the Files list
 */
(function (global) {
  "use strict";

  global.COURSES = global.COURSES || {};
  global.COURSES["example-course"] = {
    id: "example-course",
    // Folder that holds this course's files (must match the directory name)
    root: "courses/example-course",
    title: "Example Course",
    author: "You",
    description:
      "Self-contained sample course. Videos and notes are optional per lesson.",
    categories: [
      { id: "getting-started", title: "Getting Started" },
      { id: "deep-dive", title: "Deep Dive" },
    ],
    // Optional — omit or use [] to hide the Files tab
    resources: [
      // {
      //   id: "cheatsheet",
      //   title: "Course cheatsheet",
      //   path: "assets/cheatsheet.pdf",
      //   description: "Printable reference",
      //   group: "Reference",
      // },
    ],
    lessons: [
      {
        id: "01-welcome",
        num: "01",
        title: "Welcome",
        categoryId: "getting-started",
        category: "Getting Started",
        video: "videos/01-welcome.mp4",
        duration: 125,
      },
      {
        id: "02-reading",
        num: "02",
        title: "Reading material (no video)",
        categoryId: "getting-started",
        category: "Getting Started",
        // no video → article / notes-only lesson
      },
      {
        id: "03-advanced",
        num: "03",
        title: "Advanced topic",
        categoryId: "deep-dive",
        category: "Deep Dive",
        video: "videos/03-advanced.mp4",
      },
    ],
  };
})(window);
