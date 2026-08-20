import { fileIconLabel, fileKind, type FileKind } from "@/lib/format";

const KIND_COLOR: Record<FileKind, string> = {
  pdf: "#dc3d3d",
  image: "#1f9d64",
  video: "#a435f0",
  audio: "#c026d3",
  archive: "#ca8a04",
  spreadsheet: "#15803d",
  presentation: "#ea580c",
  document: "#2563eb",
  code: "#6366f1",
  text: "#64748b",
  design: "#d97706",
  file: "#6b7280",
};

/** Lucide File paths, viewBox cropped to the glyph so rows line up with the group label. */
function FileGlyph() {
  return (
    <svg
      viewBox="4 2 16 20"
      className="block size-9"
      fill="currentColor"
      aria-hidden
    >
      <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" />
    </svg>
  );
}

export function FileTypeIcon({ path }: { path: string }) {
  const kind = fileKind(path);
  const label = fileIconLabel(path);
  const color = KIND_COLOR[kind];
  const long = label.length > 3;

  return (
    <span
      className="relative block size-9 shrink-0"
      title={label}
      aria-hidden="true"
      style={{ color }}
    >
      <FileGlyph />
      <span
        className="absolute inset-x-[3px] top-[36%] bottom-[12%] flex items-center justify-center text-center font-bold leading-none tracking-tight text-white"
        style={{ fontSize: long ? 7 : 9 }}
      >
        {label}
      </span>
    </span>
  );
}
