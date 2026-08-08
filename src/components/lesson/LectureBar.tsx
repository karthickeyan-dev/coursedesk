import { categoryTitle } from "../../lib/assets";
import { isLessonFinished } from "../../store/selectors";
import { useAppStore } from "../../store/useAppStore";

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
    <section className="lecture-bar">
      <div className="lecture-bar-inner">
        <div className="lecture-bar-text">
          <div className="section-label">
            {lesson ? categoryTitle(lesson, categories) : "Section"}
          </div>
          <h2>{lesson?.title || "Lecture title"}</h2>
        </div>
        <div className="lecture-bar-actions">
          <button
            type="button"
            className="btn btn-ghost"
            disabled={index <= 0}
            onClick={() => goToAdjacentLesson(-1)}
          >
            Previous
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={index < 0 || index >= lessons.length - 1}
            onClick={() => goToAdjacentLesson(1)}
          >
            Next
          </button>
          <button
            type="button"
            className={`btn btn-complete${done ? " is-done" : ""}`}
            disabled={!activeLessonId}
            onClick={markActiveComplete}
          >
            <span className="check-ico" aria-hidden="true" />
            <span className="done-label">
              {done ? "Completed" : "Mark as complete"}
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}
