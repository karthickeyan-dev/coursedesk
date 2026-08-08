import { Check, ChevronRight } from "lucide-react";
import { sumLessonDurations } from "../../lib/assets";
import { formatDurationTotal } from "../../lib/format";
import type { Category, Lesson } from "../../types/course";
import { isLessonFinished } from "../../store/selectors";
import { useAppStore } from "../../store/useAppStore";
import { LessonButton } from "./LessonButton";

const checkBase =
  "mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border-2 border-[var(--check-border)] bg-transparent text-transparent transition-[border-color,background,color] duration-100";

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
    <div className="border-b border-border" data-category-id={category.id}>
      <button
        type="button"
        className="grid w-full grid-cols-[22px_1fr_auto] items-start gap-2.5 border-0 bg-panel-2 px-4 py-3.5 pr-4 pl-3.5 text-left text-text hover:bg-[color-mix(in_srgb,var(--text)_7%,var(--panel-2))]"
        aria-expanded={isOpen}
        onClick={() => setOpenCategory(isOpen ? null : category.id)}
      >
        <span
          className={[
            checkBase,
            allDone
              ? "border-ok bg-ok text-[var(--check-mark)]"
              : someDone
                ? "border-ok bg-[color-mix(in_srgb,var(--ok)_22%,var(--panel-2))] text-ok"
                : "hover:border-[color-mix(in_srgb,var(--check-border)_45%,var(--text))]",
          ].join(" ")}
          role="checkbox"
          aria-checked={allDone ? "true" : someDone ? "mixed" : "false"}
          title={allDone ? "Mark section incomplete" : "Mark section complete"}
          onClick={(e) => {
            e.stopPropagation();
            toggleSectionFinished(lessons.map((l) => l.id));
          }}
        >
          <Check size={10} className="block" />
        </span>
        <span className="flex min-w-0 flex-col gap-1">
          <span className="text-sm leading-snug font-bold">
            Section {sectionNumber}: {category.title}
          </span>
          <span className="text-left text-xs font-medium text-muted-2 tabular-nums">
            {metaText}
          </span>
        </span>
        <span className="mt-0.5 grid place-items-center">
          <ChevronRight
            size={16}
            className={[
              "text-muted-2 transition-transform duration-150",
              isOpen ? "rotate-90" : "",
            ].join(" ")}
          />
        </span>
      </button>
      <div className={isOpen ? "block bg-elevated" : "hidden"}>
        {lessons.map((lesson) => (
          <LessonButton key={lesson.id} lesson={lesson} />
        ))}
      </div>
    </div>
  );
}
