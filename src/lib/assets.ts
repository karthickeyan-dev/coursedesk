import type { AvailableCourse, CourseNotesMap, Lesson } from "../types/course";
import { hasNotes } from "./notes";

export function courseRoot(course: AvailableCourse): string {
  const explicit = course.data?.root;
  if (explicit) return String(explicit).replace(/\/+$/, "");
  return `courses/${course.data.id}`;
}

export function resolveCourseAsset(
  course: AvailableCourse | null,
  assetPath: string | undefined | null
): string | null {
  if (!course || !assetPath) return null;
  const raw = String(assetPath).trim();
  if (!raw) return null;
  if (/^(https?:|data:|blob:|file:)/i.test(raw)) return raw;
  if (raw.startsWith("courses/")) return raw.replace(/^\.\//, "");
  const root = courseRoot(course);
  const rel = raw.replace(/^\.\//, "").replace(/^\/+/, "");
  return `${root}/${rel}`;
}

export function lessonDurationSeconds(lesson: Lesson | null | undefined): number {
  if (!lesson) return 0;
  const raw = lesson.duration;
  if (typeof raw === "number" && isFinite(raw) && raw > 0) return raw;
  if (typeof raw === "string" && raw.trim() && isFinite(Number(raw))) {
    const n = Number(raw);
    return n > 0 ? n : 0;
  }
  return 0;
}

export function sumLessonDurations(lessonList: Lesson[]): number {
  return lessonList.reduce((sum, lesson) => sum + lessonDurationSeconds(lesson), 0);
}

export function lectureTypeLabel(
  lesson: Lesson,
  notesByLessonId: CourseNotesMap
): string {
  const hasVideo = Boolean(lesson.video);
  const hasNote = hasNotes(notesByLessonId[lesson.id]);
  if (hasVideo && hasNote) return "Lecture";
  if (hasVideo) return "Video";
  if (hasNote) return "Article";
  return "Lesson";
}

export function categoryTitle(
  lesson: Lesson,
  categories: { id: string; title: string }[]
): string {
  if (lesson.category) return lesson.category;
  const cat = categories.find((c) => c.id === lesson.categoryId);
  return cat ? cat.title : "";
}

export function buildAvailableCourses(): AvailableCourse[] {
  const registry = window.COURSES || {};
  const notesRegistry = window.COURSE_NOTES || {};
  const result: AvailableCourse[] = [];

  for (const id of Object.keys(registry).sort()) {
    const data = registry[id];
    if (!data || !Array.isArray(data.lessons)) continue;
    const courseId = data.id || id;
    result.push({
      meta: {
        id: courseId,
        title: data.title,
        author: data.author,
        description: data.description,
      },
      data,
      notes: notesRegistry[courseId] || notesRegistry[id] || {},
    });
  }

  return result;
}
