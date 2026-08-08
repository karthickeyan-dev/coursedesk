import { ChevronLeft, List, Moon, Sun } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { ProgressPill } from "./ProgressPill";
import { SettingsMenu } from "./SettingsMenu";

const iconBtn =
  "grid h-9 w-9 place-items-center rounded-full border-0 bg-transparent text-tb-text transition-colors hover:bg-tb-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export function Topbar() {
  const view = useAppStore((s) => s.view);
  const theme = useAppStore((s) => s.theme);
  const curriculumOpen = useAppStore((s) => s.curriculumOpen);
  const activeCourse = useAppStore((s) => s.activeCourse);
  const showLibrary = useAppStore((s) => s.showLibrary);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const setCurriculumOpen = useAppStore((s) => s.setCurriculumOpen);

  const inCourse = view === "course" && activeCourse;
  const title = inCourse
    ? activeCourse.data.title || activeCourse.meta.title || "Course"
    : "Your courses";
  const label = inCourse
    ? activeCourse.data.author || activeCourse.meta.author || "Course"
    : "CourseDesk";

  return (
    <header className="z-20 flex h-(--spacing-topbar) shrink-0 items-center justify-between gap-4 border-b border-tb-border bg-tb px-5 text-tb-text">
      <div className="flex min-w-0 items-center gap-3">
        {inCourse && (
          <button
            type="button"
            className={iconBtn}
            title="All courses"
            aria-label="Back to all courses"
            onClick={showLibrary}
          >
            <ChevronLeft size={18} />
          </button>
        )}
        <span
          className="grid h-7 w-7 shrink-0 place-items-center rounded-sm bg-accent text-xs font-bold text-white"
          aria-hidden="true"
        >
          ◆
        </span>
        <div className="min-w-0">
          <div className="text-[11px] leading-tight tracking-[0.06em] text-tb-muted uppercase">
            {label}
          </div>
          <h1 className="m-0 max-w-[min(52vw,520px)] truncate text-sm font-bold text-tb-text max-[979px]:max-w-[42vw]">
            {title}
          </h1>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <ProgressPill />
        <SettingsMenu />
        <button
          type="button"
          className={iconBtn}
          title={theme === "light" ? "Dark mode" : "Light mode"}
          aria-label={
            theme === "light" ? "Switch to dark theme" : "Switch to light theme"
          }
          onClick={toggleTheme}
        >
          {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
        </button>
        {inCourse && (
          <button
            type="button"
            className={iconBtn}
            title="Course content"
            aria-label="Toggle course content"
            aria-expanded={curriculumOpen}
            onClick={() => setCurriculumOpen(!curriculumOpen)}
          >
            <List size={20} />
          </button>
        )}
      </div>
    </header>
  );
}

export { iconBtn };
