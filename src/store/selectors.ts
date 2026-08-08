import * as Storage from "../lib/storage";
import {
  lessonDurationSeconds,
  sumLessonDurations,
} from "../lib/assets";
import { formatDurationTotal } from "../lib/format";
import type { AppStore } from "./useAppStore";

export interface ProgressStats {
  total: number;
  done: number;
  totalSeconds: number;
  doneSeconds: number;
  remaining: number;
  remainingSeconds: number;
  percent: number;
  overall: boolean;
}

export function selectProgressStats(s: AppStore): ProgressStats {
  if (s.view === "course" && s.activeCourse) {
    const lessons = s.lessons;
    const finished = new Set(s.completedLessonIds);
    const doneLessons = lessons.filter((l) => finished.has(l.id));
    const total = lessons.length;
    const done = doneLessons.length;
    const totalSeconds = sumLessonDurations(lessons);
    const doneSeconds = sumLessonDurations(doneLessons);
    return {
      total,
      done,
      totalSeconds,
      doneSeconds,
      remaining: Math.max(total - done, 0),
      remainingSeconds: Math.max(totalSeconds - doneSeconds, 0),
      percent: total ? Math.round((done / total) * 100) : 0,
      overall: false,
    };
  }

  let total = 0;
  let done = 0;
  let totalSeconds = 0;
  let doneSeconds = 0;
  for (const course of s.courses) {
    const finished = Storage.loadFinishedIds(course.data.id);
    for (const lesson of course.data.lessons || []) {
      total += 1;
      const sec = lessonDurationSeconds(lesson);
      totalSeconds += sec;
      if (finished.has(lesson.id)) {
        done += 1;
        doneSeconds += sec;
      }
    }
  }
  return {
    total,
    done,
    totalSeconds,
    doneSeconds,
    remaining: Math.max(total - done, 0),
    remainingSeconds: Math.max(totalSeconds - doneSeconds, 0),
    percent: total ? Math.round((done / total) * 100) : 0,
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
