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

export function courseTitle(course: AvailableCourse): string {
  return course.data.title?.trim() || "Course";
}

export function courseAuthor(course: AvailableCourse, fallback = ""): string {
  return course.data.author?.trim() || fallback;
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

export interface CourseProgress {
  total: number;
  done: number;
  totalSeconds: number;
  doneSeconds: number;
  remaining: number;
  remainingSeconds: number;
  percent: number;
}

function progressFromCounts(
  total: number,
  done: number,
  totalSeconds: number,
  doneSeconds: number
): CourseProgress {
  return {
    total,
    done,
    totalSeconds,
    doneSeconds,
    remaining: Math.max(total - done, 0),
    remainingSeconds: Math.max(totalSeconds - doneSeconds, 0),
    percent: total ? Math.round((done / total) * 100) : 0,
  };
}

export function courseProgress(
  lessons: Lesson[],
  finished: Set<string>
): CourseProgress {
  let done = 0;
  let totalSeconds = 0;
  let doneSeconds = 0;
  for (const lesson of lessons) {
    const sec = lessonDurationSeconds(lesson);
    totalSeconds += sec;
    if (finished.has(lesson.id)) {
      done += 1;
      doneSeconds += sec;
    }
  }
  return progressFromCounts(lessons.length, done, totalSeconds, doneSeconds);
}

export function combineProgress(parts: Iterable<CourseProgress>): CourseProgress {
  let total = 0;
  let done = 0;
  let totalSeconds = 0;
  let doneSeconds = 0;
  for (const part of parts) {
    total += part.total;
    done += part.done;
    totalSeconds += part.totalSeconds;
    doneSeconds += part.doneSeconds;
  }
  return progressFromCounts(total, done, totalSeconds, doneSeconds);
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
