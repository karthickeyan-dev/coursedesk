import { afterEach, beforeEach, describe, expect, it } from "vitest";
import * as Storage from "../lib/storage";

const KEYS = [
  "coursedesk.theme",
  "coursedesk.sidebar",
  "coursedesk.activeCourse",
  "coursedesk.courses",
  "coursedesk.autoplay",
];

function clearStorage(): void {
  for (const k of KEYS) localStorage.removeItem(k);
  Storage.resetStorageCache();
}

describe("storage", () => {
  beforeEach(() => {
    clearStorage();
  });

  afterEach(() => {
    clearStorage();
  });

  it("defaults theme to dark", () => {
    expect(Storage.loadTheme()).toBe("dark");
  });

  it("persists theme", () => {
    Storage.saveTheme("light");
    expect(Storage.loadTheme()).toBe("light");
    Storage.saveTheme("dark");
    expect(Storage.loadTheme()).toBe("dark");
  });

  it("persists curriculum open flag", () => {
    expect(Storage.loadCurriculumOpen(true)).toBe(true);
    Storage.saveCurriculumOpen(false);
    expect(Storage.loadCurriculumOpen(true)).toBe(false);
    Storage.saveCurriculumOpen(true);
    expect(Storage.loadCurriculumOpen(false)).toBe(true);
  });

  it("persists autoplay preference", () => {
    expect(Storage.loadAutoplay(false)).toBe(false);
    expect(Storage.loadAutoplay(true)).toBe(true);
    Storage.saveAutoplay(true);
    expect(Storage.loadAutoplay(false)).toBe(true);
    Storage.saveAutoplay(false);
    expect(Storage.loadAutoplay(true)).toBe(false);
  });

  it("saves and loads finished lesson ids", () => {
    Storage.saveFinishedIds("course-a", new Set(["l1", "l2"]));
    const ids = Storage.loadFinishedIds("course-a");
    expect(ids.has("l1")).toBe(true);
    expect(ids.has("l2")).toBe(true);
    expect(ids.size).toBe(2);
  });

  it("strips playback positions under 3 seconds", () => {
    Storage.saveLessonTime("course-a", "lesson-1", 10);
    expect(Storage.loadLessonTime("course-a", "lesson-1")).toBe(10);
    Storage.saveLessonTime("course-a", "lesson-1", 2);
    expect(Storage.loadLessonTime("course-a", "lesson-1")).toBe(0);
  });

  it("floors playback seconds", () => {
    Storage.saveLessonTime("course-a", "lesson-2", 12.9);
    expect(Storage.loadLessonTime("course-a", "lesson-2")).toBe(12);
  });

  it("prunes missing courses and clears invalid active", () => {
    Storage.saveActiveCourseId("gone");
    Storage.saveFinishedIds("gone", new Set(["x"]));
    Storage.saveFinishedIds("keep", new Set(["y"]));
    Storage.pruneCourses(["keep"]);
    expect(Storage.loadActiveCourseId()).toBeNull();
    expect(Storage.loadFinishedIds("gone").size).toBe(0);
    expect(Storage.loadFinishedIds("keep").has("y")).toBe(true);
  });
});
