# collapsible

2026-09-15, transformation engine (legacy new-york style without Base UI registry equivalent), successfully migrated to `@base-ui/react`'s Collapsible parts.

## Changed

- `src/components/ui/collapsible.tsx`:
  - Replaced `@radix-ui/react-collapsible` import with `import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible"`.
  - Rewired primitives:
    - `Collapsible = CollapsiblePrimitive.Root`
    - `CollapsibleTrigger = CollapsiblePrimitive.Trigger`
    - `CollapsibleContent = CollapsiblePrimitive.Panel`
  - Leftover scan: `grep -n "radix-ui\|@radix-ui" src/components/ui/collapsible.tsx` returned 0 matches. Clean.
- `src/components/curriculum/SidebarGroup.tsx`:
  - Migrated consumer call site (lines 38–48) replacing `asChild` on `<CollapsibleTrigger>` with `render={<button ... />}`.
  - Kept all existing Tailwind classes, icon indicators, and layout grids intact on the trigger button.
  - Leftover scan: `grep -n "radix-ui\|@radix-ui" src/components/curriculum/SidebarGroup.tsx` returned 0 matches. Clean.

## Left alone

- Remaining 1 Radix UI component wrapper in `src/components/ui/` (`scroll-area.tsx`) intentionally left untouched in progressive migration mode.
- Non-radix UI wrappers and dependencies (`lucide-react`, `class-variance-authority`, `marked`, `highlight.js`, `zustand`) untouched.

## Behavior changes

- Base UI `Collapsible.Panel` manages open/closed states via presence attributes `data-open` and `data-closed` (rather than Radix's `data-[state="open"|"closed"]`).
- Base UI `Collapsible.Trigger` renders a native `<button>` element by default (or merges with the element provided to `render`) and receives `data-panel-open` when expanded.
- Base UI `Collapsible.Root` renders a `<div>` wrapper element.
- Transition and height animation hooks in Base UI are exposed via `--collapsible-panel-height` and `--collapsible-panel-width` (replacing Radix's `--radix-collapsible-content-height/width`).

## Verify by hand

1. Open the course player view where the curriculum sidebar is rendered with section/category collapsible groups.
2. Click on a sidebar section header to toggle its open/closed state.
3. Verify that the collapsible group expands and collapses smoothly, revealing and hiding the lecture items.
4. Verify that the chevron arrow rotates 90 degrees when open and returns to 0 degrees when closed.
5. Verify keyboard navigation: focus the section header trigger using `Tab` and toggle it using `Enter` or `Space`.
