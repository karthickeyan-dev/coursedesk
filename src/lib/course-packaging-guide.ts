/**
 * Packaging guide served as static markdown (public/COURSE_TEMPLATE.md).
 * Written into the user’s courses folder or downloaded via Settings.
 */

export const PACKAGING_GUIDE_FILENAME = "COURSE_TEMPLATE.md";

/** Public URL for the guide (Vite copies public/ to site root). */
export const PACKAGING_GUIDE_URL = `/${PACKAGING_GUIDE_FILENAME}`;

/** Load guide markdown from the static asset. */
export async function loadPackagingGuideMarkdown(): Promise<string> {
  const res = await fetch(PACKAGING_GUIDE_URL, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to load ${PACKAGING_GUIDE_FILENAME} (${res.status})`);
  }
  return res.text();
}
