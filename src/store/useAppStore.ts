import { create } from "zustand";
import type { CoursesBootPhase, CoursesLoadState } from "../lib/course-loader";
import type { LocalFolderStatus } from "../lib/local-courses";
import * as Storage from "../lib/storage";
import type { Theme } from "../lib/storage";
import type {
  AvailableCourse,
  Category,
  CourseNotesMap,
  Lesson,
} from "../types/course";

import { pushCourseRoute, pushLibraryRoute } from "../lib/router";

export type AppView = "library" | "course";
export type SidebarTab = "content" | "files";

export interface NavigationOptions {
  skipHistory?: boolean;
}

export interface AppStore {
  courses: AvailableCourse[];
  coursesLoaded: boolean;
  coursesError: string | null;
  coursesPhase: CoursesBootPhase;
  folderName: string | null;
  folderStatus: LocalFolderStatus | null;

  view: AppView;
  activeCourse: AvailableCourse | null;
  activeLessonId: string | null;

  lessons: Lesson[];
  categories: Category[];
  lessonsById: Record<string, Lesson>;
  categoryIds: string[];
  notesByLessonId: CourseNotesMap;
  completedLessonIds: string[];
  openCategoryId: string | null;

  theme: Theme;
  curriculumOpen: boolean;
  sidebarTab: SidebarTab;
  openFileGroupId: string | null;

  hydrateFromStorage: () => void;
  applyCoursesLoadState: (state: CoursesLoadState) => void;
  setCourses: (courses: AvailableCourse[]) => void;
  openCourse: (courseId: string, options?: NavigationOptions) => void;
  showLibrary: (options?: NavigationOptions) => void;
  selectLesson: (lessonId: string) => void;
  toggleFinished: (lessonId: string) => void;
  toggleSectionFinished: (lessonIds: string[]) => void;
  setOpenCategory: (categoryId: string | null) => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setCurriculumOpen: (open: boolean) => void;
  setSidebarTab: (tab: SidebarTab) => void;
  setOpenFileGroupId: (id: string | null) => void;
  goToAdjacentLesson: (delta: -1 | 1) => void;
  markActiveComplete: () => void;
}

function applyThemeToDom(theme: Theme): void {
  document.documentElement.setAttribute("data-theme", theme);
}

function emptyCourseSlice() {
  return {
    activeCourse: null as AvailableCourse | null,
    activeLessonId: null as string | null,
    lessons: [] as Lesson[],
    categories: [] as Category[],
    lessonsById: {} as Record<string, Lesson>,
    categoryIds: [] as string[],
    notesByLessonId: {} as CourseNotesMap,
    completedLessonIds: [] as string[],
    openCategoryId: null as string | null,
    sidebarTab: "content" as SidebarTab,
    openFileGroupId: null as string | null,
  };
}

