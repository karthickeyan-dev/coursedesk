import { useAppStore } from "../../store/useAppStore";
import { CourseCard } from "./CourseCard";

export function CourseLibrary() {
  const courses = useAppStore((s) => s.courses);
  const coursesLoaded = useAppStore((s) => s.coursesLoaded);
  const n = courses.length;

  return (
    <div className="welcome">
      <div className="library">
        <header className="library-header">
          <div className="library-header-text">
            <p className="welcome-kicker">CourseDesk</p>
            <h2>Choose a course</h2>
            <p className="library-lead">
              Your local course player. Progress is saved per course in this
              browser. Videos and notes are optional for each lecture.
            </p>
          </div>
          <div className="library-header-meta">
            <span className="library-count">
              {coursesLoaded
                ? `${n} course${n === 1 ? "" : "s"}`
                : "Loading…"}
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
