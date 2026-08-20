import { afterEach, beforeEach, describe, expect, it } from "vitest";
import * as Storage from "../lib/storage";
import { nextLessonId } from "../store/selectors";
import { useAppStore } from "../store/useAppStore";
import type { AvailableCourse } from "../types/course";

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

const course: AvailableCourse = {
  meta: { id: "c1", title: "Course" },
  data: {
    id: "c1",
    title: "Course",
    lessons: [
      { id: "l1", title: "One", categoryId: "s1", video: "a.mp4" },
      { id: "l2", title: "Two", categoryId: "s1", video: "b.mp4" },
      { id: "l3", title: "Three", categoryId: "s2", video: "c.mp4" },
    ],
  },
  notes: {},
};

describe("nextLessonId", () => {
  const lessons = course.data.lessons;

  it("returns the following lecture", () => {
    expect(nextLessonId(lessons, "l1")).toBe("l2");
    expect(nextLessonId(lessons, "l2")).toBe("l3");
  });

  it("returns null at the end or when unknown", () => {
    expect(nextLessonId(lessons, "l3")).toBeNull();
    expect(nextLessonId(lessons, "missing")).toBeNull();
    expect(nextLessonId(lessons, null)).toBeNull();
  });
});

describe("onActiveLessonEnded", () => {
  beforeEach(() => {
    clearStorage();
    useAppStore.setState({
      courses: [course],
      autoplay: false,
      pendingAutoplayLessonId: null,
    });
    useAppStore.getState().openCourse("c1");
  });

  afterEach(() => {
    clearStorage();
    useAppStore.getState().showLibrary({ skipHistory: true });
  });

  it("marks the current lecture finished when the video ends", () => {
    expect(useAppStore.getState().activeLessonId).toBe("l1");
    useAppStore.getState().onActiveLessonEnded();
    expect(useAppStore.getState().completedLessonIds).toContain("l1");
    expect(useAppStore.getState().activeLessonId).toBe("l1");
    expect(useAppStore.getState().pendingAutoplayLessonId).toBeNull();
  });

  it("does not un-complete an already finished lecture", () => {
    useAppStore.getState().markLessonFinished("l1");
    useAppStore.getState().onActiveLessonEnded();
    expect(useAppStore.getState().completedLessonIds.filter((id) => id === "l1")).toHaveLength(
      1
    );
  });

  it("advances and queues autoplay when autoplay is on", () => {
    useAppStore.getState().setAutoplay(true);
    useAppStore.getState().onActiveLessonEnded();
    expect(useAppStore.getState().completedLessonIds).toContain("l1");
    expect(useAppStore.getState().activeLessonId).toBe("l2");
    expect(useAppStore.getState().pendingAutoplayLessonId).toBe("l2");
  });

  it("does not advance past the last lecture", () => {
    useAppStore.getState().setAutoplay(true);
    useAppStore.getState().selectLesson("l3");
    useAppStore.getState().onActiveLessonEnded();
    expect(useAppStore.getState().completedLessonIds).toContain("l3");
    expect(useAppStore.getState().activeLessonId).toBe("l3");
    expect(useAppStore.getState().pendingAutoplayLessonId).toBeNull();
  });

  it("clears a queued autoplay when the user picks a different lecture", () => {
    useAppStore.getState().setAutoplay(true);
    useAppStore.getState().onActiveLessonEnded();
    expect(useAppStore.getState().pendingAutoplayLessonId).toBe("l2");
    useAppStore.getState().selectLesson("l3");
    expect(useAppStore.getState().pendingAutoplayLessonId).toBeNull();
    expect(useAppStore.getState().activeLessonId).toBe("l3");
  });

  it("continues into the next section across the course", () => {
    useAppStore.getState().setAutoplay(true);
    useAppStore.getState().selectLesson("l2");
    useAppStore.getState().onActiveLessonEnded();
    expect(useAppStore.getState().completedLessonIds).toContain("l2");
    expect(useAppStore.getState().activeLessonId).toBe("l3");
    expect(useAppStore.getState().pendingAutoplayLessonId).toBe("l3");
  });
});
