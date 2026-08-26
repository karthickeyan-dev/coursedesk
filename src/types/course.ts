/** Lesson within a course package (`<id>/course.json`). */
export interface Lesson {
  id: string;
  title: string;
  categoryId: string;
  category?: string;
  num?: string;
  video?: string;
  duration?: number | string;
}

export interface Category {
  id: string;
  title: string;
}

/** Downloadable resource for the Files sidebar tab. */
export interface CourseResource {
  id: string;
  title: string;
  path: string;
  description?: string;
  group?: string;
}

/** Curriculum + metadata from course.json. */
export interface CourseData {
  id: string;
  root?: string;
  title?: string;
  author?: string;
  description?: string;
  categories?: Category[];
  lessons: Lesson[];
  resources?: CourseResource[];
}

/** Markdown notes keyed by lesson id. */
export type CourseNotesMap = Record<string, string>;

/** Fully loaded package used by the player. */
export interface AvailableCourse {
  data: CourseData;
  notes: CourseNotesMap;
}
