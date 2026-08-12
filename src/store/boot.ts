import {
  bootLocalCourses,
  type CoursesLoadState,
} from "../lib/course-loader";
import {
  getRouteFromLocation,
  replaceCourseRoute,
  replaceLibraryRoute,
} from "../lib/router";
import { useAppStore } from "./useAppStore";

let bootPromise: Promise<void> | null = null;

function applyLoadState(state: CoursesLoadState): void {
  const store = useAppStore.getState();
  const prevView = store.view;
  const prevCourseId = store.activeCourse?.data.id ?? null;
  store.applyCoursesLoadState(state);

  if (state.phase === "ready" && state.courses.length > 0) {
    const route = getRouteFromLocation();
    if (route.view === "course" && route.courseId) {
      if (state.courses.some((c) => c.data.id === route.courseId)) {
        store.openCourse(route.courseId, { skipHistory: true });
        replaceCourseRoute(route.courseId);
        return;
      }
    }

    // Keep the open course across rescan when it still exists
    if (
      prevView === "course" &&
      prevCourseId &&
      state.courses.some((c) => c.data.id === prevCourseId)
    ) {
      store.openCourse(prevCourseId, { skipHistory: true });
      replaceCourseRoute(prevCourseId);
      return;
    }

    store.showLibrary({ skipHistory: true });
    replaceLibraryRoute();
  } else {
    store.showLibrary({ skipHistory: true });
    replaceLibraryRoute();
  }
}

/** Single-flight boot — safe under React Strict Mode double-invoke. */
export function bootCourses(): Promise<void> {
  if (bootPromise) return bootPromise;
  bootPromise = (async () => {
    const store = useAppStore.getState();
    store.hydrateFromStorage();
    try {
      const state = await bootLocalCourses();
      applyLoadState(state);
    } catch (err) {
      console.error("[CourseDesk] Course load failed:", err);
      useAppStore.getState().applyCoursesLoadState({
        phase: "error",
        courses: [],
        folderName: null,
        folderStatus: {
          supported: false,
          hasHandle: false,
          folderName: null,
          permission: "none",
          canWrite: false,
        },
        error: err instanceof Error ? err.message : "Load failed",
        wroteGuide: false,
      });
    }
  })();
  return bootPromise;
}

/** Apply a load result from Settings / empty-state actions (not boot). */
export function applyCoursesResult(state: CoursesLoadState): void {
  applyLoadState(state);
}
