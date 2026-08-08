import { useEffect } from "react";
import { useAppStore } from "../../store/useAppStore";
import { VideoPlayer } from "../player/VideoPlayer";
import { LectureBar } from "./LectureBar";
import { NotesPanel } from "./NotesPanel";

export function LessonView() {
  const activeLessonId = useAppStore((s) => s.activeLessonId);
  const lessonsById = useAppStore((s) => s.lessonsById);
  const notesByLessonId = useAppStore((s) => s.notesByLessonId);

  const lesson = activeLessonId ? lessonsById[activeLessonId] : null;
  const notes = lesson ? notesByLessonId[lesson.id] : null;

  useEffect(() => {
    const main = document.querySelector(".main");
    if (main) main.scrollTop = 0;
  }, [activeLessonId]);

  if (!lesson) {
    return (
      <div className="lesson-view">
        <div className="no-video">
          <strong>No lectures in this course</strong>
          <span>Add lessons to the course package to get started.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="lesson-view">
      <VideoPlayer />
      {!lesson.video && (
        <div className="no-video">
          <strong>No video for this lecture</strong>
          <span>Notes are still available below.</span>
        </div>
      )}
      <LectureBar />
      <NotesPanel markdown={notes} />
    </div>
  );
}
