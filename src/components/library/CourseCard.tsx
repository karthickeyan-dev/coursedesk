import * as Storage from "../../lib/storage";
import { courseMonogram, formatDurationTotal } from "../../lib/format";
import { sumLessonDurations } from "../../lib/assets";
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

  const metaParts = [`${total} lesson${total === 1 ? "" : "s"}`];
  if (duration) metaParts.push(duration);

  return (
    <button
      type="button"
      className="course-thumb"
      role="listitem"
      aria-label={`${title} by ${author}. ${progressLabel}.`}
      style={{ ["--card-hue" as string]: String((index * 47 + 268) % 360) }}
      onClick={() => openCourse(course.data.id)}
    >
      <div className="course-thumb-media" aria-hidden="true">
        <span className="course-thumb-mono">{courseMonogram(title)}</span>
        <span className="course-thumb-badge">
          {percent > 0 ? `${percent}%` : "New"}
        </span>
        <div className="course-thumb-progress-track">
          <div
            className="course-thumb-progress-fill"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
      <div className="course-thumb-body">
        <h3 className="course-thumb-title">{title}</h3>
        <p className="course-thumb-author">{author}</p>
        <p className="course-thumb-meta">{metaParts.join(" · ")}</p>
        <p className="course-thumb-progress-label">{progressLabel}</p>
      </div>
    </button>
  );
}
