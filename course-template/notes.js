/**
 * TEMPLATE — optional notes for a course package.
 * Place next to course.js inside courses/<id>/.
 *
 * Keys must match lesson ids exactly. Lessons without an entry have no notes.
 * Omit this file entirely if the course has no notes.
 *
 * Values are Markdown strings (rendered by marked + highlight.js).
 */
(function (global) {
  "use strict";

  global.COURSE_NOTES = global.COURSE_NOTES || {};
  global.COURSE_NOTES["example-course"] = {
    "01-welcome":
      "# Welcome\n\nThis lesson has a video **and** notes.\n\n```ts\nconst hello = \"world\";\nconsole.log(hello);\n```\n",
    "02-reading":
      "# Reading material\n\nNo video for this lesson — notes only.\n\n- Point one\n- Point two\n",
    // "03-advanced" omitted → no notes panel content
  };
})(window);
