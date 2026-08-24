import { FolderOpen, RefreshCw } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PACKAGING_GUIDE_FILENAME } from "@/lib/course-packaging-guide";

export type EmptyCoursesKind =
  | "no-folder"
  | "needs-permission"
  | "no-courses"
  | "unsupported"
  | "error";

interface EmptyCoursesStateProps {
  kind: EmptyCoursesKind;
  folderName?: string | null;
  error?: string | null;
  busy?: boolean;
  onChooseFolder: () => void;
  onAllowAccess?: () => void;
  onRescan?: () => void;
}

export function EmptyCoursesState({
  kind,
  folderName,
  error,
  busy,
  onChooseFolder,
  onAllowAccess,
  onRescan,
}: EmptyCoursesStateProps) {
  const title =
    kind === "unsupported"
      ? "Browser not supported"
      : kind === "needs-permission"
        ? "Allow folder access"
        : kind === "no-courses"
          ? "No courses found"
          : kind === "error"
            ? "Something went wrong"
            : "Choose your courses folder";

  const lead =
    kind === "unsupported"
      ? "CourseDesk reads courses from a folder on your computer. Use Chrome or Edge on desktop (File System Access API)."
      : kind === "needs-permission"
        ? `Your browser still has a link to “${folderName || "your courses folder"}”, but access must be confirmed again.`
        : kind === "no-courses"
          ? folderName
            ? `Linked folder “${folderName}” has no valid packages yet. Add a subfolder with course.js, then rescan.`
            : "Add course packages to your folder, then rescan."
          : kind === "error"
            ? error || "Could not load courses from the selected folder."
            : "Select the folder that contains your course packages. We’ll remember it for next visits. Videos stay on your computer.";

  return (
    <div className="w-full max-w-[720px]" role="status">
      <div className="px-0 pt-2 pb-6">
        <div className="mb-3">
          <BrandLogo wordmarkClassName="text-foreground" />
        </div>
        <h2 className="m-0 mb-2.5 text-[clamp(1.5rem,2.2vw,1.85rem)] leading-snug tracking-tight">
          {title}
        </h2>
        <p className="m-0 max-w-[52ch] text-[0.95rem] leading-relaxed text-muted">
          {lead}
        </p>

        {error && kind !== "error" ? (
          <Alert variant="destructive" className="mt-3">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="mt-[22px] mb-7 flex flex-wrap gap-2.5">
          {kind === "needs-permission" && onAllowAccess ? (
            <Button type="button" disabled={busy} onClick={onAllowAccess}>
              <RefreshCw size={16} aria-hidden />
              Allow access
            </Button>
          ) : null}
          {kind === "no-courses" && onRescan ? (
            <Button type="button" disabled={busy} onClick={onRescan}>
              <RefreshCw size={16} aria-hidden />
              Rescan folder
            </Button>
          ) : null}
          {kind !== "unsupported" ? (
            <Button
              type="button"
              variant={
                kind === "no-folder" || kind === "error" ? "default" : "secondary"
              }
              disabled={busy}
              onClick={onChooseFolder}
            >
              <FolderOpen size={16} aria-hidden />
              {kind === "no-folder" ? "Choose courses folder" : "Change folder"}
            </Button>
          ) : null}
        </div>

        <Card className="mt-2 border-border bg-elevated shadow-card">
          <CardHeader className="space-y-0 px-5 pt-5 pb-0">
            <CardTitle className="text-[0.85rem] font-bold tracking-[0.04em] text-muted uppercase">
              Expected layout
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pt-3 pb-4.5">
            <pre className="mb-3.5 overflow-x-auto rounded-lg border border-border bg-code-bg px-4 py-3.5 font-mono text-xs leading-relaxed whitespace-pre text-code-fg">{`<courses-root>/
  ${PACKAGING_GUIDE_FILENAME}
  <course-id>/
    course.js      required
    notes/         optional — one .md per lesson
    videos/
    assets/`}</pre>
            <ul className="m-0 list-disc space-y-1.5 pl-[1.15rem] text-[0.9rem] leading-relaxed text-muted">
              <li>
                Each course is a <strong className="text-text">subfolder</strong>{" "}
                with a{" "}
                <code className="rounded bg-panel-2 px-1.5 py-px font-mono text-[0.84em] text-text">
                  course.js
                </code>{" "}
                file
              </li>
              <li>
                Folder name, course{" "}
                <code className="rounded bg-panel-2 px-1.5 py-px font-mono text-[0.84em] text-text">
                  id
                </code>
                , and{" "}
                <code className="rounded bg-panel-2 px-1.5 py-px font-mono text-[0.84em] text-text">
                  COURSES
                </code>{" "}
                key must match (kebab-case)
              </li>
              <li>
                Video paths are relative (e.g.{" "}
                <code className="rounded bg-panel-2 px-1.5 py-px font-mono text-[0.84em] text-text">
                  videos/001-welcome.mp4
                </code>
                )
              </li>
              <li>
                Keep lesson{" "}
                <code className="rounded bg-panel-2 px-1.5 py-px font-mono text-[0.84em] text-text">
                  id
                </code>
                s stable — progress is stored by id
              </li>
              <li>
                For AI packaging, open this folder in your editor and follow{" "}
                <code className="rounded bg-panel-2 px-1.5 py-px font-mono text-[0.84em] text-text">
                  {PACKAGING_GUIDE_FILENAME}
                </code>{" "}
                (written on first folder pick; restore anytime from Settings)
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
