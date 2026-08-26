import { sumLessonDurations } from "@/lib/assets";
import { formatDurationTotal } from "@/lib/format";
import type { Category, Lesson } from "@/types/course";
import { isLessonFinished } from "@/store/selectors";
import { useAppStore } from "@/store/useAppStore";
import { CompletionCheck } from "@/components/ui/completion-check";
import { LessonButton } from "./LessonButton";
import { SidebarGroup } from "./SidebarGroup";

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
  const done = lessons.filter((l) => isLessonFinished(completedLessonIds, l.id)).length;
  const seconds = sumLessonDurations(lessons);
  const allDone = done === lessons.length && lessons.length > 0;
  const someDone = done > 0 && !allDone;
  const metaText = seconds
    ? `${done}/${lessons.length} · ${formatDurationTotal(seconds)}`
    : `${done}/${lessons.length}`;

  const checkState = allDone ? true : someDone ? "indeterminate" : false;

  return (
    <SidebarGroup
      open={isOpen}
      onOpenChange={(open) => setOpenCategory(open ? category.id : null)}
      title={`Section ${sectionNumber}: ${category.title}`}
      meta={metaText}
      dataCategoryId={category.id}
      leading={
        <CompletionCheck
          className="pointer-events-auto mt-0.5"
          checked={checkState}
          title={allDone ? "Mark section incomplete" : "Mark section complete"}
          onClick={(e) => e.stopPropagation()}
          onCheckedChange={() => toggleSectionFinished(lessons.map((l) => l.id))}
        />
      }
    >
      {lessons.map((lesson) => (
        <LessonButton key={lesson.id} lesson={lesson} />
      ))}
    </SidebarGroup>
  );
}
