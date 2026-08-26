import type { NavigationOptions } from "./useAppStore";
import { useAppStore } from "./useAppStore";

/** Open a loaded course, or show the library. Returns whether a course was opened. */
export function openCourseOrLibrary(
  courseId: string | null | undefined,
  options?: NavigationOptions
): boolean {
  const store = useAppStore.getState();
  if (courseId && store.courses.some((c) => c.data.id === courseId)) {
    store.openCourse(courseId, options);
    return true;
  }
  store.showLibrary(options);
  return false;
}
