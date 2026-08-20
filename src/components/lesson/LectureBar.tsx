import { Button } from "@/components/ui/button";
import { CompletionCheck } from "@/components/ui/completion-check";
import { categoryTitle } from "@/lib/assets";
import { useAppStore } from "@/store/useAppStore";

export function LectureBar() {
  const activeLessonId = useAppStore((s) => s.activeLessonId);
  const lessonsById = useAppStore((s) => s.lessonsById);
  const categories = useAppStore((s) => s.categories);
  const autoplay = useAppStore((s) => s.autoplay);
  const setAutoplay = useAppStore((s) => s.setAutoplay);

  const lesson = activeLessonId ? lessonsById[activeLessonId] : null;

  return (
    <section className="w-full border-b border-border bg-elevated px-4 py-[18px] sm:px-6">
      <div className="m-0 flex w-full items-start justify-between gap-4 max-[979px]:flex-col">
        <div className="min-w-0">
          <div className="mb-1 text-xs font-semibold tracking-[0.04em] text-muted-2 uppercase">
            {lesson ? categoryTitle(lesson, categories) : "Section"}
          </div>
          <h2 className="m-0 text-[1.15rem] leading-snug font-semibold tracking-tight">
            {lesson?.title || "Lecture title"}
          </h2>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 max-[979px]:w-full">
          <Button
            type="button"
            variant="outline"
            aria-pressed={autoplay}
            title={
              autoplay
                ? "Autoplay is on — the next lecture starts when this one ends"
                : "Autoplay is off — turn on to play the next lecture when this one ends"
            }
            onClick={() => setAutoplay(!autoplay)}
          >
            <CompletionCheck
              checked={autoplay}
              decorative
              className={
                autoplay
                  ? "data-[state=checked]:border-accent data-[state=checked]:bg-accent"
                  : "!border-[var(--btn-secondary-border)]"
              }
            />
            Autoplay
          </Button>
        </div>
      </div>
    </section>
  );
}
