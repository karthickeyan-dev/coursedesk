/** Small DOM helpers — produce the same elements/classes the CSS expects. */

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  opts: {
    className?: string;
    text?: string;
    html?: string;
    attrs?: Record<string, string | boolean | null | undefined>;
    on?: Partial<{ [E in keyof HTMLElementEventMap]: (ev: HTMLElementEventMap[E]) => void }>;
    children?: (Node | string | null | undefined)[];
  } = {}
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (opts.className) node.className = opts.className;
  if (opts.text != null) node.textContent = opts.text;
  if (opts.html != null) node.innerHTML = opts.html;
  if (opts.attrs) {
    for (const [key, value] of Object.entries(opts.attrs)) {
      if (value == null || value === false) continue;
      if (value === true) node.setAttribute(key, "");
      else node.setAttribute(key, value);
    }
  }
  if (opts.on) {
    for (const [type, handler] of Object.entries(opts.on)) {
      if (handler) node.addEventListener(type, handler as EventListener);
    }
  }
  if (opts.children) {
    for (const child of opts.children) {
      if (child == null) continue;
      node.append(typeof child === "string" ? child : child);
    }
  }
  return node;
}

export function qs<T extends Element = HTMLElement>(
  sel: string,
  root: ParentNode = document
): T | null {
  return root.querySelector(sel) as T | null;
}

export function id<T extends HTMLElement = HTMLElement>(elementId: string): T {
  const node = document.getElementById(elementId);
  if (!node) throw new Error(`Missing #${elementId}`);
  return node as T;
}

export function idOpt<T extends HTMLElement = HTMLElement>(
  elementId: string
): T | null {
  return document.getElementById(elementId) as T | null;
}

export function setText(node: Element | null | undefined, text: string): void {
  if (node) node.textContent = text;
}

export function toggleClass(
  node: Element | null | undefined,
  className: string,
  on: boolean
): void {
  node?.classList.toggle(className, on);
}
