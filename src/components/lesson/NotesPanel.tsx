import { useEffect, useRef } from "react";
import { hasNotes, renderNotesInto } from "../../lib/notes";

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
      className={[
        "border-b border-border bg-elevated",
        empty ? "opacity-90" : "",
      ].join(" ")}
      aria-label="Overview"
    >
      <article
        ref={ref}
        className="prose mx-auto w-full max-w-[760px] px-[22px] pt-6 pb-12"
      />
    </section>
  );
}
