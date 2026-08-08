import { FolderOpen, RefreshCw } from "lucide-react";
import { PACKAGING_GUIDE_FILENAME } from "../../lib/course-packaging-guide";

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
    <div className="empty-courses" role="status">
      <div className="empty-courses-card">
        <p className="welcome-kicker">CourseDesk</p>
        <h2>{title}</h2>
        <p className="library-lead">{lead}</p>

        {error && kind !== "error" ? (
          <p className="empty-courses-error">{error}</p>
        ) : null}

        <div className="empty-courses-actions">
          {kind === "needs-permission" && onAllowAccess ? (
            <button
              type="button"
              className="btn btn-primary"
              disabled={busy}
              onClick={onAllowAccess}
            >
              <RefreshCw size={16} aria-hidden />
              Allow access
            </button>
          ) : null}
          {kind === "no-courses" && onRescan ? (
            <button
              type="button"
              className="btn btn-primary"
              disabled={busy}
              onClick={onRescan}
            >
              <RefreshCw size={16} aria-hidden />
              Rescan folder
            </button>
          ) : null}
          {kind !== "unsupported" ? (
            <button
              type="button"
              className={`btn ${kind === "no-folder" || kind === "error" ? "btn-primary" : "btn-ghost"}`}
              disabled={busy}
              onClick={onChooseFolder}
            >
              <FolderOpen size={16} aria-hidden />
              {kind === "no-folder" ? "Choose courses folder" : "Change folder"}
            </button>
          ) : null}
        </div>

        <div className="empty-courses-format">
          <h3>Expected layout</h3>
          <pre className="empty-courses-code">{`<courses-root>/
  ${PACKAGING_GUIDE_FILENAME}
  <course-id>/
    course.js      required
    notes.js       optional
    videos/
    assets/`}</pre>
          <ul className="empty-courses-rules">
            <li>
              Each course is a <strong>subfolder</strong> with a{" "}
              <code>course.js</code> file
            </li>
            <li>
              Folder name, course <code>id</code>, and <code>COURSES</code> key
              must match (kebab-case)
            </li>
            <li>
              Video paths are relative (e.g.{" "}
              <code>videos/001-welcome.mp4</code>)
            </li>
            <li>
              Keep lesson <code>id</code>s stable — progress is stored by id
            </li>
            <li>
              For AI packaging, open this folder in your editor and follow{" "}
              <code>{PACKAGING_GUIDE_FILENAME}</code> (written on first folder
              pick; restore anytime from Settings)
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
