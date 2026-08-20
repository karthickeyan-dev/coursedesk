/** Framework-agnostic time/label helpers. */

export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const s = total % 60;
  const m = Math.floor(total / 60) % 60;
  const h = Math.floor(total / 3600);
  const ss = String(s).padStart(2, "0");
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${ss}`;
  return `${m}:${ss}`;
}

export function formatRate(rate: number): string {
  if (!Number.isFinite(rate)) return "1×";
  const rounded = Math.round(rate * 100) / 100;
  return `${rounded}×`;
}

export function formatDurationTotal(seconds: number): string {
  const total = Math.max(0, Math.round(Number(seconds) || 0));
  if (!total) return "0m";
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) {
    if (m > 0) return `${h}h ${m}m`;
    return `${h}h`;
  }
  if (m > 0) {
    if (m < 5 && s > 0) return `${m}m ${s}s`;
    return `${m}m`;
  }
  return `${s}s`;
}

export function formatLessonTime(seconds: number): string {
  if (!seconds) return "";
  return formatTime(seconds);
}

export function courseMonogram(title: string): string {
  const words = String(title || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return "C";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function pathExtension(path: string): string | null {
  const m = String(path || "").match(/\.([a-z0-9]+)(?:[?#]|$)/i);
  return m ? m[1].toLowerCase() : null;
}

export function extensionLabel(path: string): string {
  const ext = pathExtension(path);
  return ext ? ext.toUpperCase() : "FILE";
}

/** Extension drawn inside the file icon. */
export function fileIconLabel(path: string): string {
  const ext = pathExtension(path);
  if (!ext) return "FILE";
  if (ext === "markdown") return "MD";
  if (ext === "jpeg") return "JPG";
  return ext.toUpperCase();
}

export type FileKind =
  | "pdf"
  | "image"
  | "video"
  | "audio"
  | "archive"
  | "spreadsheet"
  | "presentation"
  | "document"
  | "code"
  | "text"
  | "design"
  | "file";

const IMAGE_EXT = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "svg",
  "bmp",
  "ico",
  "avif",
  "heic",
  "tif",
  "tiff",
]);
const VIDEO_EXT = new Set(["mp4", "webm", "ogv", "mov", "mkv", "avi", "m4v"]);
const AUDIO_EXT = new Set(["mp3", "wav", "ogg", "m4a", "aac", "flac", "opus"]);
const ARCHIVE_EXT = new Set(["zip", "rar", "7z", "tar", "gz", "tgz", "bz2"]);
const SHEET_EXT = new Set(["xls", "xlsx", "csv", "ods", "numbers"]);
const SLIDE_EXT = new Set(["ppt", "pptx", "key", "odp"]);
const DOC_EXT = new Set(["doc", "docx", "odt", "rtf", "pages"]);
const CODE_EXT = new Set([
  "js",
  "mjs",
  "cjs",
  "ts",
  "tsx",
  "jsx",
  "html",
  "htm",
  "css",
  "json",
  "xml",
  "py",
  "go",
  "rs",
  "java",
  "rb",
  "php",
  "sh",
  "yml",
  "yaml",
]);
const TEXT_EXT = new Set(["txt", "md", "markdown", "vtt", "srt"]);
const DESIGN_EXT = new Set(["fig", "figx", "psd", "ai", "sketch", "xd", "indd"]);

export function fileKind(path: string): FileKind {
  const ext = pathExtension(path);
  if (!ext) return "file";
  if (ext === "pdf") return "pdf";
  if (IMAGE_EXT.has(ext)) return "image";
  if (VIDEO_EXT.has(ext)) return "video";
  if (AUDIO_EXT.has(ext)) return "audio";
  if (ARCHIVE_EXT.has(ext)) return "archive";
  if (SHEET_EXT.has(ext)) return "spreadsheet";
  if (SLIDE_EXT.has(ext)) return "presentation";
  if (DOC_EXT.has(ext)) return "document";
  if (CODE_EXT.has(ext)) return "code";
  if (TEXT_EXT.has(ext)) return "text";
  if (DESIGN_EXT.has(ext)) return "design";
  return "file";
}

export function fileBasename(path: string): string {
  const trimmed = String(path || "")
    .trim()
    .replace(/\\/g, "/");
  const withoutQuery = trimmed.split(/[?#]/)[0] ?? "";
  const base = withoutQuery.split("/").filter(Boolean).pop();
  return base || "download";
}

/** Formats the browser can render inline (new tab). Not .fig, Office, archives, etc. */
const VIEWABLE_EXTENSIONS = new Set([
  "pdf",
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "svg",
  "bmp",
  "ico",
  "avif",
  "txt",
  "md",
  "markdown",
  "html",
  "htm",
  "json",
  "xml",
  "csv",
  "mp4",
  "webm",
  "ogv",
  "mp3",
  "wav",
  "ogg",
  "m4a",
]);

export function canViewInBrowser(path: string): boolean {
  const ext = pathExtension(path);
  return Boolean(ext && VIEWABLE_EXTENSIONS.has(ext));
}

/** Resume position math (ported from player.ts). */
export function applyResumeSeconds(seconds: number, duration: number): number | null {
  if (!Number.isFinite(duration) || duration <= 0) return null;
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  const endThreshold = Math.max(5, duration * 0.02);
  if (seconds >= duration - endThreshold) return 0;
  if (seconds > 2) return Math.min(seconds, duration - 0.25);
  return null;
}
