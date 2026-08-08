import {
  lectureTypeLabel,
  lessonDurationSeconds,
} from "@/lib/assets";
import { formatDurationTotal, formatLessonTime } from "@/lib/format";
import type { Lesson } from "@/types/course";
import { isLessonFinished } from "@/store/selectors";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";
import { CompletionCheck } from "@/components/ui/completion-check";

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
      className={cn(
        "grid w-full grid-cols-[22px_1fr_auto] items-start gap-2.5 border-0 border-l-[3px] bg-transparent py-3 pr-4 pl-3.5 text-left text-text",
        active
          ? "border-l-accent bg-accent-soft"
          : "border-l-transparent hover:bg-text/4"
      )}
      data-lesson-id={lesson.id}
      onClick={() => selectLesson(lesson.id)}
    >
      <CompletionCheck
        className="mt-px"
        checked={done}
        title={done ? "Completed" : "Mark complete"}
        onClick={(e) => e.stopPropagation()}
        onCheckedChange={() => toggleFinished(lesson.id)}
      />
      <span className="min-w-0">
        <span
          className={cn(
            "block text-[13.5px] leading-snug font-medium",
            done && "text-muted"
          )}
        >
          {lesson.title}
        </span>
        <span className="mt-0.5 block text-xs text-muted-2">
          {lectureTypeLabel(lesson, notesByLessonId)}
        </span>
      </span>
      {timeLabel ? (
        <span
          className={cn(
            "mt-px whitespace-nowrap text-xs font-semibold tracking-wide tabular-nums",
            active
              ? "text-[color-mix(in_srgb,var(--accent)_70%,var(--muted-2))]"
              : "text-muted-2",
            done && "opacity-85"
          )}
          title={formatDurationTotal(seconds)}
        >
          {timeLabel}
        </span>
      ) : null}
    </button>
  );
}
