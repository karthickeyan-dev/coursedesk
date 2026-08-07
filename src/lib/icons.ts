/**
 * Lucide icons as HTML (same set/classes as before — UI unchanged).
 */
import { createElement, type IconNode } from "lucide";
import {
  Check,
  ChevronRight,
  FastForward,
  File,
  FileCode,
  FileText,
  FileType,
  Film,
  Gauge,
  Image,
  Maximize,
  Minimize,
  Moon,
  Music,
  Pause,
  Play,
  Rewind,
  SkipBack,
  SkipForward,
  Sun,
  Type,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide";

/** Stroke-only icons; play/volume etc. keep filled style via fill=currentColor. */
const STROKE = new Set<IconNode>([
  Check,
  Maximize,
  Minimize,
  ChevronRight,
  File,
  FileText,
  FileCode,
  FileType,
  Image,
  Film,
  Music,
  Type,
  Sun,
  Moon,
  Gauge,
]);

function svg(icon: IconNode, size: number, className: string, name: string): string {
  const el = createElement(icon, {
    width: size,
    height: size,
    class: `lucide lucide-${name}${className ? ` ${className}` : ""}`.trim(),
    "stroke-width": 2,
    stroke: "currentColor",
    fill: STROKE.has(icon) ? "none" : "currentColor",
    "aria-hidden": "true",
  });
  return el.outerHTML;
}

const HUD: Record<string, { icon: IconNode; name: string }> = {
  play: { icon: Play, name: "play" },
  pause: { icon: Pause, name: "pause" },
  seekBack: { icon: Rewind, name: "rewind" },
  seekForward: { icon: FastForward, name: "fast-forward" },
  volumeHigh: { icon: Volume2, name: "volume-2" },
  volumeLow: { icon: Volume1, name: "volume-1" },
  volumeMute: { icon: VolumeX, name: "volume-x" },
  fullscreen: { icon: Maximize, name: "maximize" },
  exitFullscreen: { icon: Minimize, name: "minimize" },
  jumpStart: { icon: SkipBack, name: "skip-back" },
  jumpEnd: { icon: SkipForward, name: "skip-forward" },
  jump: { icon: Gauge, name: "gauge" },
};

function byExt(pathOrExt: string): { icon: IconNode; name: string } {
  let ext = String(pathOrExt || "").trim().toLowerCase();
  const m = ext.match(/\.([a-z0-9]+)$/);
  if (m) ext = m[1];
  else if (ext.includes(".")) ext = ext.split(".").pop() || ext;

  if (["pdf", "txt", "md", "doc", "docx", "rtf"].includes(ext))
    return { icon: FileText, name: "file-text" };
  if (["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "ico", "avif"].includes(ext))
    return { icon: Image, name: "image" };
  if (["mp4", "webm", "mov", "mkv", "avi", "m4v"].includes(ext))
    return { icon: Film, name: "film" };
  if (["mp3", "wav", "ogg", "m4a", "aac", "flac"].includes(ext))
    return { icon: Music, name: "music" };
  if (["js", "ts", "tsx", "jsx", "json", "html", "css", "py", "rb", "go"].includes(ext))
    return { icon: FileCode, name: "file-code" };
  if (["otf", "ttf", "woff", "woff2"].includes(ext))
    return { icon: Type, name: "type" };
  if (["fig", "ai", "sketch", "psd"].includes(ext))
    return { icon: FileType, name: "file-type" };
  return { icon: File, name: "file" };
}

export const Icons = {
  hud(key: string, size = 36): string {
    const e = HUD[key];
    return e ? svg(e.icon, size, "", e.name) : "";
  },
  sun: () => svg(Sun, 18, "", "sun"),
  moon: () => svg(Moon, 18, "", "moon"),
  chevron: () => svg(ChevronRight, 16, "chev", "chevron-right"),
  check: () => svg(Check, 10, "", "check"),
  play: (c = "icon-play") => svg(Play, 18, c, "play"),
  pause: (c = "icon-pause") => svg(Pause, 18, c, "pause"),
  volumeHigh: (c = "icon-vol") => svg(Volume2, 18, c, "volume-2"),
  volumeLow: (c = "icon-vol-low") => svg(Volume1, 18, c, "volume-1"),
  volumeMute: (c = "icon-mute") => svg(VolumeX, 18, c, "volume-x"),
  fullscreen: (c = "") => svg(Maximize, 18, c, "maximize"),
  fileType(pathOrExt: string, size = 18): string {
    const e = byExt(pathOrExt);
    return svg(e.icon, size, "file-type-icon", e.name);
  },
};
