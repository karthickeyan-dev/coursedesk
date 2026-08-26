import type { AvailableCourse, CourseData, CourseNotesMap } from "../types/course";

export const COURSE_PACKAGE_FILENAME = "course.json";

/** Parse a course.json document. Folder name is the source of truth for `id`. */
export function parseCoursePackage(jsonText: string, folderId: string): CourseData {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error(`${COURSE_PACKAGE_FILENAME} is not valid JSON`);
  }

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`${COURSE_PACKAGE_FILENAME} must be an object`);
  }

  const raw = parsed as Record<string, unknown>;
  if (!Array.isArray(raw.lessons)) {
    throw new Error(`${COURSE_PACKAGE_FILENAME} must include a lessons array`);
  }

  const declaredId = typeof raw.id === "string" ? raw.id.trim() : "";
  if (declaredId && declaredId !== folderId) {
    console.warn(
      `[CourseDesk] "${folderId}/${COURSE_PACKAGE_FILENAME}" id "${declaredId}" does not match folder name; using folder name.`
    );
  }

  return {
    ...(raw as unknown as CourseData),
    id: folderId,
    root: `courses/${folderId}`,
  };
}

export function availableCourseFromPackage(
  data: CourseData,
  notes: CourseNotesMap = {}
): AvailableCourse {
  return { data, notes };
}
