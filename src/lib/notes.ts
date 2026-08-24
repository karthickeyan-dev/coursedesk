import { marked } from "marked";
import hljs from "highlight.js/lib/common";

const CALLOUT = {
  any: /challenge|sdk\s*\d+|available only|tip|note:/i,
  challenge: /challenge/i,
  info: /available only|sdk/i,
};

const SVG_NS = "http://www.w3.org/2000/svg";
const COPY_RESET_MS = 2000;
const SKIP_LANG = new Set(["", "text", "plaintext", "txt", "undefined", "null"]);

export function hasNotes(src: string | null | undefined): boolean {
  return typeof src === "string" && src.trim().length > 0;
}

export function renderNotesInto(
  root: HTMLElement,
  markdownSource: string | null | undefined
): void {
  if (!hasNotes(markdownSource)) {
    root.innerHTML = "";
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
    const lang = languageFromBlock(block);
    if (!lang) {
      const langClass = Array.from(block.classList).find((c) => c.startsWith("language-"));
      if (langClass && langClass !== "language-plaintext") {
        block.classList.replace(langClass, "language-plaintext");
      }
    }
    try {
      hljs.highlightElement(block as HTMLElement);
    } catch {
      /* ignore */
    }
    wrapCodeBlock(block as HTMLElement, lang);
  });
}

function wrapCodeBlock(block: HTMLElement, lang: string): void {
  const pre = block.parentElement;
  if (pre?.tagName !== "PRE") return;
  if (pre.parentElement?.classList.contains("code-block")) return;

  const wrap = document.createElement("div");
  wrap.className = "code-block";

  const header = document.createElement("div");
  header.className = "code-block-header";

  if (lang) {
    const badge = document.createElement("span");
    badge.className = "code-block-lang";
    badge.textContent = lang;
    header.appendChild(badge);
    wrap.dataset.lang = lang;
  }

  header.appendChild(createCopyButton(block));
  wrap.appendChild(header);
  pre.parentNode?.insertBefore(wrap, pre);
  wrap.appendChild(pre);
}

function languageFromBlock(block: Element): string {
  const langClass = Array.from(block.classList).find((c) => c.startsWith("language-"));
  const lang = langClass?.replace("language-", "") || "";
  return SKIP_LANG.has(lang.toLowerCase()) ? "" : lang;
}

function createCopyButton(block: HTMLElement): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "code-block-copy";
  setCopyButtonState(btn, false);

  let resetTimer: ReturnType<typeof setTimeout> | undefined;

  btn.addEventListener("click", async () => {
    const text = block.textContent ?? "";
    const ok = await copyText(text);
    if (!ok) return;
    setCopyButtonState(btn, true);
    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => {
      if (!btn.isConnected) return;
      setCopyButtonState(btn, false);
    }, COPY_RESET_MS);
  });

  return btn;
}

function setCopyButtonState(btn: HTMLButtonElement, copied: boolean): void {
  btn.dataset.copied = copied ? "true" : "false";
  const label = copied ? "Copied" : "Copy code";
  btn.setAttribute("aria-label", label);
  btn.title = label;
  btn.replaceChildren(copied ? checkIcon() : copyIcon(), labelSpan(copied ? "Copied" : "Copy"));
}

function labelSpan(text: string): HTMLSpanElement {
  const span = document.createElement("span");
  span.textContent = text;
  return span;
}

function lucideSvg(): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", "14");
  svg.setAttribute("height", "14");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");
  return svg;
}

function copyIcon(): SVGSVGElement {
  const svg = lucideSvg();
  const rect = document.createElementNS(SVG_NS, "rect");
  rect.setAttribute("width", "14");
  rect.setAttribute("height", "14");
  rect.setAttribute("x", "8");
  rect.setAttribute("y", "8");
  rect.setAttribute("rx", "2");
  rect.setAttribute("ry", "2");
  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("d", "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2");
  svg.append(rect, path);
  return svg;
}

function checkIcon(): SVGSVGElement {
  const svg = lucideSvg();
  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("d", "M20 6 9 17l-5-5");
  svg.append(path);
  return svg;
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}
