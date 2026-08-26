import type { AvailableCourse, CourseNotesMap, Lesson } from "../types/course";
import { hasNotes } from "./notes";
import { resolveLocalAssetUrl } from "./local-courses";

/** Resolve video / file paths to a playable or viewable URL (blob: for local files). */
export async function resolveCourseAssetUrl(
  course: AvailableCourse | null,
  assetPath: string | undefined | null
): Promise<string | null> {
  if (!course || !assetPath) return null;
  const raw = String(assetPath).trim();
  if (!raw) return null;
  if (/^(https?:|data:|blob:)/i.test(raw)) return raw;
  return resolveLocalAssetUrl(course.data.id, raw);
}

export function lessonDurationSeconds(lesson: Lesson | null | undefined): number {
  if (!lesson) return 0;
  const raw = lesson.duration;
  if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) return raw;
  if (typeof raw === "string" && raw.trim() && Number.isFinite(Number(raw))) {
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
