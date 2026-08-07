/// <reference types="vite/client" />

import type { CourseData, CourseNotesMap } from "./types/course";

declare global {
  interface Window {
    COURSES?: Record<string, CourseData>;
    COURSE_NOTES?: Record<string, CourseNotesMap>;
  }
}

export {};
