import { describe, expect, it } from "vitest";
import {
  markdownFilenameToLessonId,
  mergeCourseNotes,
  notesMapFromMarkdownFiles,
} from "../lib/course-notes-files";

describe("markdownFilenameToLessonId", () => {
  it("uses the file stem", () => {
    expect(markdownFilenameToLessonId("001-welcome.md")).toBe("001-welcome");
    expect(markdownFilenameToLessonId("notes/002-setup.md")).toBe("002-setup");
  });

  it("rejects non-markdown names", () => {
    expect(markdownFilenameToLessonId("001-welcome.mp4")).toBeNull();
    expect(markdownFilenameToLessonId("")).toBeNull();
    expect(markdownFilenameToLessonId(".md")).toBeNull();
  });
});

describe("notesMapFromMarkdownFiles", () => {
  it("keeps files that match a lesson id", () => {
    const map = notesMapFromMarkdownFiles(
      {
        "001-welcome.md": "# Hi",
        "orphan.md": "skip",
        "readme.txt": "nope",
      },
      new Set(["001-welcome"])
    );
    expect(map).toEqual({ "001-welcome": "# Hi" });
  });
});

describe("mergeCourseNotes", () => {
  it("lets markdown files override notes.js", () => {
    expect(
      mergeCourseNotes(
        { "001-welcome": "from file" },
        { "001-welcome": "from script", "002-setup": "script only" }
      )
    ).toEqual({
      "001-welcome": "from file",
      "002-setup": "script only",
    });
  });
});
