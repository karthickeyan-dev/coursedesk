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

export function extensionLabel(path: string): string {
  const m = String(path || "").match(/\.([a-z0-9]+)$/i);
  return m ? m[1].toUpperCase() : "FILE";
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
