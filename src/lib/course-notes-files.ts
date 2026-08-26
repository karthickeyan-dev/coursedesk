import type { CourseNotesMap } from "../types/course";

/** `001-welcome.md` → `001-welcome`. Null if not a markdown file. */
export function markdownFilenameToLessonId(filename: string): string | null {
  const base = String(filename || "")
    .trim()
    .replace(/\\/g, "/")
    .split("/")
    .filter(Boolean)
    .pop();
  if (!base) return null;
  const lower = base.toLowerCase();
  if (!lower.endsWith(".md")) return null;
  const stem = base.slice(0, -3);
  return stem || null;
}

/** Keep only markdown files whose stem matches a lesson id. */
export function notesMapFromMarkdownFiles(
  files: Record<string, string>,
  lessonIds: Set<string>
): CourseNotesMap {
  const out: CourseNotesMap = {};
  for (const [name, content] of Object.entries(files)) {
    const id = markdownFilenameToLessonId(name);
    if (!id || !lessonIds.has(id)) continue;
    out[id] = content;
  }
  return out;
}
