import { useEffect } from "react";
import { hasNotes } from "@/lib/notes";
import { useAppStore } from "@/store/useAppStore";
import { VideoPlayer } from "@/components/player/VideoPlayer";
import { FileX2 } from "lucide-react";
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
  const contentUnavailable = !hasVideo && !notesExist;

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

  if (contentUnavailable) {
    return (
      <div className="grid min-h-full place-items-center p-6 text-center">
        <div>
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-accent-soft text-accent">
            <FileX2 size={24} strokeWidth={1.5} />
          </div>
          <strong className="text-base text-foreground">
            No video or notes available
          </strong>
          <p className="mt-1 text-sm text-muted">
            Add a video path or notes to this lesson package.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {hasVideo ? <VideoPlayer /> : null}
      <LectureBar />
      {notesExist ? <NotesPanel markdown={notes} /> : null}
    </div>
  );
}
