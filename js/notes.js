/**
 * Markdown notes pipeline with optional notes + polished code blocks.
 */

const EMPTY_NOTES =
  '<p class="notes-empty">No notes for this lecture.</p>';
const RENDERER_UNAVAILABLE = "<p>Notes renderer unavailable.</p>";

const CALLOUT_PATTERNS = {
  any: /challenge|sdk\s*\d+|available only|tip|note:/i,
  challenge: /challenge/i,
  info: /available only|sdk/i,
};

function stripLeadingTitle(markdown) {
  return String(markdown || "").replace(/^#\s+[^\n]+\n+/, "");
}

function parseMarkdown(markdown) {
  const markedLib = window.marked;
  if (!markedLib || typeof markedLib.parse !== "function") {
    console.error("marked.js not loaded; cannot render notes.");
    return RENDERER_UNAVAILABLE;
  }
  return markedLib.parse(markdown, { gfm: true, breaks: false });
}

function openExternalLinks(root) {
  root.querySelectorAll('a[href^="http"]').forEach((anchor) => {
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
  });
}

function classifyCallout(blockquote) {
  const text = (blockquote.textContent || "").trim();
  if (!CALLOUT_PATTERNS.any.test(text)) return;

  blockquote.classList.add("callout");
  if (CALLOUT_PATTERNS.challenge.test(text)) {
    blockquote.classList.add("callout-challenge");
  } else if (CALLOUT_PATTERNS.info.test(text)) {
    blockquote.classList.add("callout-info");
  }
}

function enhanceCallouts(root) {
  root.querySelectorAll("blockquote").forEach(classifyCallout);
}

function languageFromClassList(codeEl) {
  const match = [...codeEl.classList].find((c) => c.startsWith("language-"));
  if (!match) return "";
  const lang = match.replace("language-", "");
  if (!lang || lang === "text" || lang === "plaintext" || lang === "txt") {
    return "";
  }
  return lang;
}

function decorateCodeBlock(pre, codeEl) {
  if (pre.parentElement && pre.parentElement.classList.contains("code-block")) {
    return;
  }

  const wrap = document.createElement("div");
  wrap.className = "code-block";

  const lang = languageFromClassList(codeEl);
  if (lang) {
    const badge = document.createElement("div");
    badge.className = "code-block-lang";
    badge.textContent = lang;
    wrap.appendChild(badge);
    wrap.dataset.lang = lang;
  }

  pre.parentNode.insertBefore(wrap, pre);
  wrap.appendChild(pre);
}

function highlightCodeBlocks(root) {
  const highlighter = window.hljs;
  const blocks = root.querySelectorAll("pre code");

  blocks.forEach((block) => {
    if (block.classList.contains("language-text")) {
      block.classList.replace("language-text", "language-plaintext");
    }

    if (highlighter && typeof highlighter.highlightElement === "function") {
      try {
        highlighter.highlightElement(block);
      } catch {
        /* unsupported language — keep plain text */
      }
    }

    if (block.parentElement && block.parentElement.tagName === "PRE") {
      decorateCodeBlock(block.parentElement, block);
    }
  });
}

/**
 * @param {HTMLElement} root
 * @param {string|null|undefined} markdownSource  null/empty → empty state
 */
export function renderNotesInto(root, markdownSource) {
  const has =
    typeof markdownSource === "string" && markdownSource.trim().length > 0;

  if (!has) {
    root.innerHTML = EMPTY_NOTES;
    return;
  }

  const markdown = stripLeadingTitle(markdownSource);
  root.innerHTML = parseMarkdown(markdown);
  openExternalLinks(root);
  enhanceCallouts(root);
  highlightCodeBlocks(root);
}

export function hasNotes(markdownSource) {
  return typeof markdownSource === "string" && markdownSource.trim().length > 0;
}
