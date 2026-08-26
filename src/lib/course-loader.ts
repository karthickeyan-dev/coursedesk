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

async function finishWithFolder(
  wroteGuide: boolean
): Promise<CoursesLoadState> {
  const { folderName, courses } = await loadCoursesFromFolder();
  const folderStatus = await getFolderStatus();
  return {
    phase: "ready",
    courses,
    folderName,
    folderStatus,
    error: null,
    wroteGuide,
  };
}

/** Boot: restore handle if possible; do not prompt (prompt needs a user gesture). */
export async function bootLocalCourses(): Promise<CoursesLoadState> {
  if (!isFsAccessSupported()) {
    return {
      phase: "unsupported",
      courses: [],
      folderName: null,
      folderStatus: emptyStatus(false),
      error:
        "Local folder access is not supported in this browser. Use Chrome or Edge on desktop.",
      wroteGuide: false,
    };
  }

  try {
    const handle = await restoreCoursesFolder();
    if (!handle) {
      return {
        phase: "no-folder",
        courses: [],
        folderName: null,
        folderStatus: emptyStatus(true),
        error: null,
        wroteGuide: false,
      };
    }

    const status = await getFolderStatus();
    if (status.permission !== "granted") {
      return {
        phase: "needs-permission",
        courses: [],
        folderName: handle.name,
        folderStatus: status,
        error: null,
        wroteGuide: false,
      };
    }

    // Permission already granted — load without requesting again
    return await finishWithFolder(false);
  } catch (err) {
    return {
      phase: "error",
      courses: [],
      folderName: null,
      folderStatus: await getFolderStatus().catch(() => emptyStatus(true)),
      error: err instanceof Error ? err.message : "Failed to load courses",
      wroteGuide: false,
    };
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
    // User cancelled picker
    if (err instanceof DOMException && err.name === "AbortError") {
      const status = await getFolderStatus();
      const phase: CoursesBootPhase = status.hasHandle
        ? status.permission === "granted"
          ? "ready"
          : "needs-permission"
        : "no-folder";
      return {
        phase,
        courses: phase === "ready" ? getLoadedCourses() : [],
        folderName: status.folderName,
        folderStatus: status,
        error: null,
        wroteGuide: false,
      };
    }
    return {
      phase: "error",
      courses: [],
      folderName: null,
      folderStatus: await getFolderStatus().catch(() => emptyStatus(true)),
      error: err instanceof Error ? err.message : "Failed to select folder",
      wroteGuide: false,
    };
  }
}

/** Re-authorize after needs-permission (must run from a click). */
export async function reauthorizeAndLoadCourses(): Promise<CoursesLoadState> {
  try {
    const access = await ensureFolderAccess(true);
    if (!access.ok) {
      const status = await getFolderStatus();
      return {
        phase: "needs-permission",
        courses: [],
        folderName: status.folderName,
        folderStatus: status,
        error: "Permission was not granted. Click Allow when prompted.",
        wroteGuide: false,
      };
    }
    return await finishWithFolder(false);
  } catch (err) {
    return {
      phase: "error",
      courses: [],
      folderName: null,
      folderStatus: await getFolderStatus().catch(() => emptyStatus(true)),
      error: err instanceof Error ? err.message : "Failed to access folder",
      wroteGuide: false,
    };
  }
}

/** Rescan the linked folder (new courses, updated course.json). */
export async function rescanCoursesFolder(): Promise<CoursesLoadState> {
  try {
    const access = await ensureFolderAccess(true);
    if (!access.ok) {
      const status = await getFolderStatus();
      return {
        phase: "needs-permission",
        courses: [],
        folderName: status.folderName,
        folderStatus: status,
        error: null,
        wroteGuide: false,
      };
    }
    return await finishWithFolder(false);
  } catch (err) {
    return {
      phase: "error",
      courses: [],
      folderName: (await getFolderStatus()).folderName,
      folderStatus: await getFolderStatus(),
      error: err instanceof Error ? err.message : "Rescan failed",
      wroteGuide: false,
    };
  }
}

export async function clearLinkedFolder(): Promise<CoursesLoadState> {
  await unlinkCoursesFolder();
  return {
    phase: "no-folder",
    courses: [],
    folderName: null,
    folderStatus: emptyStatus(isFsAccessSupported()),
    error: null,
    wroteGuide: false,
  };
}
