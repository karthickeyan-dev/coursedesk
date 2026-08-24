import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderNotesInto } from "../lib/notes";

function render(md: string): HTMLElement {
  const root = document.createElement("article");
  root.className = "prose";
  document.body.appendChild(root);
  renderNotesInto(root, md);
  return root;
}

describe("notes code-block copy", () => {
  const writeText = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    writeText.mockClear();
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.useRealTimers();
  });

  it("adds a copy button and language badge to a fenced block", () => {
    const root = render("```js\nconst x = 1;\n```");
    const block = root.querySelector(".code-block");
    expect(block).toBeTruthy();
    expect(block?.querySelector(".code-block-lang")?.textContent).toBe("js");
    const btn = block?.querySelector<HTMLButtonElement>(".code-block-copy");
    expect(btn).toBeTruthy();
    expect(btn?.getAttribute("aria-label")).toBe("Copy code");
    expect(btn?.textContent).toContain("Copy");
  });

  it("adds a copy button when the fence has no language", () => {
    const root = render("```\nplain\n```");
    expect(root.querySelector(".code-block-lang")).toBeNull();
    expect(root.querySelector(".code-block-copy")).toBeTruthy();
  });

  it("hides the language badge when the fence language is undefined", () => {
    const root = render("```undefined\nplain\n```");
    expect(root.querySelector(".code-block-lang")).toBeNull();
    expect(root.querySelector(".code-block-copy")).toBeTruthy();
  });

  it("does not add a copy button for inline code", () => {
    const root = render("Use `npm start` to run.");
    expect(root.querySelector(".code-block-copy")).toBeNull();
    expect(root.querySelector("code")).toBeTruthy();
  });

  it("copies the code text and shows a Copied state", async () => {
    vi.useFakeTimers();
    const root = render("```js\nconst x = 1;\n```");
    const btn = root.querySelector<HTMLButtonElement>(".code-block-copy");
    expect(btn).toBeTruthy();
    btn?.click();
    await Promise.resolve();
    await Promise.resolve();
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText.mock.calls[0][0].trim()).toBe("const x = 1;");
    expect(btn?.getAttribute("aria-label")).toBe("Copied");
    expect(btn?.textContent).toContain("Copied");

    await vi.advanceTimersByTimeAsync(2000);
    expect(btn?.getAttribute("aria-label")).toBe("Copy code");
    expect(btn?.textContent).toContain("Copy");
  });
});
