import { ChevronRight } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { sumLessonDurations } from "@/lib/assets";
import { formatDurationTotal } from "@/lib/format";
import type { Category, Lesson } from "@/types/course";
import { isLessonFinished } from "@/store/selectors";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";
import { CompletionCheck } from "@/components/ui/completion-check";
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

  const checkState = allDone ? true : someDone ? "indeterminate" : false;

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={(open) => setOpenCategory(open ? category.id : null)}
      className="block w-full border-b border-border"
      data-category-id={category.id}
    >
      <div className="grid w-full grid-cols-[22px_1fr_auto] items-start gap-2.5 bg-panel-2 px-4 py-3.5 pr-4 pl-3.5 text-text hover:bg-[color-mix(in_srgb,var(--text)_7%,var(--panel-2))]">
        <CompletionCheck
          className="mt-0.5"
          checked={checkState}
          title={allDone ? "Mark section incomplete" : "Mark section complete"}
          onClick={(e) => e.stopPropagation()}
          onCheckedChange={() =>
            toggleSectionFinished(lessons.map((l) => l.id))
          }
        />
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="col-span-2 grid w-full min-w-0 grid-cols-[1fr_auto] items-start gap-2.5 border-0 bg-transparent p-0 text-left text-inherit"
          >
            <span className="flex min-w-0 flex-col gap-1">
              <span className="text-sm leading-snug font-semibold">
                Section {sectionNumber}: {category.title}
              </span>
              <span className="text-left text-xs font-medium text-muted-2 tabular-nums">
                {metaText}
              </span>
            </span>
            <span className="mt-0.5 grid place-items-center">
              <ChevronRight
                size={16}
                strokeWidth={2}
                className={cn(
                  "block text-muted-2 transition-transform duration-150",
                  isOpen && "rotate-90"
                )}
                aria-hidden
              />
            </span>
          </button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="block w-full bg-elevated">
        {lessons.map((lesson) => (
          <LessonButton key={lesson.id} lesson={lesson} />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
