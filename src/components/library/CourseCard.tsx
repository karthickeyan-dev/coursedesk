import { sumLessonDurations } from "../../lib/assets";
import { courseMonogram, formatDurationTotal } from "../../lib/format";
import * as Storage from "../../lib/storage";
import type { AvailableCourse } from "../../types/course";
import { useAppStore } from "../../store/useAppStore";

function cardProgress(course: AvailableCourse) {
  const lessons = course.data.lessons || [];
  const finished = Storage.loadFinishedIds(course.data.id);
  const done = lessons.reduce((n, l) => n + (finished.has(l.id) ? 1 : 0), 0);
  const total = lessons.length;
  const percent = total ? Math.round((done / total) * 100) : 0;
  const seconds = sumLessonDurations(lessons);
  const duration = seconds > 0 ? formatDurationTotal(seconds) : "";
  const progressLabel =
    percent === 0
      ? "Not started"
      : percent === 100
        ? "Completed"
        : `${done} / ${total} · ${percent}%`;
  return { total, percent, duration, progressLabel };
}

/** Stable, well-spread hue (0–359) from course id so each card gets a distinct color. */
function cardHue(id: string, index: number): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  // Golden-angle step (~137.5°) + index so neighbors diverge even for similar ids
  return Math.round((hash * 137.508 + index * 47) % 360);
}

export function CourseCard({
  course,
  index,
}: {
  course: AvailableCourse;
  index: number;
}) {
  const openCourse = useAppStore((s) => s.openCourse);
  const title = course.data.title || course.meta.title || "Course";
  const author = course.data.author || course.meta.author || "Course";
  const { total, percent, duration, progressLabel } = cardProgress(course);
  const hue = cardHue(course.data.id, index);

  const metaParts = [`${total} lesson${total === 1 ? "" : "s"}`];
  if (duration) metaParts.push(duration);

  return (
    <button
      type="button"
      className="group flex w-full cursor-pointer flex-col overflow-hidden rounded-xl border-0 bg-transparent p-0 text-left font-inherit text-inherit transition-transform duration-150 hover:-translate-y-0.5 focus-visible:rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
      role="listitem"
      aria-label={`${title} by ${author}. ${progressLabel}.`}
      onClick={() => openCourse(course.data.id)}
    >
      <div
        className="course-media relative grid aspect-video place-items-center overflow-hidden rounded-xl border border-border/70 shadow-card transition-[box-shadow,border-color] duration-150 group-hover:border-accent/45 group-hover:shadow-pop"
        style={{ ["--card-hue" as string]: String(hue) }}
        aria-hidden="true"
      >
        <span className="relative z-1 text-[clamp(2rem,4vw,2.6rem)] leading-none font-extrabold tracking-tight text-white [text-shadow:0_2px_16px_rgba(0,0,0,0.35)]">
          {courseMonogram(title)}
        </span>
        <span className="absolute top-2.5 right-2.5 z-2 rounded-full bg-black/55 px-2 py-1 text-[0.72rem] font-bold tracking-wide text-white tabular-nums backdrop-blur-sm">
          {percent > 0 ? `${percent}%` : "New"}
        </span>
        <div className="absolute right-0 bottom-0 left-0 z-2 h-1 bg-white/18">
          <div
            className="h-full bg-linear-to-r from-accent to-[color-mix(in_srgb,var(--ok)_65%,var(--accent))] transition-[width] duration-250"
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-transparent from-55% to-black/45" />
      </div>
      <div className="flex min-w-0 flex-col gap-1 px-1 pt-3 pb-0.5">
        <h3 className="m-0 line-clamp-2 text-[0.98rem] leading-snug font-bold tracking-tight max-sm:text-[0.9rem]">
          {title}
        </h3>
        <p className="m-0 truncate text-[0.78rem] font-semibold text-muted">
          {author}
        </p>
        <p className="m-0 text-[0.74rem] font-medium text-muted-2 tabular-nums">
          {metaParts.join(" · ")}
        </p>
        <p className="mt-0.5 mb-0 text-[0.74rem] font-semibold text-accent tabular-nums">
          {progressLabel}
        </p>
      </div>
    </button>
  );
}
