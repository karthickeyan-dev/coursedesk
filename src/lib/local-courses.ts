/**
 * Local courses folder via File System Access API.
 * Sole course source: user-selected directory (no HTTP /courses server).
 */
import type { AvailableCourse, CourseData, CourseNotesMap } from "../types/course";
import {
  mergeCourseNotes,
  notesMapFromMarkdownFiles,
} from "./course-notes-files";
import {
  availableCourseFromPackage,
  COURSE_PACKAGE_FILENAME,
  LEGACY_COURSE_SCRIPT_FILENAME,
  parseCoursePackage,
} from "./course-package";
import {
  loadPackagingGuideMarkdown,
  PACKAGING_GUIDE_FILENAME,
  PACKAGING_GUIDE_URL,
} from "./course-packaging-guide";
import {
  clearCoursesRootHandle,
  loadCoursesRootHandle,
  saveCoursesRootHandle,
} from "./fs-handle-store";

export type FolderPermissionState =
  | "none"
  | "granted"
  | "prompt"
  | "denied";

export interface LocalFolderStatus {
  supported: boolean;
  hasHandle: boolean;
  folderName: string | null;
  permission: FolderPermissionState;
  canWrite: boolean;
}

export interface LocalLoadResult {
  ids: string[];
  folderName: string;
  courses: AvailableCourse[];
}

type PermissionMode = "read" | "readwrite";

let rootHandle: FileSystemDirectoryHandle | null = null;
/** Immediate child course folders keyed by folder / course id. */
const courseDirs = new Map<string, FileSystemDirectoryHandle>();
/** blob: URLs keyed by `${courseId}\\0${normalizedRelPath}` */
const blobCache = new Map<string, string>();
/** Last successful scan — used when a folder picker is cancelled. */
let lastLoadedCourses: AvailableCourse[] = [];

export function getLoadedCourses(): AvailableCourse[] {
  return lastLoadedCourses;
}

export function isFsAccessSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.showDirectoryPicker === "function" &&
    typeof indexedDB !== "undefined"
  );
}

export function getRootHandle(): FileSystemDirectoryHandle | null {
  return rootHandle;
}

export function getLinkedFolderName(): string | null {
  return rootHandle?.name ?? null;
}

function cacheKey(courseId: string, relPath: string): string {
  return `${courseId}\0${relPath}`;
}

