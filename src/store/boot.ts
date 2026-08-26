import {
  bootLocalCourses,
  type CoursesLoadState,
} from "../lib/course-loader";
import {
  getRouteFromLocation,
  replaceCourseRoute,
  replaceLibraryRoute,
} from "../lib/router";
import { openCourseOrLibrary } from "./navigation";
import { useAppStore } from "./useAppStore";

let bootPromise: Promise<void> | null = null;

function applyLoadState(state: CoursesLoadState): void {
  const store = useAppStore.getState();
  const prevView = store.view;
  const prevCourseId = store.activeCourse?.data.id ?? null;
  store.applyCoursesLoadState(state);

  const nav = { skipHistory: true as const };

  if (state.phase === "ready" && state.courses.length > 0) {
    const route = getRouteFromLocation();
    if (route.view === "course" && route.courseId) {
      if (openCourseOrLibrary(route.courseId, nav)) {
        replaceCourseRoute(route.courseId);
        return;
      }
    }

    if (prevView === "course" && prevCourseId) {
      if (openCourseOrLibrary(prevCourseId, nav)) {
        replaceCourseRoute(prevCourseId);
        return;
      }
    }
  }

  openCourseOrLibrary(null, nav);
  replaceLibraryRoute();
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

export async function runFolderAction(
  fn: () => Promise<CoursesLoadState>
): Promise<CoursesLoadState> {
  const state = await fn();
  applyCoursesResult(state);
  return state;
}
