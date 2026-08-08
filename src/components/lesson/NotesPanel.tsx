import { useEffect, useRef } from "react";
import { renderNotesInto } from "../../lib/notes";
import { hasNotes } from "../../lib/notes";

export function NotesPanel({
  markdown,
}: {
  markdown: string | null | undefined;
}) {
  const ref = useRef<HTMLElement>(null);
  const empty = !hasNotes(markdown);

  useEffect(() => {
    if (!ref.current) return;
    renderNotesInto(ref.current, empty ? null : markdown);
  }, [markdown, empty]);

  return (
    <section
      className={`notes-panel${empty ? " is-empty" : ""}`}
      aria-label="Overview"
    >
      <article ref={ref} className="notes-body prose" />
    </section>
  );
}
