import { Check, ChevronRight } from "lucide-react";
import { formatDurationTotal } from "../../lib/format";
import { sumLessonDurations } from "../../lib/assets";
import type { Category, Lesson } from "../../types/course";
import {
  isLessonFinished,
  useAppStore,
} from "../../store/useAppStore";
import { LessonButton } from "./LessonButton";

export function CategorySection({
  category,
  sectionNumber,
  lessons,
}: {
  category: Category;
  sectionNumber: number;
  lessons: Lesson[];
}) {
  const openCategoryId = useAppStore((s) => s.openCategoryId);
  const completedLessonIds = useAppStore((s) => s.completedLessonIds);
  const setOpenCategory = useAppStore((s) => s.setOpenCategory);
  const toggleSectionFinished = useAppStore((s) => s.toggleSectionFinished);

  const isOpen = openCategoryId === category.id;
  const done = lessons.filter((l) =>
    isLessonFinished(completedLessonIds, l.id)
  ).length;
  const seconds = sumLessonDurations(lessons);
  const allDone = done === lessons.length && lessons.length > 0;
  const someDone = done > 0 && !allDone;
  const metaText = seconds
    ? `${done}/${lessons.length} · ${formatDurationTotal(seconds)}`
    : `${done}/${lessons.length}`;

  return (
    <div
      className={`category${isOpen ? " open" : ""}`}
      data-category-id={category.id}
    >
      <button
        type="button"
        className={`category-toggle${allDone ? " done" : ""}${someDone ? " partial" : ""}`}
        aria-expanded={isOpen}
        onClick={() =>
          setOpenCategory(isOpen ? null : category.id)
        }
      >
        <span
          className="check section-check"
          role="checkbox"
          aria-checked={allDone ? "true" : someDone ? "mixed" : "false"}
          title={allDone ? "Mark section incomplete" : "Mark section complete"}
          onClick={(e) => {
            e.stopPropagation();
            toggleSectionFinished(lessons.map((l) => l.id));
          }}
        >
          <Check size={10} />
        </span>
        <span className="category-text">
          <span className="label">
            Section {sectionNumber}: {category.title}
          </span>
          <span className="meta">{metaText}</span>
        </span>
        <span className="category-chevron">
          <ChevronRight size={16} className="chev" />
        </span>
      </button>
      <div className="category-lessons">
        {lessons.map((lesson) => (
          <LessonButton key={lesson.id} lesson={lesson} />
        ))}
      </div>
    </div>
  );
}