function normalizeRelPath(assetPath: string): string {
  return String(assetPath)
    .trim()
    .replace(/^\.\//, "")
    .replace(/^\/+/, "");
}

export function revokeAllBlobUrls(): void {
  for (const url of blobCache.values()) {
    try {
      URL.revokeObjectURL(url);
    } catch {
      /* ignore */
    }
  }
  blobCache.clear();
}

export function clearLocalSession(): void {
  revokeAllBlobUrls();
  courseDirs.clear();
  lastLoadedCourses = [];
  rootHandle = null;
  if (typeof window !== "undefined") {
    window.COURSES = {};
    window.COURSE_NOTES = {};
  }
}

async function queryPerm(
  handle: FileSystemDirectoryHandle,
  mode: PermissionMode
): Promise<PermissionState | "unknown"> {
  const h = handle as FileSystemDirectoryHandle & {
    queryPermission?: (desc: { mode?: PermissionMode }) => Promise<PermissionState>;
  };
  if (typeof h.queryPermission !== "function") return "granted";
  try {
    return await h.queryPermission({ mode });
  } catch {
    return "unknown";
  }
}

async function requestPerm(
  handle: FileSystemDirectoryHandle,
  mode: PermissionMode
): Promise<PermissionState | "unknown"> {
  const h = handle as FileSystemDirectoryHandle & {
    requestPermission?: (desc: { mode?: PermissionMode }) => Promise<PermissionState>;
  };
  if (typeof h.requestPermission !== "function") return "granted";
  try {
    return await h.requestPermission({ mode });
  } catch {
    return "denied";
  }
}

export async function getFolderStatus(): Promise<LocalFolderStatus> {
  const supported = isFsAccessSupported();
  if (!supported) {
    return {
      supported: false,
      hasHandle: false,
      folderName: null,
      permission: "none",
      canWrite: false,
    };
  }

  const handle = rootHandle ?? (await loadCoursesRootHandle());
  if (!handle) {
    return {
      supported: true,
      hasHandle: false,
      folderName: null,
      permission: "none",
      canWrite: false,
    };
  }

  if (!rootHandle) rootHandle = handle;

  const write = await queryPerm(handle, "readwrite");
  const read =
    write === "granted" ? "granted" : await queryPerm(handle, "read");

  let permission: FolderPermissionState = "prompt";
  if (read === "granted") permission = "granted";
  else if (read === "denied") permission = "denied";
  else if (read === "prompt") permission = "prompt";

  return {
    supported: true,
    hasHandle: true,
    folderName: handle.name,
    permission,
    canWrite: write === "granted",
  };
}

/** Ensure we can read (and prefer write). Needs user gesture when status is prompt. */
export async function ensureFolderAccess(
  preferWrite = true
): Promise<{ ok: boolean; canWrite: boolean }> {
  if (!rootHandle) return { ok: false, canWrite: false };

  if (preferWrite) {
    const w = await queryPerm(rootHandle, "readwrite");
    if (w === "granted") return { ok: true, canWrite: true };
    if (w === "prompt") {
      const rw = await requestPerm(rootHandle, "readwrite");
      if (rw === "granted") return { ok: true, canWrite: true };
    }
  }

  const r = await queryPerm(rootHandle, "read");
  if (r === "granted") return { ok: true, canWrite: false };
  if (r === "prompt") {
    const rr = await requestPerm(rootHandle, "read");
    if (rr === "granted") return { ok: true, canWrite: false };
  }
  return { ok: false, canWrite: false };
}

export async function pickCoursesFolder(): Promise<FileSystemDirectoryHandle> {
  if (!isFsAccessSupported()) {
    throw new Error(
      "This browser does not support local folder access. Use Chrome or Edge on desktop."
    );
  }

  const pick = window.showDirectoryPicker;
  if (typeof pick !== "function") {
    throw new Error(
      "This browser does not support local folder access. Use Chrome or Edge on desktop."
    );
  }
  const handle = await pick({
    id: "coursedesk-courses",
    mode: "readwrite",
    startIn: "documents",
  });

  clearLocalSession();
  rootHandle = handle;
  await saveCoursesRootHandle(handle);
  return handle;
}

export async function restoreCoursesFolder(): Promise<FileSystemDirectoryHandle | null> {
  if (!isFsAccessSupported()) return null;
  const handle = await loadCoursesRootHandle();
  if (!handle) {
    rootHandle = null;
    return null;
  }
  rootHandle = handle;
  return handle;
}

export async function unlinkCoursesFolder(): Promise<void> {
  clearLocalSession();
  await clearCoursesRootHandle();
}

async function hasFile(
  dir: FileSystemDirectoryHandle,
  name: string
): Promise<boolean> {
  try {
    await dir.getFileHandle(name);
    return true;
  } catch {
    return false;
  }
}

async function readTextFile(
  dir: FileSystemDirectoryHandle,
  name: string
): Promise<string> {
  const fh = await dir.getFileHandle(name);
  const file = await fh.getFile();
  return file.text();
}

function loadScriptFromBlobUrl(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = false;
    s.onload = () => {
      s.remove();
      resolve();
    };
    s.onerror = () => {
      s.remove();
      reject(new Error(`Failed to load script ${src}`));
    };
    document.head.appendChild(s);
  });
}

