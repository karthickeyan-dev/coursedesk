import { useEffect, useRef, useState, type ReactNode } from "react";
import { hasNotes } from "@/lib/notes";
import { Markdown, type MarkdownComponentProps } from "@tanstack/markdown/react";
import { createHighlighter } from "@tanstack/highlight/core";
import { createTanStackMarkdownHighlighter } from "@tanstack/highlight/markdown";
import { css } from "@tanstack/highlight/languages/css";
import { html } from "@tanstack/highlight/languages/html";
import { js } from "@tanstack/highlight/languages/js";
import { ts } from "@tanstack/highlight/languages/ts";
import { tsx } from "@tanstack/highlight/languages/tsx";
import { json } from "@tanstack/highlight/languages/json";
import { markdown as mdLang } from "@tanstack/highlight/languages/markdown";
import { shell } from "@tanstack/highlight/languages/shell";
import { plaintext } from "@tanstack/highlight/languages/plaintext";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

const highlighter = createHighlighter({
  languages: [css, html, js, ts, tsx, json, mdLang, shell, plaintext],
});
const markdownHighlighter = createTanStackMarkdownHighlighter(highlighter);

const CALLOUT = {
  any: /challenge|sdk\s*\d+|available only|tip|note:/i,
  challenge: /challenge/i,
  info: /available only|sdk/i,
};

function extractText(node: ReactNode): string {
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (node && typeof node === "object" && "props" in node) {
    const props = node.props as { children?: ReactNode };
    if (props.children) {
      return extractText(props.children);
    }
  }
  return "";
}

function CustomBlockquote({ children, className, ...props }: MarkdownComponentProps<"blockquote">) {
  const text = extractText(children);
  let calloutClass = "";
  if (CALLOUT.any.test(text)) {
    calloutClass = "callout ";
    if (CALLOUT.challenge.test(text)) calloutClass += "callout-challenge";
    else if (CALLOUT.info.test(text)) calloutClass += "callout-info";
  }
  return (
    <blockquote className={cn(className, calloutClass)} {...props}>
      {children}
    </blockquote>
  );
}

function CustomLink({ href, children, ...props }: MarkdownComponentProps<"a">) {
  const isExternal = href?.startsWith("http");
  return (
    <a href={href} target={isExternal ? "_blank" : undefined} rel={isExternal ? "noopener noreferrer" : undefined} {...props}>
      {children}
    </a>
  );
}

function CopyButton({ getRef }: { getRef: () => HTMLElement | null }) {
  const [copied, setCopied] = useState(false);
  
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const handleCopy = async () => {
    const el = getRef();
    if (!el) return;
    const text = el.textContent ?? "";
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
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
        if (ok) setCopied(true);
      } catch {
        // ignore
      }
    }
  };

  return (
    <button
      type="button"
      className="code-block-copy"
      data-copied={copied}
      onClick={handleCopy}
      aria-label={copied ? "Copied" : "Copy code"}
      title={copied ? "Copied" : "Copy code"}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      <span>{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}

function CustomPre({ children, className, ...props }: MarkdownComponentProps<"pre">) {
  const preRef = useRef<HTMLPreElement>(null);
  const isCode = children && typeof children === "object" && "type" in children && children.type === "code";
  const codeProps = isCode ? (children.props as { className?: string }) : {};
  const langClass = codeProps.className || "";
  const lang = langClass.replace("language-", "").replace("tm-code", "").trim();

  return (
    <div className="code-block" data-lang={lang || undefined}>
      <div className="code-block-header">
        {lang && <span className="code-block-lang">{lang}</span>}
        <CopyButton getRef={() => preRef.current} />
      </div>
      <pre ref={preRef} className={cn("tm-code", className)} {...props}>
        {children}
      </pre>
    </div>
  );
}

export function NotesPanel({
  markdown,
}: {
  markdown: string | null | undefined;
}) {
  const empty = !hasNotes(markdown);

  if (empty) return null;

  // Remove leading h1
  const md = String(markdown).replace(/^#\s+[^\n]+\n+/, "");

  return (
    <section
      className="border-b border-border bg-elevated"
      aria-label="Overview"
    >
      <article className="prose mx-auto w-full max-w-[760px] px-[22px] pt-6 pb-12">
        <Markdown 
          highlighter={markdownHighlighter}
          components={{
            blockquote: CustomBlockquote,
            a: CustomLink,
            pre: CustomPre,
          }}
        >
          {md}
        </Markdown>
      </article>
    </section>
  );
}
