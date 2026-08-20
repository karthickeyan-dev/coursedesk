import { File } from "lucide-react";
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
      <File
        size={36}
        strokeWidth={1.5}
        fill="currentColor"
        className="block size-9"
      />
      <span
        className="absolute inset-x-[5px] top-[38%] bottom-[14%] flex items-center justify-center text-center font-bold leading-none tracking-tight text-white"
        style={{ fontSize: long ? 7 : 9 }}
      >
        {label}
      </span>
    </span>
  );
}
