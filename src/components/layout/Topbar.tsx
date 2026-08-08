import { ChevronLeft, List, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/useAppStore";
import { ProgressPill } from "./ProgressPill";
import { SettingsMenu } from "./SettingsMenu";

/** Icon buttons on the always-dark topbar */
const topbarIcon =
  "rounded-full text-tb-text hover:bg-tb-hover hover:text-tb-text focus-visible:ring-offset-tb";

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
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={topbarIcon}
            title="All courses"
            aria-label="Back to all courses"
            onClick={showLibrary}
          >
            <ChevronLeft className="size-[18px]" strokeWidth={2} />
          </Button>
        )}
        <span
          className="grid h-7 w-7 shrink-0 place-items-center rounded-sm bg-primary text-xs font-semibold text-primary-foreground"
          aria-hidden="true"
        >
          ◆
        </span>
        <div className="min-w-0">
          <div className="text-[11px] leading-tight tracking-[0.06em] text-tb-muted uppercase">
            {label}
          </div>
          <h1 className="m-0 max-w-[min(52vw,520px)] truncate text-sm font-semibold text-tb-text max-[979px]:max-w-[42vw]">
            {title}
          </h1>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <ProgressPill />
        <SettingsMenu />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={topbarIcon}
          title={theme === "light" ? "Dark mode" : "Light mode"}
          aria-label={
            theme === "light" ? "Switch to dark theme" : "Switch to light theme"
          }
          onClick={toggleTheme}
        >
          {theme === "light" ? (
            <Moon className="size-[18px]" strokeWidth={2} />
          ) : (
            <Sun className="size-[18px]" strokeWidth={2} />
          )}
        </Button>
        {inCourse && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={topbarIcon}
            title="Course content"
            aria-label="Toggle course content"
            aria-expanded={curriculumOpen}
            onClick={() => setCurriculumOpen(!curriculumOpen)}
          >
            <List className="size-[18px]" strokeWidth={2} />
          </Button>
        )}
      </div>
    </header>
  );
}
