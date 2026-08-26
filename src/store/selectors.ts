import * as Storage from "../lib/storage";
import {
  combineProgress,
  courseProgress,
  type CourseProgress,
} from "../lib/assets";
import { formatDurationTotal } from "../lib/format";
import type { AppStore } from "./useAppStore";

export interface ProgressStats extends CourseProgress {
  overall: boolean;
}

export function selectProgressStats(s: AppStore): ProgressStats {
  if (s.view === "course" && s.activeCourse) {
    return {
      ...courseProgress(s.lessons, new Set(s.completedLessonIds)),
      overall: false,
    };
  }

  return {
    ...combineProgress(
      s.courses.map((course) =>
        courseProgress(course.data.lessons || [], Storage.loadFinishedIds(course.data.id))
      )
    ),
    overall: true,
  };
}

export function progressAriaLabel(stats: ProgressStats): string {
  const fmt = formatDurationTotal;
  const { percent, total, done, remaining, totalSeconds, doneSeconds, remainingSeconds, overall } =
    stats;
  return `${overall ? "Overall " : ""}${percent}% complete. ${done} of ${total} lectures completed, ${remaining} remaining. ${fmt(doneSeconds)} of ${fmt(totalSeconds)} watched, ${fmt(remainingSeconds)} remaining.`;
}

export function isLessonFinished(
  completedLessonIds: string[],
  lessonId: string
): boolean {
  return completedLessonIds.includes(lessonId);
}

/** Immediate next lecture in curriculum order, or null at the end. */
export function nextLessonId(
  lessons: { id: string }[],
  activeLessonId: string | null
): string | null {
  if (!activeLessonId) return null;
  const i = lessons.findIndex((l) => l.id === activeLessonId);
  if (i < 0) return null;
  return lessons[i + 1]?.id ?? null;
}
