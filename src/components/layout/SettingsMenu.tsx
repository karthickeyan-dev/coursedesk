import { useEffect, useId, useRef, useState } from "react";
import {
  Download,
  FileText,
  FolderOpen,
  FolderX,
  RefreshCw,
  Settings,
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
import { iconBtn } from "./Topbar";

const menuItem =
  "flex w-full cursor-pointer items-center gap-2.5 rounded-lg border-0 bg-transparent px-2.5 py-2.5 text-left text-[13px] font-semibold text-text hover:bg-panel-2 disabled:cursor-not-allowed disabled:opacity-40";

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
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        className={iconBtn}
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
        <div
          id={panelId}
          className="absolute top-[calc(100%+8px)] right-0 z-[60] flex w-[min(300px,calc(100vw-24px))] flex-col gap-1 rounded-md border border-border bg-elevated p-2.5 text-text shadow-pop"
          role="menu"
        >
          <div className="mb-1 flex flex-col gap-0.5 border-b border-border px-2 pt-1.5 pb-2.5">
            <span className="text-[11px] font-bold tracking-[0.06em] text-muted-2 uppercase">
              Courses folder
            </span>
            <span
              className="truncate text-[13px] font-semibold text-text"
              title={folderName || undefined}
            >
              {folderName ? folderName : "Not selected"}
            </span>
          </div>

          <button
            type="button"
            className={menuItem}
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
              className={menuItem}
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
            className={menuItem}
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
            className={menuItem}
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
            className={menuItem}
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
              className={`${menuItem} text-danger`}
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
            <p className="mx-1 mt-1.5 mb-0.5 text-xs leading-snug text-muted">
              Use Chrome or Edge on desktop for local folders.
            </p>
          ) : null}
          {message ? (
            <p className="mx-1 mt-1.5 mb-0.5 text-xs leading-snug text-muted">
              {message}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
