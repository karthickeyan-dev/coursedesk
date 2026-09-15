# scroll-area

2026-09-15, transformation engine (legacy new-york style without Base UI registry equivalent), successfully migrated to `@base-ui/react` ScrollArea primitives.

## Changed

- `src/components/ui/scroll-area.tsx`:
  - Replaced `@radix-ui/react-scroll-area` with `import { ScrollArea as ScrollAreaPrimitive } from "@base-ui/react/scroll-area"`.
  - Wired up `ScrollAreaPrimitive.Root` (`ScrollArea.Root`), `ScrollAreaPrimitive.Viewport` (`ScrollArea.Viewport`), `ScrollAreaPrimitive.Scrollbar` (`ScrollArea.Scrollbar`), `ScrollAreaPrimitive.Thumb` (`ScrollArea.Thumb`), and `ScrollAreaPrimitive.Corner` (`ScrollArea.Corner`).
  - Attached subcomponents (`Root`, `Viewport`, `Scrollbar`, `Thumb`, `Corner`) to `ScrollArea` compound component for API flexibility.
  - Preserved existing viewport customization class: `h-full w-full rounded-[inherit] [&>div]:!block [&>div]:min-w-full`.
  - Checked for CSS selector `data-[state=hidden]` (audited both component and consumers); none present.
  - Maintained displayNames: `ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName` and `ScrollBar.displayName = ScrollAreaPrimitive.Scrollbar.displayName`.
  - Leftover scan: `grep -n "radix-ui\|@radix-ui" src/components/ui/scroll-area.tsx` returned 0 matches. Clean.

## Left alone

- `src/components/curriculum/CurriculumSidebar.tsx`:
  - Audited consumer call sites (lines 98–102 and 109–113) using `<ScrollArea className="h-full w-full">`.
  - Consumers use standard `<ScrollArea className="...">` with children; no Radix-specific props (`type`, `scrollHideDelay`, `dir`, `asChild`) were passed, so call sites remain 100% compatible without edits.
- Non-radix libraries and dependencies: `lucide-react`, `class-variance-authority`, `marked`, `highlight.js` untouched.

## Behavior changes

- In Radix UI, scrollbar visibility was governed by `[data-state="visible" | "hidden"]` with `type="hover"` default and JS timer-based `scrollHideDelay`. In Base UI, visibility is CSS-driven: scrollbars unmount when there is no overflow by default (unless `keepMounted={true}` is set) and expose `data-hovering`, `data-scrolling`, `data-has-overflow-x`, and `data-has-overflow-y` state attributes.
- Radix rendered an internal wrapper `div` inside `ScrollArea.Viewport` with table display. Base UI renders the viewport directly as a single scrollable container; `[&>div]:!block [&>div]:min-w-full` remains in place to style direct child containers safely.

## Verify by hand

1. Open a course with multiple categories and lessons in the player so the curriculum list overflows vertically.
2. Confirm the curriculum sidebar displays the scrollbar when scrolling or hovering over the list.
3. Drag the scrollbar thumb and verify smooth scrolling of the curriculum content.
4. For courses with multiple attached resources, switch to the "Files" tab and verify the files panel scrolls cleanly when overflowing.
5. Resize the browser window or sidebar and verify the scrollbar updates its size and position correctly.

---

0 wrappers remain on Radix.
