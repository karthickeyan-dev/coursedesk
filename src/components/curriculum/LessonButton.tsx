import { Check } from "lucide-react";
import { formatDurationTotal, formatLessonTime } from "../../lib/format";
import {
  lectureTypeLabel,
  lessonDurationSeconds,
} from "../../lib/assets";
import type { Lesson } from "../../types/course";
import { isLessonFinished } from "../../store/selectors";
import { useAppStore } from "../../store/useAppStore";

export function LessonButton({ lesson }: { lesson: Lesson }) {
  const activeLessonId = useAppStore((s) => s.activeLessonId);
  const completedLessonIds = useAppStore((s) => s.completedLessonIds);
  const notesByLessonId = useAppStore((s) => s.notesByLessonId);
  const selectLesson = useAppStore((s) => s.selectLesson);
  const toggleFinished = useAppStore((s) => s.toggleFinished);

  const active = lesson.id === activeLessonId;
  const done = isLessonFinished(completedLessonIds, lesson.id);
  const seconds = lessonDurationSeconds(lesson);
  const timeLabel = formatLessonTime(seconds);

  return (
    <button
      type="button"
      className={`lesson-btn${active ? " active" : ""}${done ? " done" : ""}`}
      data-id={lesson.id}
      onClick={() => selectLesson(lesson.id)}
    >
      <span
        className="check"
        title={done ? "Completed" : "Mark complete"}
        onClick={(e) => {
          e.stopPropagation();
          toggleFinished(lesson.id);
        }}
      >
        <Check size={10} />
      </span>
      <span className="title-wrap">
        <span className="title">{lesson.title}</span>
        <span className="lesson-meta">
          {lectureTypeLabel(lesson, notesByLessonId)}
        </span>
      </span>
      {timeLabel ? (
        <span
          className="lesson-duration"
          title={formatDurationTotal(seconds)}
        >
          {timeLabel}
        </span>
      ) : null}
    </button>
  );
}
