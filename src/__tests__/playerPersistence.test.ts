import { afterEach, beforeEach, describe, expect, it } from "vitest";
import * as Storage from "../lib/storage";

const KEYS = ["coursedesk.theme", "coursedesk.sidebar", "coursedesk.activeCourse", "coursedesk.courses"];

function clearStorage(): void {
  for (const k of KEYS) localStorage.removeItem(k);
  Storage.resetStorageCache();
}

describe("lesson position persistence on switch", () => {
  beforeEach(() => {
    clearStorage();
  });

  afterEach(() => {
    clearStorage();
  });

  it("does not overwrite new lesson position with previous lesson position when switching", () => {
    // Simulate active loaded refs
    const loadedCourseId: string | null = "course-1";
    let loadedLessonId: string | null = "lesson-1";

    const onTimePersist = (seconds: number) => {
      if (!loadedCourseId || !loadedLessonId) return;
      Storage.saveLessonTime(loadedCourseId, loadedLessonId, seconds);
    };

    // User is watching lesson-1 at 300s
    onTimePersist(300);
    expect(Storage.loadLessonTime("course-1", "lesson-1")).toBe(300);
    expect(Storage.loadLessonTime("course-1", "lesson-2")).toBe(0);

    // User switches store state to lesson-2
    const nextLessonId = "lesson-2";

    // Before loading lesson-2, transition persists current video time (300s) using loadedLessonId (lesson-1)
    if (loadedLessonId && loadedLessonId !== nextLessonId) {
      onTimePersist(300);
    }

    // Now update loaded refs to lesson-2
    loadedLessonId = nextLessonId;

    // Load time for new lesson (lesson-2)
    const startTimeForLesson2 = Storage.loadLessonTime("course-1", loadedLessonId);
    expect(startTimeForLesson2).toBe(0); // Must be 0, not 300!
    expect(Storage.loadLessonTime("course-1", "lesson-1")).toBe(300);
  });
});
