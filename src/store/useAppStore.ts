import { create } from "zustand";
import {
  buildAvailableCourses,
  categoryTitle as categoryTitleOf,
  lectureTypeLabel as lectureTypeOf,
  lessonDurationSeconds,
  resolveCourseAsset,
  sumLessonDurations,
} from "../lib/assets";
import { loadCourses } from "../lib/course-loader";
import * as Storage from "../lib/storage";
import type { Theme } from "../lib/storage";
import type {
  AvailableCourse,
  Category,
  CourseNotesMap,
  Lesson,
} from "../types/course";

export type AppView = "library" | "course";
export type SidebarTab = "content" | "files";

export interface AppStore {
  courses: AvailableCourse[];
  coursesLoaded: boolean;
  coursesError: string | null;

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
  setCourses: (courses: AvailableCourse[]) => void;
  openCourse: (courseId: string) => void;
  showLibrary: () => void;
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

  setCourses: (courses) => {
    Storage.pruneCourses(courses.map((c) => c.data.id));
    set({ courses, coursesLoaded: true, coursesError: null });
  },

  openCourse: (courseId) => {
    const course = get().courses.find((c) => c.data.id === courseId);
    if (!course) return;

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

  showLibrary: () => {
    Storage.saveActiveCourseId(null);
    set({
      view: "library",
      ...emptyCourseSlice(),
    });
  },

  selectLesson: (lessonId) => {
    const { activeCourse, lessonsById, activeLessonId } = get();
    if (!activeCourse) return;
    const lesson = lessonsById[lessonId];
    if (!lesson) return;

    Storage.saveLastLessonId(activeCourse.data.id, lessonId);
    Storage.saveOpenCategoryId(activeCourse.data.id, lesson.categoryId);

    set({
      activeLessonId: lessonId,
      openCategoryId: lesson.categoryId,
    });

    // Keep reference for player persist side-effect consumers
    void activeLessonId;
  },

  toggleFinished: (lessonId) => {
    const { activeCourse, completedLessonIds } = get();
    if (!activeCourse) return;
    const setIds = new Set(completedLessonIds);
    if (setIds.has(lessonId)) setIds.delete(lessonId);
    else setIds.add(lessonId);
    const next = [...setIds];
    Storage.saveFinishedIds(activeCourse.data.id, setIds);
    set({ completedLessonIds: next });
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

export function finishedSet(completedLessonIds: string[]): Set<string> {
  return new Set(completedLessonIds);
}

export function isLessonFinished(
  completedLessonIds: string[],
  lessonId: string
): boolean {
  return completedLessonIds.includes(lessonId);
}

export {
  categoryTitleOf as categoryTitle,
  lectureTypeOf as lectureTypeLabel,
  lessonDurationSeconds,
  resolveCourseAsset,
  sumLessonDurations,
  buildAvailableCourses,
  loadCourses,
};
