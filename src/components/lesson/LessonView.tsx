import { useEffect } from "react";
import { hasNotes } from "@/lib/notes";
import { useAppStore } from "@/store/useAppStore";
import { VideoPlayer } from "@/components/player/VideoPlayer";
import { LectureBar } from "./LectureBar";
import { NotesPanel } from "./NotesPanel";

export function LessonView() {
  const activeLessonId = useAppStore((s) => s.activeLessonId);
  const lessonsById = useAppStore((s) => s.lessonsById);
  const notesByLessonId = useAppStore((s) => s.notesByLessonId);

  const lesson = activeLessonId ? lessonsById[activeLessonId] : null;
  const notes = lesson ? notesByLessonId[lesson.id] : null;
  const hasVideo = Boolean(lesson?.video);
  const notesExist = hasNotes(notes);

  useEffect(() => {
    if (!activeLessonId) return;
    const main = document.querySelector("main");
    if (main) main.scrollTop = 0;
  }, [activeLessonId]);

  if (!lesson) {
    return (
      <div>
        <div className="grid place-items-center gap-1.5 p-6 text-center text-muted">
          <strong className="text-base text-foreground">
            No lectures in this course
          </strong>
          <span>Add lessons to the course package to get started.</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      {hasVideo ? <VideoPlayer /> : null}
      <LectureBar />
      {notesExist ? <NotesPanel markdown={notes} /> : null}
      {!hasVideo && !notesExist ? (
        <div className="grid place-items-center gap-1.5 border-b border-border bg-elevated p-10 text-center text-muted">
          <strong className="text-base text-foreground">
            No video or notes for this lecture
          </strong>
          <span>Add a video path or notes to this lesson package.</span>
        </div>
      ) : null}
    </div>
  );
}
