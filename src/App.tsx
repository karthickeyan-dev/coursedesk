import { useEffect } from "react";
import { CurriculumSidebar } from "./components/curriculum/CurriculumSidebar";
import { Topbar } from "./components/layout/Topbar";
import { CourseLibrary } from "./components/library/CourseLibrary";
import { LessonView } from "./components/lesson/LessonView";
import { isEditableTarget } from "./components/player/useVideoPlayer";
import { useHasActiveVideo } from "./components/player/VideoPlayer";
import { getRouteFromLocation, replaceLibraryRoute } from "./lib/router";
import { useAppStore } from "./store/useAppStore";

export function App() {
  const view = useAppStore((s) => s.view);
  const curriculumOpen = useAppStore((s) => s.curriculumOpen);
  const activeCourse = useAppStore((s) => s.activeCourse);
  const coursesLoaded = useAppStore((s) => s.coursesLoaded);
  const goToAdjacentLesson = useAppStore((s) => s.goToAdjacentLesson);
  const markActiveComplete = useAppStore((s) => s.markActiveComplete);
  const setCurriculumOpen = useAppStore((s) => s.setCurriculumOpen);
  const activeLessonId = useAppStore((s) => s.activeLessonId);
  const hasActiveVideo = useHasActiveVideo();

  useEffect(() => {
    const onPopState = () => {
      const route = getRouteFromLocation();
      const store = useAppStore.getState();
      if (!store.coursesLoaded) return;

      if (route.view === "course" && route.courseId) {
        const courseExists = store.courses.some(
          (c) => c.data.id === route.courseId
        );
        if (courseExists) {
          if (
            store.view !== "course" ||
            store.activeCourse?.data.id !== route.courseId
          ) {
            store.openCourse(route.courseId, { skipHistory: true });
          }
        } else {
          store.showLibrary({ skipHistory: true });
          replaceLibraryRoute();
        }
      } else {
        if (store.view !== "library") {
          store.showLibrary({ skipHistory: true });
        }
      }
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (view === "library" || !activeCourse) {
      document.title = "CourseDesk";
      return;
    }
    const title = activeCourse.data.title || activeCourse.meta.title || "Course";
    const author = activeCourse.data.author || activeCourse.meta.author || "";
    document.title = author ? `${title} · ${author}` : title;
  }, [view, activeCourse]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (isEditableTarget(event.target)) return;

      // Ctrl/Cmd+B — toggle curriculum sidebar (course view only)
      if (
        (event.key === "b" || event.key === "B") &&
        (event.ctrlKey || event.metaKey) &&
        !event.altKey &&
        !event.shiftKey
      ) {
        if (view === "course" && activeCourse) {
          event.preventDefault();
          setCurriculumOpen(!curriculumOpen);
        }
        return;
      }

      switch (event.key) {
        case "[":
          event.preventDefault();
          goToAdjacentLesson(-1);
          break;
        case "]":
          event.preventDefault();
          goToAdjacentLesson(1);
          break;
        case "f":
        case "F": {
          if (hasActiveVideo) return;
          if (!event.metaKey && !event.ctrlKey && activeLessonId) {
            event.preventDefault();
            markActiveComplete();
          }
          break;
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [
    goToAdjacentLesson,
    markActiveComplete,
    hasActiveVideo,
    activeLessonId,
    view,
    activeCourse,
    curriculumOpen,
    setCurriculumOpen,
  ]);

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
          {libraryMode ? (
            <CourseLibrary />
          ) : coursesLoaded ? (
            <LessonView />
          ) : null}
        </main>
        {!libraryMode && (
          <CurriculumSidebar
            collapsed={!curriculumOpen}
          />
        )}
      </div>
    </div>
  );
}
