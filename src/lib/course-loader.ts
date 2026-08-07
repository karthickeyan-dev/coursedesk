import type { ManifestEntry } from "../types/course";

const DIR = "courses";

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = false;
    s.onload = () => resolve();
    s.onerror = () => {
      s.remove();
      reject(new Error(`Failed to load ${src}`));
    };
    document.head.appendChild(s);
  });
}

function normalize(data: unknown): ManifestEntry[] {
  if (!data) return [];
  if (Array.isArray(data)) {
    return data
      .map((item) => {
        if (typeof item === "string") return { id: item };
        if (item && typeof item === "object" && "id" in item) {
          const e = item as ManifestEntry;
          return { id: String(e.id), hasNotes: e.hasNotes };
        }
        return null;
      })
      .filter((e): e is ManifestEntry => e != null);
  }
  if (typeof data === "object" && data && Array.isArray((data as { courses?: unknown }).courses)) {
    return normalize((data as { courses: unknown[] }).courses);
  }
  return [];
}

function applyRoot(folderId: string): void {
  const reg = window.COURSES || {};
  const data = reg[folderId];
  if (data) {
    data.root = `${DIR}/${folderId}`;
    if (!data.id) data.id = folderId;
    return;
  }
  for (const [key, course] of Object.entries(reg)) {
    if (!course?.root && (course.id === folderId || key === folderId)) {
      course.root = `${DIR}/${folderId}`;
    }
  }
}

/** Discover packages via /courses/manifest.json and load course.js (+ notes.js). */
export async function loadCourses(): Promise<string[]> {
  let entries: ManifestEntry[] = [];
  try {
    const res = await fetch(`${DIR}/manifest.json`, { cache: "no-store" });
    if (res.ok) entries = normalize(await res.json());
  } catch {
    /* empty */
  }

  if (!entries.length) {
    console.warn(
      "[CourseDesk] No courses found. Add courses/<id>/course.js, then run: pnpm start"
    );
    return [];
  }

  const loaded: string[] = [];
  for (const { id, hasNotes } of entries) {
    try {
      await loadScript(`${DIR}/${id}/course.js`);
      applyRoot(id);
      if (hasNotes !== false) {
        await loadScript(`${DIR}/${id}/notes.js`).catch(() => undefined);
      }
      loaded.push(id);
    } catch (err) {
      console.warn(
        `[CourseDesk] Skipping "${id}":`,
        err instanceof Error ? err.message : err
      );
    }
  }
  return loaded;
}
