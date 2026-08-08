import { useEffect, useRef } from "react";
import { hasNotes, renderNotesInto } from "@/lib/notes";

export function NotesPanel({
  markdown,
}: {
  markdown: string | null | undefined;
}) {
  const ref = useRef<HTMLElement>(null);
  const empty = !hasNotes(markdown);

  useEffect(() => {
    if (!ref.current || empty) return;
    renderNotesInto(ref.current, markdown);
  }, [markdown, empty]);

  // Empty notes are not rendered here — LessonView shows a combined
  // empty state only when both video and notes are missing.
  if (empty) return null;

  return (
    <section
      className="border-b border-border bg-elevated"
      aria-label="Overview"
    >
      <article
        ref={ref}
        className="prose mx-auto w-full max-w-[760px] px-[22px] pt-6 pb-12"
      />
    </section>
  );
}
