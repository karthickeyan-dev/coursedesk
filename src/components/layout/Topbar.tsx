import { ChevronLeft, List, Moon, Sun } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { ProgressPill } from "./ProgressPill";

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
    <header className="topbar">
      <div className="topbar-left">
        {inCourse && (
          <button
            type="button"
            className="icon-btn"
            title="All courses"
            aria-label="Back to all courses"
            onClick={showLibrary}
          >
            <ChevronLeft size={18} />
          </button>
        )}
        <span className="logo" aria-hidden="true">
          ◆
        </span>
        <div className="topbar-titles">
          <div className="course-label">{label}</div>
          <h1 className="course-title">{title}</h1>
        </div>
      </div>
      <div className="topbar-right">
        <ProgressPill />
        <button
          type="button"
          className="icon-btn"
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
            className="icon-btn curriculum-toggle"
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
