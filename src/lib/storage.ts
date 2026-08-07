/**
 * localStorage — prefs + per-course progress.
 * Keys are stable (do not rename): theme, sidebar, activeCourse, courses.
 */

const P = "coursedesk";
const K = {
  theme: `${P}.theme`,
  sidebar: `${P}.sidebar`,
  active: `${P}.activeCourse`,
  courses: `${P}.courses`,
} as const;

export type Theme = "dark" | "light";

export interface CourseRecord {
  completedLessonIds: string[];
  lastLessonId: string | null;
  openCategoryId: string | null;
  playbackPositions: Record<string, number>;
}

type CoursesMap = Record<string, CourseRecord>;

let cache: CoursesMap | null = null;

function get(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function set(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* quota / private mode */
  }
}

function del(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

function isObj(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === "object" && !Array.isArray(v);
}

function empty(): CourseRecord {
  return {
    completedLessonIds: [],
    lastLessonId: null,
    openCategoryId: null,
    playbackPositions: {},
  };
}

function normalizeRecord(raw: unknown): CourseRecord {
  const base = empty();
  if (!isObj(raw)) return base;

  base.completedLessonIds = Array.isArray(raw.completedLessonIds)
    ? raw.completedLessonIds.filter((id): id is string => typeof id === "string" && !!id)
    : [];
  base.lastLessonId =
    typeof raw.lastLessonId === "string" && raw.lastLessonId ? raw.lastLessonId : null;
  base.openCategoryId =
    typeof raw.openCategoryId === "string" && raw.openCategoryId
      ? raw.openCategoryId
      : null;

  if (isObj(raw.playbackPositions)) {
    for (const [id, val] of Object.entries(raw.playbackPositions)) {
      const n = typeof val === "number" ? val : Number(val);
      if (isFinite(n) && n >= 3) base.playbackPositions[id] = Math.floor(n);
    }
  }
  return base;
}

function loadMap(): CoursesMap {
  if (cache) return cache;
  cache = {};
  try {
    const raw = get(K.courses);
    if (!raw) return cache;
    const parsed = JSON.parse(raw) as unknown;
    if (!isObj(parsed)) return cache;
    for (const id of Object.keys(parsed)) {
      if (id) cache[id] = normalizeRecord(parsed[id]);
    }
  } catch {
    cache = {};
  }
  return cache;
}

function saveMap(): void {
  if (!cache) return;
  set(K.courses, JSON.stringify(cache));
}

function course(courseId: string): CourseRecord {
  const map = loadMap();
  if (!map[courseId]) map[courseId] = empty();
  return map[courseId];
}

export const loadTheme = (): Theme => (get(K.theme) === "light" ? "light" : "dark");
export const saveTheme = (theme: Theme): void =>
  set(K.theme, theme === "light" ? "light" : "dark");

export function loadCurriculumOpen(defaultOpen: boolean): boolean {
  const v = get(K.sidebar);
  if (v === "0") return false;
  if (v === "1") return true;
  return defaultOpen;
}

export const saveCurriculumOpen = (open: boolean): void =>
  set(K.sidebar, open ? "1" : "0");

export const loadActiveCourseId = (): string | null => get(K.active) || null;

export function saveActiveCourseId(courseId: string | null): void {
  if (courseId) set(K.active, courseId);
  else del(K.active);
}

export function loadFinishedIds(courseId: string | null | undefined): Set<string> {
  if (!courseId) return new Set();
  return new Set(loadMap()[courseId]?.completedLessonIds ?? []);
}

export function saveFinishedIds(courseId: string, ids: Set<string>): void {
  if (!courseId) return;
  course(courseId).completedLessonIds = [...ids];
  saveMap();
}

export function loadLastLessonId(courseId: string | null | undefined): string | null {
  return courseId ? loadMap()[courseId]?.lastLessonId ?? null : null;
}

export function saveLastLessonId(courseId: string, lessonId: string): void {
  if (!courseId || !lessonId) return;
  course(courseId).lastLessonId = lessonId;
  saveMap();
}

export function loadOpenCategoryId(
  courseId: string | null | undefined,
  valid?: Set<string> | null
): string | null {
  if (!courseId) return null;
  const id = loadMap()[courseId]?.openCategoryId ?? null;
  return id && valid?.has(id) ? id : null;
}

export function saveOpenCategoryId(courseId: string, categoryId: string): void {
  if (!courseId || !categoryId) return;
  course(courseId).openCategoryId = categoryId;
  saveMap();
}

export function loadLessonTime(
  courseId: string | null | undefined,
  lessonId: string | null | undefined
): number {
  if (!courseId || !lessonId) return 0;
  const n = loadMap()[courseId]?.playbackPositions?.[lessonId];
  return typeof n === "number" && n > 0 ? n : 0;
}

export function saveLessonTime(
  courseId: string,
  lessonId: string,
  seconds: number
): void {
  if (!courseId || !lessonId) return;
  const t = Math.max(0, Math.floor(Number(seconds) || 0));
  const rec = course(courseId);
  if (t < 3) {
    if (rec.playbackPositions[lessonId] != null) {
      delete rec.playbackPositions[lessonId];
      saveMap();
    }
    return;
  }
  rec.playbackPositions[lessonId] = t;
  saveMap();
}

export function pruneCourses(validIds: Iterable<string>): void {
  const map = loadMap();
  const valid = new Set([...validIds].filter(Boolean).map(String));
  let changed = false;
  for (const id of Object.keys(map)) {
    if (!valid.has(id)) {
      delete map[id];
      changed = true;
    }
  }
  if (changed) saveMap();
  const active = loadActiveCourseId();
  if (active && !valid.has(active)) saveActiveCourseId(null);
}
