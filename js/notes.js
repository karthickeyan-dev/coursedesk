/**
 * Markdown notes pipeline with optional notes + polished code blocks.
 */
(function (global) {
  "use strict";

  var ns = (global.CourseDesk = global.CourseDesk || {});

  var EMPTY_NOTES =
    '<p class="notes-empty">No notes for this lecture.</p>';
  var RENDERER_UNAVAILABLE = "<p>Notes renderer unavailable.</p>";

  var CALLOUT_PATTERNS = {
    any: /challenge|sdk\s*\d+|available only|tip|note:/i,
    challenge: /challenge/i,
    info: /available only|sdk/i,
  };

  function stripLeadingTitle(markdown) {
    return String(markdown || "").replace(/^#\s+[^\n]+\n+/, "");
  }

  function parseMarkdown(markdown) {
    var markedLib = window.marked;
    if (!markedLib || typeof markedLib.parse !== "function") {
      console.error("marked.js not loaded; cannot render notes.");
      return RENDERER_UNAVAILABLE;
    }
    return markedLib.parse(markdown, { gfm: true, breaks: false });
  }

  function openExternalLinks(root) {
    root.querySelectorAll('a[href^="http"]').forEach(function (anchor) {
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
    });
  }

  function classifyCallout(blockquote) {
    var text = (blockquote.textContent || "").trim();
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
    var match = Array.from(codeEl.classList).find(function (c) {
      return c.startsWith("language-");
    });
    if (!match) return "";
    var lang = match.replace("language-", "");
    if (!lang || lang === "text" || lang === "plaintext" || lang === "txt") {
      return "";
    }
    return lang;
  }

  function decorateCodeBlock(pre, codeEl) {
    if (pre.parentElement && pre.parentElement.classList.contains("code-block")) {
      return;
    }

    var wrap = document.createElement("div");
    wrap.className = "code-block";

    var lang = languageFromClassList(codeEl);
    if (lang) {
      var badge = document.createElement("div");
      badge.className = "code-block-lang";
      badge.textContent = lang;
      wrap.appendChild(badge);
      wrap.dataset.lang = lang;
    }

    pre.parentNode.insertBefore(wrap, pre);
    wrap.appendChild(pre);
  }

  function highlightCodeBlocks(root) {
    var highlighter = window.hljs;
    var blocks = root.querySelectorAll("pre code");

    blocks.forEach(function (block) {
      if (block.classList.contains("language-text")) {
        block.classList.replace("language-text", "language-plaintext");
      }

      if (highlighter && typeof highlighter.highlightElement === "function") {
        try {
          highlighter.highlightElement(block);
        } catch (e) {
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
  function renderNotesInto(root, markdownSource) {
    var has =
      typeof markdownSource === "string" && markdownSource.trim().length > 0;

    if (!has) {
      root.innerHTML = EMPTY_NOTES;
      return;
    }

    var markdown = stripLeadingTitle(markdownSource);
    root.innerHTML = parseMarkdown(markdown);
    openExternalLinks(root);
    enhanceCallouts(root);
    highlightCodeBlocks(root);
  }

  function hasNotes(markdownSource) {
    return typeof markdownSource === "string" && markdownSource.trim().length > 0;
  }

  ns.renderNotesInto = renderNotesInto;
  ns.hasNotes = hasNotes;
})(window);
