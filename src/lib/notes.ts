import { marked } from "marked";
import hljs from "highlight.js/lib/common";

const EMPTY = '<p class="notes-empty">No notes for this lecture.</p>';

const CALLOUT = {
  any: /challenge|sdk\s*\d+|available only|tip|note:/i,
  challenge: /challenge/i,
  info: /available only|sdk/i,
};

export function hasNotes(src: string | null | undefined): boolean {
  return typeof src === "string" && src.trim().length > 0;
}

export function renderNotesInto(
  root: HTMLElement,
  markdownSource: string | null | undefined
): void {
  if (!hasNotes(markdownSource)) {
    root.innerHTML = EMPTY;
    return;
  }

  const md = String(markdownSource).replace(/^#\s+[^\n]+\n+/, "");
  root.innerHTML = marked.parse(md, { gfm: true, breaks: false }) as string;

  root.querySelectorAll('a[href^="http"]').forEach((a) => {
    const el = a as HTMLAnchorElement;
    el.target = "_blank";
    el.rel = "noopener noreferrer";
  });

  root.querySelectorAll("blockquote").forEach((bq) => {
    const text = (bq.textContent || "").trim();
    if (!CALLOUT.any.test(text)) return;
    bq.classList.add("callout");
    if (CALLOUT.challenge.test(text)) bq.classList.add("callout-challenge");
    else if (CALLOUT.info.test(text)) bq.classList.add("callout-info");
  });

  root.querySelectorAll("pre code").forEach((block) => {
    if (block.classList.contains("language-text")) {
      block.classList.replace("language-text", "language-plaintext");
    }
    try {
      hljs.highlightElement(block as HTMLElement);
    } catch {
      /* ignore */
    }
    const pre = block.parentElement;
    if (pre?.tagName !== "PRE") return;
    if (pre.parentElement?.classList.contains("code-block")) return;

    const wrap = document.createElement("div");
    wrap.className = "code-block";
    const langClass = Array.from(block.classList).find((c) =>
      c.startsWith("language-")
    );
    const lang = langClass?.replace("language-", "") || "";
    if (lang && lang !== "text" && lang !== "plaintext" && lang !== "txt") {
      const badge = document.createElement("div");
      badge.className = "code-block-lang";
      badge.textContent = lang;
      wrap.appendChild(badge);
      wrap.dataset.lang = lang;
    }
    pre.parentNode?.insertBefore(wrap, pre);
    wrap.appendChild(pre);
  });
}
