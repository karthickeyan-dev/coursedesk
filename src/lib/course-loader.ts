/**
 * Load courses from the user-selected local folder only.
 * Packages are course.json (legacy course.js still evaluates if JSON is absent).
 */
import type { AvailableCourse } from "../types/course";
import {
  ensureFolderAccess,
  getFolderStatus,
  getLoadedCourses,
  isFsAccessSupported,
  loadCoursesFromFolder,
  packagingGuideExists,
  pickCoursesFolder,
  restoreCoursesFolder,
  type LocalFolderStatus,
  unlinkCoursesFolder,
  writePackagingGuide,
} from "./local-courses";

export type CoursesBootPhase =
  | "loading"
  | "ready"
  | "no-folder"
  | "needs-permission"
  | "unsupported"
  | "error";

export interface CoursesLoadState {
  phase: CoursesBootPhase;
  courses: AvailableCourse[];
  folderName: string | null;
  folderStatus: LocalFolderStatus;
  error: string | null;
  wroteGuide: boolean;
}

function emptyStatus(supported: boolean): LocalFolderStatus {
  return {
    supported,
    hasHandle: false,
    folderName: null,
    permission: "none",
    canWrite: false,
  };
}

function loadState(
  partial: Partial<CoursesLoadState> & { phase: CoursesBootPhase }
): CoursesLoadState {
  return {
    courses: [],
    folderName: null,
    folderStatus: emptyStatus(isFsAccessSupported()),
    error: null,
    wroteGuide: false,
    ...partial,
  };
}

async function safeFolderStatus(): Promise<LocalFolderStatus> {
  return getFolderStatus().catch(() => emptyStatus(true));
}

async function errorState(message: string): Promise<CoursesLoadState> {
  const folderStatus = await safeFolderStatus();
  return loadState({
    phase: "error",
    folderName: folderStatus.folderName,
    folderStatus,
    error: message,
  });
}

async function finishWithFolder(wroteGuide: boolean): Promise<CoursesLoadState> {
  const { folderName, courses } = await loadCoursesFromFolder();
  return loadState({
    phase: "ready",
    courses,
    folderName,
    folderStatus: await getFolderStatus(),
    error: null,
    wroteGuide,
  });
}

async function ensureAccessAndLoad(opts: {
  deniedError?: string | null;
  failMessage: string;
}): Promise<CoursesLoadState> {
  try {
    const access = await ensureFolderAccess(true);
    if (!access.ok) {
      const status = await getFolderStatus();
      return loadState({
        phase: "needs-permission",
        folderName: status.folderName,
        folderStatus: status,
        error: opts.deniedError ?? null,
      });
    }
    return await finishWithFolder(false);
  } catch (err) {
    return errorState(err instanceof Error ? err.message : opts.failMessage);
  }
}

/** Boot: restore handle if possible; do not prompt (prompt needs a user gesture). */
export async function bootLocalCourses(): Promise<CoursesLoadState> {
  if (!isFsAccessSupported()) {
    return loadState({
      phase: "unsupported",
      folderStatus: emptyStatus(false),
      error:
        "Local folder access is not supported in this browser. Use Chrome or Edge on desktop.",
    });
  }

  try {
    const handle = await restoreCoursesFolder();
    if (!handle) {
      return loadState({ phase: "no-folder", folderStatus: emptyStatus(true) });
    }

    const status = await getFolderStatus();
    if (status.permission !== "granted") {
      return loadState({
        phase: "needs-permission",
        folderName: handle.name,
        folderStatus: status,
      });
    }

    return await finishWithFolder(false);
  } catch (err) {
    return errorState(err instanceof Error ? err.message : "Failed to load courses");
  }
}

/** User clicked “Choose folder” / “Change folder”. */
export async function selectAndLoadCoursesFolder(): Promise<CoursesLoadState> {
  try {
    await pickCoursesFolder();
    let wroteGuide = false;
    try {
      const exists = await packagingGuideExists();
      if (!exists) {
        await writePackagingGuide();
        wroteGuide = true;
      }
    } catch (err) {
      console.warn(
        "[CourseDesk] Could not write COURSE_TEMPLATE.md:",
        err instanceof Error ? err.message : err
      );
    }
    return await finishWithFolder(wroteGuide);
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      const status = await getFolderStatus();
      const phase: CoursesBootPhase = status.hasHandle
        ? status.permission === "granted"
          ? "ready"
          : "needs-permission"
        : "no-folder";
      return loadState({
        phase,
        courses: phase === "ready" ? getLoadedCourses() : [],
        folderName: status.folderName,
        folderStatus: status,
      });
    }
    return errorState(err instanceof Error ? err.message : "Failed to select folder");
  }
}

/** Re-authorize after needs-permission (must run from a click). */
export async function reauthorizeAndLoadCourses(): Promise<CoursesLoadState> {
  return ensureAccessAndLoad({
    deniedError: "Permission was not granted. Click Allow when prompted.",
    failMessage: "Failed to access folder",
  });
}

/** Rescan the linked folder (new courses, updated course.json). */
export async function rescanCoursesFolder(): Promise<CoursesLoadState> {
  return ensureAccessAndLoad({ failMessage: "Rescan failed" });
}

export async function clearLinkedFolder(): Promise<CoursesLoadState> {
  await unlinkCoursesFolder();
  return loadState({
    phase: "no-folder",
    folderStatus: emptyStatus(isFsAccessSupported()),
  });
}
