import { useState } from "react";
import {
  reauthorizeAndLoadCourses,
  rescanCoursesFolder,
  selectAndLoadCoursesFolder,
} from "../../lib/course-loader";
import { applyCoursesResult } from "../../store/boot";
import { useAppStore } from "../../store/useAppStore";
import { CourseCard } from "./CourseCard";
import { EmptyCoursesState, type EmptyCoursesKind } from "./EmptyCoursesState";

export function CourseLibrary() {
  const courses = useAppStore((s) => s.courses);
  const coursesLoaded = useAppStore((s) => s.coursesLoaded);
  const coursesPhase = useAppStore((s) => s.coursesPhase);
  const coursesError = useAppStore((s) => s.coursesError);
  const folderName = useAppStore((s) => s.folderName);
  const [busy, setBusy] = useState(false);

  const n = courses.length;

  async function run(fn: () => ReturnType<typeof selectAndLoadCoursesFolder>) {
    setBusy(true);
    try {
      const state = await fn();
      applyCoursesResult(state);
    } finally {
      setBusy(false);
    }
  }

  if (!coursesLoaded) {
    return (
      <div className="welcome">
        <div className="library">
          <p className="library-lead">Loading…</p>
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
      <div className="welcome">
        <div className="library">
          <EmptyCoursesState
            kind={emptyKind}
            folderName={folderName}
            error={coursesError}
            busy={busy}
            onChooseFolder={() => void run(selectAndLoadCoursesFolder)}
            onAllowAccess={() => void run(reauthorizeAndLoadCourses)}
            onRescan={() => void run(rescanCoursesFolder)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="welcome">
      <div className="library">
        <header className="library-header">
          <div className="library-header-text">
            <p className="welcome-kicker">CourseDesk</p>
            <h2>Choose a course</h2>
            <p className="library-lead">
              From{" "}
              <strong className="library-folder-name">
                {folderName || "your courses folder"}
              </strong>
              . Your progress is saved in this browser.
            </p>
          </div>
          <div className="library-header-meta">
            <span className="library-count">
              {`${n} course${n === 1 ? "" : "s"}`}
            </span>
          </div>
        </header>
        <div className="course-picker" role="list">
          {courses.map((course, i) => (
            <CourseCard key={course.data.id} course={course} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
