import { useEffect } from "react";
import { useHasActiveVideo } from "@/components/player/VideoPlayer";
import { courseAuthor, courseTitle } from "@/lib/assets";
import { isEditableTarget } from "@/lib/keyboard";
import { getRouteFromLocation, replaceLibraryRoute } from "@/lib/router";
import { openCourseOrLibrary } from "@/store/navigation";
import { useAppStore } from "@/store/useAppStore";

function useDocumentTitle() {
  const view = useAppStore((s) => s.view);
  const activeCourse = useAppStore((s) => s.activeCourse);

  useEffect(() => {
    if (view === "library" || !activeCourse) {
      document.title = "CourseDesk";
      return;
    }
    const title = courseTitle(activeCourse);
    const author = courseAuthor(activeCourse);
    document.title = author ? `${title} · ${author}` : title;
  }, [view, activeCourse]);
}

function usePopState() {
  useEffect(() => {
    const onPopState = () => {
      const store = useAppStore.getState();
      if (!store.coursesLoaded) return;

      const route = getRouteFromLocation();
      if (route.view === "course" && route.courseId) {
        if (
          store.view === "course" &&
          store.activeCourse?.data.id === route.courseId
        ) {
          return;
        }
        if (!openCourseOrLibrary(route.courseId, { skipHistory: true })) {
          replaceLibraryRoute();
        }
      } else if (store.view !== "library") {
        openCourseOrLibrary(null, { skipHistory: true });
      }
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);
}

function useAppKeyboard() {
  const view = useAppStore((s) => s.view);
  const curriculumOpen = useAppStore((s) => s.curriculumOpen);
  const activeCourse = useAppStore((s) => s.activeCourse);
  const goToAdjacentLesson = useAppStore((s) => s.goToAdjacentLesson);
  const markActiveComplete = useAppStore((s) => s.markActiveComplete);
  const setCurriculumOpen = useAppStore((s) => s.setCurriculumOpen);
  const activeLessonId = useAppStore((s) => s.activeLessonId);
  const hasActiveVideo = useHasActiveVideo();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (isEditableTarget(event.target)) return;

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
}

export function useAppChrome() {
  useDocumentTitle();
  usePopState();
  useAppKeyboard();
}
