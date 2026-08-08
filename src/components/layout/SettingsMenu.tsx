import { useEffect, useId, useRef, useState } from "react";
import {
  Download,
  FolderOpen,
  FolderX,
  RefreshCw,
  Settings,
  FileText,
} from "lucide-react";
import {
  clearLinkedFolder,
  reauthorizeAndLoadCourses,
  rescanCoursesFolder,
  selectAndLoadCoursesFolder,
} from "../../lib/course-loader";
import {
  downloadPackagingGuide,
  writePackagingGuide,
} from "../../lib/local-courses";
import { applyCoursesResult } from "../../store/boot";
import { useAppStore } from "../../store/useAppStore";

export function SettingsMenu() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  const folderName = useAppStore((s) => s.folderName);
  const coursesPhase = useAppStore((s) => s.coursesPhase);
  const folderStatus = useAppStore((s) => s.folderStatus);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function run(action: () => Promise<void>, okMsg?: string) {
    setBusy(true);
    setMessage(null);
    try {
      await action();
      if (okMsg) setMessage(okMsg);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  const linked =
    Boolean(folderName) ||
    coursesPhase === "ready" ||
    coursesPhase === "needs-permission";

  return (
    <div className="settings-menu" ref={rootRef}>
      <button
        type="button"
        className="icon-btn"
        title="Settings"
        aria-label="Settings"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          setOpen((v) => !v);
          setMessage(null);
        }}
      >
        <Settings size={18} />
      </button>
      {open ? (
        <div id={panelId} className="settings-panel" role="menu">
          <div className="settings-panel-head">
            <span className="settings-panel-title">Courses folder</span>
            <span className="settings-panel-meta" title={folderName || undefined}>
              {folderName ? folderName : "Not selected"}
            </span>
          </div>

          <button
            type="button"
            className="settings-item"
            role="menuitem"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                const state = await selectAndLoadCoursesFolder();
                applyCoursesResult(state);
                if (state.wroteGuide) {
                  setMessage("Folder linked. COURSE_TEMPLATE.md saved.");
                } else if (state.phase === "ready") {
                  setMessage(
                    state.courses.length
                      ? `Loaded ${state.courses.length} course(s).`
                      : "Folder linked. No courses found yet."
                  );
                } else if (state.error) {
                  setMessage(state.error);
                }
              })
            }
          >
            <FolderOpen size={16} aria-hidden />
            {folderName ? "Change folder…" : "Choose folder…"}
          </button>

          {coursesPhase === "needs-permission" ? (
            <button
              type="button"
              className="settings-item"
              role="menuitem"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  const state = await reauthorizeAndLoadCourses();
                  applyCoursesResult(state);
                  setMessage(
                    state.phase === "ready"
                      ? "Access granted."
                      : state.error || "Still needs permission."
                  );
                })
              }
            >
              <RefreshCw size={16} aria-hidden />
              Allow access…
            </button>
          ) : null}

          <button
            type="button"
            className="settings-item"
            role="menuitem"
            disabled={busy || !folderName || coursesPhase === "needs-permission"}
            onClick={() =>
              void run(async () => {
                const state = await rescanCoursesFolder();
                applyCoursesResult(state);
                setMessage(
                  state.phase === "ready"
                    ? `Rescanned — ${state.courses.length} course(s).`
                    : state.error || "Rescan finished."
                );
              })
            }
          >
            <RefreshCw size={16} aria-hidden />
            Rescan folder
          </button>

          <button
            type="button"
            className="settings-item"
            role="menuitem"
            disabled={busy || !folderName}
            onClick={() =>
              void run(async () => {
                try {
                  await writePackagingGuide();
                  setMessage("Saved COURSE_TEMPLATE.md to the folder.");
                } catch {
                  downloadPackagingGuide();
                  setMessage(
                    "Could not write to folder — downloaded COURSE_TEMPLATE.md instead."
                  );
                }
              })
            }
          >
            <FileText size={16} aria-hidden />
            Save packaging guide
          </button>

          <button
            type="button"
            className="settings-item"
            role="menuitem"
            disabled={busy}
            onClick={() => {
              downloadPackagingGuide();
              setMessage("Downloaded COURSE_TEMPLATE.md.");
            }}
          >
            <Download size={16} aria-hidden />
            Download packaging guide
          </button>

          {linked ? (
            <button
              type="button"
              className="settings-item settings-item-danger"
              role="menuitem"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  const state = await clearLinkedFolder();
                  applyCoursesResult(state);
                  setMessage("Folder link cleared.");
                })
              }
            >
              <FolderX size={16} aria-hidden />
              Clear folder link
            </button>
          ) : null}

          {folderStatus && !folderStatus.supported ? (
            <p className="settings-hint">
              Use Chrome or Edge on desktop for local folders.
            </p>
          ) : null}
          {message ? <p className="settings-hint">{message}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
