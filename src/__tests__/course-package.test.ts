import { afterEach, describe, expect, it, vi } from "vitest";
import { availableCourseFromPackage, parseCoursePackage } from "../lib/course-package";
import type { CourseData } from "../types/course";

const valid = {
  id: "my-course",
  title: "My Course",
  author: "You",
  description: "Short blurb.",
  categories: [{ id: "getting-started", title: "Getting Started" }],
  resources: [
    {
      id: "cheatsheet",
      title: "Cheatsheet",
      path: "assets/cheatsheet.pdf",
    },
  ],
  lessons: [
    {
      id: "001-welcome",
      num: "001",
      title: "Welcome",
      categoryId: "getting-started",
      category: "Getting Started",
      video: "videos/001-welcome.mp4",
    },
    {
      id: "002-article",
      title: "Read this",
      categoryId: "getting-started",
    },
  ],
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("parseCoursePackage", () => {
  it("parses a valid object and sets id/root from the folder", () => {
    const data = parseCoursePackage(JSON.stringify(valid), "my-course");
    expect(data.id).toBe("my-course");
    expect(data.root).toBe("courses/my-course");
    expect(data.title).toBe("My Course");
    expect(data.author).toBe("You");
    expect(data.description).toBe("Short blurb.");
    expect(data.categories).toEqual(valid.categories);
    expect(data.resources).toEqual(valid.resources);
    expect(data.lessons).toHaveLength(2);
    expect(data.lessons[1]?.video).toBeUndefined();
  });

  it("lets folder id win over a mismatched JSON id", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const data = parseCoursePackage(JSON.stringify(valid), "other-folder");
    expect(data.id).toBe("other-folder");
    expect(data.root).toBe("courses/other-folder");
    expect(warn).toHaveBeenCalled();
  });

  it("fills id when JSON omits it", () => {
    const withoutId = { ...valid, id: undefined };
    const data = parseCoursePackage(JSON.stringify(withoutId), "folder-id");
    expect(data.id).toBe("folder-id");
    expect(data.root).toBe("courses/folder-id");
  });

  it("allows an empty lessons array", () => {
    const data = parseCoursePackage(JSON.stringify({ lessons: [] }), "empty");
    expect(data.lessons).toEqual([]);
    expect(data.id).toBe("empty");
  });

  it("throws on invalid JSON", () => {
    expect(() => parseCoursePackage("{", "x")).toThrow(/not valid JSON/);
  });

  it("throws on a non-object root", () => {
    expect(() => parseCoursePackage("null", "x")).toThrow(/must be an object/);
    expect(() => parseCoursePackage("[]", "x")).toThrow(/must be an object/);
    expect(() => parseCoursePackage('"hi"', "x")).toThrow(/must be an object/);
    expect(() => parseCoursePackage("5", "x")).toThrow(/must be an object/);
  });

  it("throws when lessons is missing or not an array", () => {
    expect(() => parseCoursePackage("{}", "x")).toThrow(/lessons array/);
    expect(() => parseCoursePackage(JSON.stringify({ lessons: {} }), "x")).toThrow(
      /lessons array/
    );
  });
});

describe("availableCourseFromPackage", () => {
  it("maps metadata and notes", () => {
    const data: CourseData = {
      id: "my-course",
      title: "My Course",
      author: "You",
      description: "Blurb",
      lessons: [],
    };
    const course = availableCourseFromPackage(data, { "001-welcome": "# Hi" });
    expect(course.meta).toEqual({
      id: "my-course",
      title: "My Course",
      author: "You",
      description: "Blurb",
    });
    expect(course.data).toBe(data);
    expect(course.notes).toEqual({ "001-welcome": "# Hi" });
  });

  it("defaults notes to an empty map", () => {
    const data: CourseData = { id: "my-course", lessons: [] };
    expect(availableCourseFromPackage(data).notes).toEqual({});
  });
});
