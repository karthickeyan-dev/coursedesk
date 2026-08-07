import type { AvailableCourse } from "../types/course";

/** Loaded packages shared by library + progress (keeps UI modules decoupled). */
let courses: AvailableCourse[] = [];

export function setAvailableCourses(next: AvailableCourse[]): void {
  courses = next;
}

export function getAvailableCourses(): AvailableCourse[] {
  return courses;
}
