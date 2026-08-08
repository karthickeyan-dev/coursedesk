import { buildAvailableCourses } from "../lib/assets";
import { loadCourses } from "../lib/course-loader";
import * as Storage from "../lib/storage";
import { useAppStore } from "./useAppStore";

let bootPromise: Promise<void> | null = null;

/** Single-flight boot — safe under React Strict Mode double-invoke. */
export function bootCourses(): Promise<void> {
  if (bootPromise) return bootPromise;
  bootPromise = (async () => {
    const store = useAppStore.getState();
    store.hydrateFromStorage();
    try {
      await loadCourses();
      const available = buildAvailableCourses();
      store.setCourses(available);
      Storage.pruneCourses(available.map((c) => c.data.id));

      const last = Storage.loadActiveCourseId();
      if (last && available.some((c) => c.data.id === last)) {
        store.openCourse(last);
      } else {
        store.showLibrary();
      }
    } catch (err) {
      console.error("[CourseDesk] Course load failed:", err);
      useAppStore.setState({
        coursesLoaded: true,
        coursesError: err instanceof Error ? err.message : "Load failed",
      });
    }
  })();
  return bootPromise;
}