async function runPackageScript(source: string, label: string): Promise<void> {
  const blob = new Blob([source], { type: "text/javascript" });
  const url = URL.createObjectURL(blob);
  try {
    await loadScriptFromBlobUrl(url);
  } catch {
    throw new Error(`Failed to evaluate ${label}`);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function courseDataFromJsRegistry(folderId: string): CourseData | null {
  const reg = window.COURSES || {};
  const data =
    reg[folderId] || Object.values(reg).find((course) => course?.id === folderId);
  if (!data || !Array.isArray(data.lessons)) return null;
  data.root = `courses/${folderId}`;
  data.id = folderId;
  return data;
}

async function* directoryEntries(
  root: FileSystemDirectoryHandle
): AsyncGenerator<[string, FileSystemHandle]> {
  const dir = root as FileSystemDirectoryHandle & {
    entries?: () => AsyncIterableIterator<[string, FileSystemHandle]>;
    [Symbol.asyncIterator]?: () => AsyncIterator<FileSystemHandle>;
  };
  if (typeof dir.entries === "function") {
    for await (const entry of dir.entries()) yield entry;
    return;
  }
  // Fallback: async iterator of handles only
  if (typeof dir[Symbol.asyncIterator] === "function") {
    for await (const handle of dir as unknown as AsyncIterable<FileSystemHandle>) {
      yield [handle.name, handle];
    }
  }
}

type PackageFormat = "json" | "js";

async function discoverCourseFolders(
  root: FileSystemDirectoryHandle
): Promise<{ id: string; format: PackageFormat }[]> {
  const found: { id: string; format: PackageFormat }[] = [];
  for await (const [name, handle] of directoryEntries(root)) {
    if (handle.kind !== "directory") continue;
    const dir = handle as FileSystemDirectoryHandle;
    if (await hasFile(dir, COURSE_PACKAGE_FILENAME)) {
      found.push({ id: name, format: "json" });
    } else if (await hasFile(dir, LEGACY_COURSE_SCRIPT_FILENAME)) {
      found.push({ id: name, format: "js" });
    }
  }
  found.sort((a, b) => a.id.localeCompare(b.id));
  return found;
}

function lessonIdsFromData(data: CourseData): Set<string> {
  const ids = new Set<string>();
  for (const lesson of data.lessons) {
    if (lesson?.id) ids.add(lesson.id);
  }
  return ids;
}

async function readNotesMarkdownFolder(
  courseDir: FileSystemDirectoryHandle,
  lessonIds: Set<string>
): Promise<CourseNotesMap> {
  let notesDir: FileSystemDirectoryHandle;
  try {
    notesDir = await courseDir.getDirectoryHandle("notes");
  } catch {
    return {};
  }
  const files: Record<string, string> = {};
  for await (const [name, handle] of directoryEntries(notesDir)) {
    if (handle.kind !== "file") continue;
    if (!name.toLowerCase().endsWith(".md")) continue;
    try {
      const file = await (handle as FileSystemFileHandle).getFile();
      files[name] = await file.text();
    } catch {
      /* skip unreadable */
    }
  }
  return notesMapFromMarkdownFiles(files, lessonIds);
}

async function loadNotesForCourse(
  dir: FileSystemDirectoryHandle,
  data: CourseData,
  allowLegacyNotesJs: boolean
): Promise<CourseNotesMap> {
  const lessonIds = lessonIdsFromData(data);
  const fromFiles = await readNotesMarkdownFolder(dir, lessonIds);
  if (!allowLegacyNotesJs) return fromFiles;

  let fromScript: CourseNotesMap = {};
  if (await hasFile(dir, "notes.js")) {
    try {
      const notesJs = await readTextFile(dir, "notes.js");
      await runPackageScript(notesJs, `${data.id}/notes.js`);
      fromScript = window.COURSE_NOTES?.[data.id] || {};
    } catch {
      /* optional */
    }
  }

  return mergeCourseNotes(fromFiles, fromScript);
}

async function loadLegacyCourseScript(
  dir: FileSystemDirectoryHandle,
  folderId: string
): Promise<CourseData> {
  const courseJs = await readTextFile(dir, LEGACY_COURSE_SCRIPT_FILENAME);
  await runPackageScript(courseJs, `${folderId}/${LEGACY_COURSE_SCRIPT_FILENAME}`);
  const data = courseDataFromJsRegistry(folderId);
  if (!data) {
    throw new Error(
      `${LEGACY_COURSE_SCRIPT_FILENAME} did not register a course for "${folderId}"`
    );
  }
  return data;
}

/**
 * Scan root handle, load course.json (or legacy course.js) and notes.
 * Requires an already-permissioned rootHandle.
 */
export async function loadCoursesFromFolder(): Promise<LocalLoadResult> {
  if (!rootHandle) {
    throw new Error("No courses folder selected");
  }

  revokeAllBlobUrls();
  courseDirs.clear();
  lastLoadedCourses = [];
  window.COURSES = {};
  window.COURSE_NOTES = {};

  const discovered = await discoverCourseFolders(rootHandle);
  const courses: AvailableCourse[] = [];

  for (const { id, format } of discovered) {
    try {
      const dir = await rootHandle.getDirectoryHandle(id);
      courseDirs.set(id, dir);
      const data =
        format === "json"
          ? parseCoursePackage(await readTextFile(dir, COURSE_PACKAGE_FILENAME), id)
          : await loadLegacyCourseScript(dir, id);
      const notes = await loadNotesForCourse(dir, data, format === "js");
      courses.push(availableCourseFromPackage(data, notes));
    } catch (err) {
      console.warn(
        `[CourseDesk] Skipping "${id}":`,
        err instanceof Error ? err.message : err
      );
      courseDirs.delete(id);
    }
  }

  lastLoadedCourses = courses;
  return { ids: courses.map((c) => c.data.id), folderName: rootHandle.name, courses };
}

async function resolveFileInCourse(
  courseId: string,
  relPath: string
): Promise<File | null> {
  const dir = courseDirs.get(courseId);
  if (!dir) return null;
  const parts = normalizeRelPath(relPath).split("/").filter(Boolean);
  if (!parts.length) return null;

  let current: FileSystemDirectoryHandle = dir;
  for (let i = 0; i < parts.length - 1; i++) {
    const segment = parts[i];
    if (!segment) return null;
    try {
      current = await current.getDirectoryHandle(segment);
    } catch {
      return null;
    }
  }
  const fileName = parts[parts.length - 1];
  if (!fileName) return null;
  try {
    const fh = await current.getFileHandle(fileName);
    return await fh.getFile();
  } catch {
    return null;
  }
}

/** MIME for common course assets so the browser can view (not force-download). */
function mimeFromPath(path: string): string | null {
  const ext = path.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();
  if (!ext) return null;
  const map: Record<string, string> = {
    pdf: "application/pdf",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    bmp: "image/bmp",
    ico: "image/x-icon",
    txt: "text/plain",
    md: "text/markdown;charset=utf-8",
    markdown: "text/markdown;charset=utf-8",
    html: "text/html;charset=utf-8",
    htm: "text/html;charset=utf-8",
    css: "text/css;charset=utf-8",
    js: "text/javascript;charset=utf-8",
    mjs: "text/javascript;charset=utf-8",
    json: "application/json",
    xml: "application/xml",
    csv: "text/csv;charset=utf-8",
    vtt: "text/vtt",
    srt: "application/x-subrip",
    mp4: "video/mp4",
    webm: "video/webm",
    ogv: "video/ogg",
    mov: "video/quicktime",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg",
    m4a: "audio/mp4",
  };
  return map[ext] ?? null;
}

/** Blob/File with a viewable type when the FS handle left type empty. */
function asViewableBlob(file: File, relPath: string): Blob {
  if (file.type && file.type !== "application/octet-stream") return file;
  const mime = mimeFromPath(relPath);
  if (!mime || mime === file.type) return file;
  return new Blob([file], { type: mime });
}

/** Resolve a course-relative path to a blob: URL (cached). */
export async function resolveLocalAssetUrl(
  courseId: string,
  assetPath: string | undefined | null
): Promise<string | null> {
  if (!courseId || !assetPath) return null;
  const raw = String(assetPath).trim();
  if (!raw) return null;
  if (/^(https?:|data:|blob:)/i.test(raw)) return raw;

  let rel = normalizeRelPath(raw);
  // Allow legacy "courses/<id>/..." paths stored in course packages
  const prefix = `courses/${courseId}/`;
  if (rel.startsWith(prefix)) rel = rel.slice(prefix.length);
  else if (rel.startsWith("courses/")) {
    // different course path — unsupported in local mode unless same id
    const m = rel.match(/^courses\/([^/]+)\/(.+)$/);
    const rest = m?.[2];
    if (m?.[1] === courseId && rest) rel = rest;
    else return null;
  }

  const key = cacheKey(courseId, rel);
  const cached = blobCache.get(key);
  if (cached) return cached;

  const file = await resolveFileInCourse(courseId, rel);
  if (!file) return null;
  // Prefer correct MIME so PDFs/images/text open in a tab instead of downloading.
  const url = URL.createObjectURL(asViewableBlob(file, rel));
  blobCache.set(key, url);
  return url;
}

export async function writePackagingGuide(): Promise<void> {
  if (!rootHandle) throw new Error("No courses folder selected");
  const access = await ensureFolderAccess(true);
  if (!access.ok || !access.canWrite) {
    throw new Error(
      "Write permission is required to save COURSE_TEMPLATE.md. Re-select the folder and allow edit access."
    );
  }
  const markdown = await loadPackagingGuideMarkdown();
  const fh = await rootHandle.getFileHandle(PACKAGING_GUIDE_FILENAME, {
    create: true,
  });
  const writable = await fh.createWritable();
  await writable.write(markdown);
  await writable.close();
}

/** Download guide from the static public asset (same file as write source). */
export function downloadPackagingGuide(): void {
  const a = document.createElement("a");
  a.href = PACKAGING_GUIDE_URL;
  a.download = PACKAGING_GUIDE_FILENAME;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export async function packagingGuideExists(): Promise<boolean> {
  if (!rootHandle) return false;
  return hasFile(rootHandle, PACKAGING_GUIDE_FILENAME);
}
