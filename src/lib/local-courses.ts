/**
 * Local courses folder via File System Access API.
 * Sole course source: user-selected directory (no HTTP /courses server).
 */
import {
  clearCoursesRootHandle,
  loadCoursesRootHandle,
  saveCoursesRootHandle,
} from "./fs-handle-store";
import {
  loadPackagingGuideMarkdown,
  PACKAGING_GUIDE_FILENAME,
  PACKAGING_GUIDE_URL,
} from "./course-packaging-guide";

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
}

type PermissionMode = "read" | "readwrite";

let rootHandle: FileSystemDirectoryHandle | null = null;
/** Immediate child course folders keyed by folder / course id. */
const courseDirs = new Map<string, FileSystemDirectoryHandle>();
/** blob: URLs keyed by `${courseId}\\0${normalizedRelPath}` */
const blobCache = new Map<string, string>();

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

function applyRoot(folderId: string): void {
  const reg = window.COURSES || {};
  const data = reg[folderId];
  if (data) {
    data.root = `courses/${folderId}`;
    if (!data.id) data.id = folderId;
    return;
  }
  for (const [key, course] of Object.entries(reg)) {
    if (!course?.root && (course.id === folderId || key === folderId)) {
      course.root = `courses/${folderId}`;
      if (!course.id) course.id = folderId;
    }
  }
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

async function discoverCourseIds(
  root: FileSystemDirectoryHandle
): Promise<{ id: string; hasNotes: boolean }[]> {
  const entries: { id: string; hasNotes: boolean }[] = [];
  for await (const [name, handle] of directoryEntries(root)) {
    if (handle.kind !== "directory") continue;
    const dir = handle as FileSystemDirectoryHandle;
    if (!(await hasFile(dir, "course.js"))) continue;
    entries.push({
      id: name,
      hasNotes: await hasFile(dir, "notes.js"),
    });
  }
  entries.sort((a, b) => a.id.localeCompare(b.id));
  return entries;
}

/**
 * Scan root handle, load course.js / notes.js into window.COURSES.
 * Requires an already-permissioned rootHandle.
 */
export async function loadCoursesFromFolder(): Promise<LocalLoadResult> {
  if (!rootHandle) {
    throw new Error("No courses folder selected");
  }

  revokeAllBlobUrls();
  courseDirs.clear();
  window.COURSES = {};
  window.COURSE_NOTES = {};

  const discovered = await discoverCourseIds(rootHandle);
  const loaded: string[] = [];

  for (const { id, hasNotes } of discovered) {
    try {
      const dir = await rootHandle.getDirectoryHandle(id);
      courseDirs.set(id, dir);
      const courseJs = await readTextFile(dir, "course.js");
      await runPackageScript(courseJs, `${id}/course.js`);
      applyRoot(id);
      if (hasNotes) {
        try {
          const notesJs = await readTextFile(dir, "notes.js");
          await runPackageScript(notesJs, `${id}/notes.js`);
        } catch {
          /* optional */
        }
      }
      loaded.push(id);
    } catch (err) {
      console.warn(
        `[CourseDesk] Skipping "${id}":`,
        err instanceof Error ? err.message : err
      );
      courseDirs.delete(id);
    }
  }

  return { ids: loaded, folderName: rootHandle.name };
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
  const url = URL.createObjectURL(file);
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
