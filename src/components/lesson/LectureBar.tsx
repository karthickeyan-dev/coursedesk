import { categoryTitle } from "../../lib/assets";
import { isLessonFinished } from "../../store/selectors";
import { useAppStore } from "../../store/useAppStore";

const btn =
  "inline-flex items-center justify-center gap-2 rounded-sm border border-border px-4 py-2.5 text-[13px] font-bold leading-tight transition-colors disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export function LectureBar() {
  const activeLessonId = useAppStore((s) => s.activeLessonId);
  const lessons = useAppStore((s) => s.lessons);
  const lessonsById = useAppStore((s) => s.lessonsById);
  const categories = useAppStore((s) => s.categories);
  const completedLessonIds = useAppStore((s) => s.completedLessonIds);
  const goToAdjacentLesson = useAppStore((s) => s.goToAdjacentLesson);
  const markActiveComplete = useAppStore((s) => s.markActiveComplete);

  const lesson = activeLessonId ? lessonsById[activeLessonId] : null;
  const index = activeLessonId
    ? lessons.findIndex((l) => l.id === activeLessonId)
    : -1;
  const done = activeLessonId
    ? isLessonFinished(completedLessonIds, activeLessonId)
    : false;

  return (
    <section className="w-full border-b border-border bg-elevated px-6 py-[18px]">
      <div className="m-0 flex w-full items-start justify-between gap-4 max-[979px]:flex-col">
        <div>
          <div className="mb-1 text-xs font-bold tracking-[0.04em] text-muted-2 uppercase">
            {lesson ? categoryTitle(lesson, categories) : "Section"}
          </div>
          <h2 className="m-0 text-[1.15rem] leading-snug font-bold tracking-tight">
            {lesson?.title || "Lecture title"}
          </h2>
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-2 max-[979px]:w-full">
          <button
            type="button"
            className={`${btn} border-border bg-transparent text-text hover:bg-text/6`}
            disabled={index <= 0}
            onClick={() => goToAdjacentLesson(-1)}
          >
            Previous
          </button>
          <button
            type="button"
            className={`${btn} border-border bg-transparent text-text hover:bg-text/6`}
            disabled={index < 0 || index >= lessons.length - 1}
            onClick={() => goToAdjacentLesson(1)}
          >
            Next
          </button>
          <button
            type="button"
            className={[
              btn,
              "btn-complete min-w-40 justify-center max-[560px]:flex-1",
              done
                ? "is-done border-ok bg-ok-soft text-ok"
                : "border-text bg-transparent text-text",
            ].join(" ")}
            disabled={!activeLessonId}
            onClick={markActiveComplete}
          >
            <span className="check-ico" aria-hidden="true" />
            <span>{done ? "Completed" : "Mark as complete"}</span>
          </button>
        </div>
      </div>
    </section>
  );
}