export const useAppStore = create<AppStore>((set, get) => ({
  courses: [],
  coursesLoaded: false,
  coursesError: null,
  coursesPhase: "loading",
  folderName: null,
  folderStatus: null,

  view: "library",
  ...emptyCourseSlice(),

  theme: "dark",
  curriculumOpen: true,

  hydrateFromStorage: () => {
    const theme = Storage.loadTheme();
    const curriculumOpen = Storage.loadCurriculumOpen(true);
    applyThemeToDom(theme);
    set({ theme, curriculumOpen });
  },

  applyCoursesLoadState: (state) => {
    Storage.pruneCourses(state.courses.map((c) => c.data.id));
    set({
      courses: state.courses,
      coursesLoaded: true,
      coursesError: state.error,
      coursesPhase: state.phase,
      folderName: state.folderName,
      folderStatus: state.folderStatus,
    });
  },

  setCourses: (courses) => {
    Storage.pruneCourses(courses.map((c) => c.data.id));
    set({
      courses,
      coursesLoaded: true,
      coursesError: null,
      coursesPhase: "ready",
    });
  },

  openCourse: (courseId, options) => {
    const course = get().courses.find((c) => c.data.id === courseId);
    if (!course) return;

    if (!options?.skipHistory) {
      pushCourseRoute(courseId);
    }

    const lessons = course.data.lessons || [];
    const categories = course.data.categories || [];
    const lessonsById: Record<string, Lesson> = {};
    for (const l of lessons) lessonsById[l.id] = l;
    const categoryIds = categories.map((c) => c.id);
    const categoryIdSet = new Set(categoryIds);
    const completedLessonIds = [...Storage.loadFinishedIds(course.data.id)];
    const openCategoryId =
      Storage.loadOpenCategoryId(course.data.id, categoryIdSet) ||
      (categories[0] ? categories[0].id : null);

    const lastId = Storage.loadLastLessonId(course.data.id);
    const activeLessonId =
      lastId && lessonsById[lastId]
        ? lastId
        : lessons[0]
          ? lessons[0].id
          : null;

    Storage.saveActiveCourseId(course.data.id);

    set({
      view: "course",
      activeCourse: course,
      lessons,
      categories,
      lessonsById,
      categoryIds,
      notesByLessonId: course.notes || {},
      completedLessonIds,
      openCategoryId:
        activeLessonId && lessonsById[activeLessonId]
          ? lessonsById[activeLessonId].categoryId
          : openCategoryId,
      activeLessonId,
      sidebarTab: "content",
      openFileGroupId: null,
    });

    if (activeLessonId) {
      Storage.saveLastLessonId(course.data.id, activeLessonId);
      const lesson = lessonsById[activeLessonId];
      if (lesson?.categoryId) {
        Storage.saveOpenCategoryId(course.data.id, lesson.categoryId);
      }
    }
  },

  showLibrary: (options) => {
    if (!options?.skipHistory) {
      pushLibraryRoute();
    }
    Storage.saveActiveCourseId(null);
    set({
      view: "library",
      ...emptyCourseSlice(),
    });
  },

  selectLesson: (lessonId) => {
    const { activeCourse, lessonsById } = get();
    if (!activeCourse) return;
    const lesson = lessonsById[lessonId];
    if (!lesson) return;

    Storage.saveLastLessonId(activeCourse.data.id, lessonId);
    Storage.saveOpenCategoryId(activeCourse.data.id, lesson.categoryId);

    set({
      activeLessonId: lessonId,
      openCategoryId: lesson.categoryId,
    });
  },

  toggleFinished: (lessonId) => {
    const { activeCourse, completedLessonIds } = get();
    if (!activeCourse) return;
    const setIds = new Set(completedLessonIds);
    if (setIds.has(lessonId)) setIds.delete(lessonId);
    else setIds.add(lessonId);
    Storage.saveFinishedIds(activeCourse.data.id, setIds);
    set({ completedLessonIds: [...setIds] });
  },

  toggleSectionFinished: (lessonIds) => {
    const { activeCourse, completedLessonIds } = get();
    if (!activeCourse || !lessonIds.length) return;
    const setIds = new Set(completedLessonIds);
    const allDone = lessonIds.every((id) => setIds.has(id));
    for (const id of lessonIds) {
      if (allDone) setIds.delete(id);
      else setIds.add(id);
    }
    Storage.saveFinishedIds(activeCourse.data.id, setIds);
    set({ completedLessonIds: [...setIds] });
  },

  setOpenCategory: (categoryId) => {
    const { activeCourse } = get();
    if (!activeCourse) return;
    set({ openCategoryId: categoryId });
    if (categoryId) {
      Storage.saveOpenCategoryId(activeCourse.data.id, categoryId);
    }
  },

  setTheme: (theme) => {
    const next: Theme = theme === "light" ? "light" : "dark";
    Storage.saveTheme(next);
    applyThemeToDom(next);
    set({ theme: next });
  },

  toggleTheme: () => {
    const next = get().theme === "light" ? "dark" : "light";
    get().setTheme(next);
  },

  setCurriculumOpen: (open) => {
    Storage.saveCurriculumOpen(open);
    set({ curriculumOpen: open });
  },

  setSidebarTab: (tab) => {
    const resources = get().activeCourse?.data?.resources;
    const hasFiles = Array.isArray(resources) && resources.length > 0;
    if (tab === "files" && !hasFiles) {
      set({ sidebarTab: "content" });
      return;
    }
    set({ sidebarTab: tab });
  },

  setOpenFileGroupId: (id) => set({ openFileGroupId: id }),

  goToAdjacentLesson: (delta) => {
    const { activeLessonId, lessons, selectLesson } = get();
    if (!activeLessonId) return;
    const i = lessons.findIndex((l) => l.id === activeLessonId);
    if (i < 0) return;
    const next = lessons[i + delta];
    if (next) selectLesson(next.id);
  },

  markActiveComplete: () => {
    const { activeLessonId, toggleFinished } = get();
    if (activeLessonId) toggleFinished(activeLessonId);
  },
}));
