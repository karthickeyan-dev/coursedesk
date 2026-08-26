import { CurriculumSidebar } from "@/components/curriculum/CurriculumSidebar";
import { useAppChrome } from "@/components/layout/useAppChrome";
import { Topbar } from "@/components/layout/Topbar";
import { CourseLibrary } from "@/components/library/CourseLibrary";
import { LessonView } from "@/components/lesson/LessonView";
import { useAppStore } from "@/store/useAppStore";

export function App() {
  useAppChrome();

  const view = useAppStore((s) => s.view);
  const curriculumOpen = useAppStore((s) => s.curriculumOpen);
  const coursesLoaded = useAppStore((s) => s.coursesLoaded);
  const libraryMode = view === "library";

  return (
    <div className="flex h-screen min-h-0 flex-col">
      <Topbar />
      <div
        className={
          libraryMode
            ? "grid min-h-0 flex-1 grid-cols-1"
            : [
                "relative grid min-h-0 flex-1 grid-cols-1",
                curriculumOpen
                  ? "max-[979px]:grid-cols-1 min-[980px]:grid-cols-[1fr_var(--spacing-sidebar)]"
                  : "min-[980px]:grid-cols-[1fr_0fr]",
              ].join(" ")
        }
      >
        <main className="min-h-0 min-w-0 overflow-auto bg-bg [scrollbar-gutter:stable]">
          {libraryMode ? <CourseLibrary /> : coursesLoaded ? <LessonView /> : null}
        </main>
        {!libraryMode && <CurriculumSidebar />}
      </div>
    </div>
  );
}
