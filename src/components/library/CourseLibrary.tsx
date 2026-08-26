import {
  reauthorizeAndLoadCourses,
  rescanCoursesFolder,
  selectAndLoadCoursesFolder,
} from "@/lib/course-loader";
import { useBusyAction } from "@/lib/use-busy-action";
import { runFolderAction } from "@/store/boot";
import { useAppStore } from "@/store/useAppStore";
import { CourseCard } from "./CourseCard";
import { EmptyCoursesState, type EmptyCoursesKind } from "./EmptyCoursesState";

const shell =
  "min-h-full bg-[radial-gradient(900px_360px_at_12%_-10%,var(--lib-glow-1),transparent_55%),radial-gradient(700px_280px_at_90%_10%,var(--lib-glow-2),transparent_50%),var(--bg)] px-6 pt-8 pb-12 max-sm:px-3.5 max-sm:pt-5 max-sm:pb-8";

export function CourseLibrary() {
  const courses = useAppStore((s) => s.courses);
  const coursesLoaded = useAppStore((s) => s.coursesLoaded);
  const coursesPhase = useAppStore((s) => s.coursesPhase);
  const coursesError = useAppStore((s) => s.coursesError);
  const folderName = useAppStore((s) => s.folderName);
  const { busy, run } = useBusyAction();

  const n = courses.length;

  if (!coursesLoaded) {
    return (
      <div className={shell}>
        <div className="mx-auto w-full max-w-[1200px]">
          <p className="m-0 max-w-[52ch] text-[0.95rem] leading-relaxed text-muted">
            Loading…
          </p>
        </div>
      </div>
    );
  }

  let emptyKind: EmptyCoursesKind | null = null;
  if (coursesPhase === "unsupported") emptyKind = "unsupported";
  else if (coursesPhase === "no-folder") emptyKind = "no-folder";
  else if (coursesPhase === "needs-permission") emptyKind = "needs-permission";
  else if (coursesPhase === "error") emptyKind = "error";
  else if (n === 0) emptyKind = "no-courses";

  if (emptyKind) {
    return (
      <div className={shell}>
        <div className="mx-auto w-full max-w-[1200px]">
          <EmptyCoursesState
            kind={emptyKind}
            folderName={folderName}
            error={coursesError}
            busy={busy}
            onChooseFolder={() => void run(() => runFolderAction(selectAndLoadCoursesFolder))}
            onAllowAccess={() => void run(() => runFolderAction(reauthorizeAndLoadCourses))}
            onRescan={() => void run(() => runFolderAction(rescanCoursesFolder))}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={shell}>
      <div className="mx-auto w-full max-w-[1200px]">
        <header className="mb-7 flex items-end justify-between gap-5 border-b border-border pb-5 max-sm:flex-col max-sm:items-start max-sm:gap-3.5">
          <div className="min-w-0">
            <h2 className="m-0 mb-2 text-[clamp(1.6rem,2.4vw,2rem)] leading-tight tracking-tight">
              Choose a course
            </h2>
            <p className="m-0 max-w-[52ch] text-[0.95rem] leading-relaxed text-muted">
              From{" "}
              <strong className="font-semibold text-text">
                {folderName || "your courses folder"}
              </strong>
              . Your progress is saved in this browser.
            </p>
          </div>
          <div className="shrink-0">
            <span className="inline-flex items-center rounded-full border border-border bg-panel px-3.5 py-2 text-[0.82rem] font-bold whitespace-nowrap text-muted tabular-nums">
              {`${n} course${n === 1 ? "" : "s"}`}
            </span>
          </div>
        </header>
        <div
          className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-x-[18px] gap-y-[22px] max-sm:grid-cols-[repeat(auto-fill,minmax(160px,1fr))] max-sm:gap-x-3 max-sm:gap-y-[18px]"
          role="list"
        >
          {courses.map((course, i) => (
            <CourseCard key={course.data.id} course={course} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
