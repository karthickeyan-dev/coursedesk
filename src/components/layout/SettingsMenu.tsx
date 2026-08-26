import { useState } from "react";
import {
  Download,
  FileText,
  FolderOpen,
  FolderX,
  RefreshCw,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  clearLinkedFolder,
  reauthorizeAndLoadCourses,
  rescanCoursesFolder,
  selectAndLoadCoursesFolder,
} from "@/lib/course-loader";
import {
  downloadPackagingGuide,
  writePackagingGuide,
} from "@/lib/local-courses";
import { useBusyAction } from "@/lib/use-busy-action";
import { runFolderAction } from "@/store/boot";
import { useAppStore } from "@/store/useAppStore";

export function SettingsMenu() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { busy, run: runBusy } = useBusyAction();

  const folderName = useAppStore((s) => s.folderName);
  const coursesPhase = useAppStore((s) => s.coursesPhase);
  const folderStatus = useAppStore((s) => s.folderStatus);

  async function run(action: () => Promise<void>) {
    setMessage(null);
    try {
      await runBusy(action);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Action failed");
    }
  }

  const linked =
    Boolean(folderName) ||
    coursesPhase === "ready" ||
    coursesPhase === "needs-permission";

  /** Keep menu open so status messages remain visible after actions. */
  const keepOpen = (e: Event) => {
    e.preventDefault();
  };

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setMessage(null);
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="rounded-full text-tb-text hover:bg-tb-hover hover:text-tb-text focus-visible:ring-offset-tb"
          title="Settings"
          aria-label="Settings"
        >
          <Settings className="size-[18px]" strokeWidth={2} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[min(300px,calc(100vw-24px))] border-0 shadow-pop"
        sideOffset={8}
      >
        <DropdownMenuLabel className="flex flex-col gap-0.5 font-normal">
          <span className="text-[11px] font-medium tracking-[0.06em] text-muted-foreground uppercase">
            Courses folder
          </span>
          <span
            className="truncate text-sm font-medium"
            title={folderName || undefined}
          >
            {folderName ? folderName : "Not selected"}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem
          disabled={busy}
          onSelect={(e) => {
            keepOpen(e);
            void run(async () => {
              const state = await runFolderAction(selectAndLoadCoursesFolder);
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
            });
          }}
        >
          <FolderOpen className="size-4" aria-hidden />
          {folderName ? "Change folder…" : "Choose folder…"}
        </DropdownMenuItem>

        {coursesPhase === "needs-permission" ? (
          <DropdownMenuItem
            disabled={busy}
            onSelect={(e) => {
              keepOpen(e);
              void run(async () => {
                const state = await runFolderAction(reauthorizeAndLoadCourses);
                setMessage(
                  state.phase === "ready"
                    ? "Access granted."
                    : state.error || "Still needs permission."
                );
              });
            }}
          >
            <RefreshCw className="size-4" aria-hidden />
            Allow access…
          </DropdownMenuItem>
        ) : null}

        <DropdownMenuItem
          disabled={busy || !folderName || coursesPhase === "needs-permission"}
          onSelect={(e) => {
            keepOpen(e);
            void run(async () => {
              const state = await runFolderAction(rescanCoursesFolder);
              setMessage(
                state.phase === "ready"
                  ? `Rescanned — ${state.courses.length} course(s).`
                  : state.error || "Rescan finished."
              );
            });
          }}
        >
          <RefreshCw className="size-4" aria-hidden />
          Rescan folder
        </DropdownMenuItem>

        <DropdownMenuItem
          disabled={busy || !folderName}
          onSelect={(e) => {
            keepOpen(e);
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
            });
          }}
        >
          <FileText className="size-4" aria-hidden />
          Save packaging guide
        </DropdownMenuItem>

        <DropdownMenuItem
          disabled={busy}
          onSelect={(e) => {
            keepOpen(e);
            downloadPackagingGuide();
            setMessage("Downloaded COURSE_TEMPLATE.md.");
          }}
        >
          <Download className="size-4" aria-hidden />
          Download packaging guide
        </DropdownMenuItem>

        {linked ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={busy}
              className="text-destructive focus:text-destructive"
              onSelect={(e) => {
                keepOpen(e);
                void run(async () => {
                  await runFolderAction(clearLinkedFolder);
                  setMessage("Folder link cleared.");
                });
              }}
            >
              <FolderX className="size-4" aria-hidden />
              Clear folder link
            </DropdownMenuItem>
          </>
        ) : null}

        {folderStatus && !folderStatus.supported ? (
          <p className="px-2 py-1.5 text-xs leading-snug text-muted-foreground">
            Use Chrome or Edge on desktop for local folders.
          </p>
        ) : null}
        {message ? (
          <p className="px-2 py-1.5 text-xs leading-snug text-muted-foreground">
            {message}
          </p>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
