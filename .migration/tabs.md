# tabs

2026-09-15, transformation engine (legacy new-york style without Base UI registry equivalent), successfully migrated to `@base-ui/react` Tabs primitives.

## Changed

- `src/components/ui/tabs.tsx`:
  - Replaced `@radix-ui/react-tabs` with `import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"`.
  - Wired up `TabsPrimitive.Root` (`Tabs`), `TabsPrimitive.List` (`TabsList`), `TabsPrimitive.Tab` (`TabsTrigger` / `TabsTab`), and `TabsPrimitive.Panel` (`TabsContent` / `TabsPanel`).
  - Mapped active state selectors in `TabsTrigger` from `data-[state=active]:bg-elevated data-[state=active]:text-text data-[state=active]:shadow` to `data-active:bg-elevated data-active:text-text data-active:shadow`.
  - Added `aria-disabled:pointer-events-none aria-disabled:opacity-50` alongside `disabled:pointer-events-none disabled:opacity-50`.
  - Shifted prop signatures from Radix `asChild` to Base UI's native `render` prop via `TabsPrimitive.*.Props`.
  - Preserved custom project tokens (`bg-panel-2`, `text-muted-2`, `bg-elevated`, `text-text`).
  - Exported `Tabs, TabsList, TabsTrigger, TabsContent` and forward-compatible aliases `TabsTab, TabsPanel`.
  - Leftover scan: `grep -n "radix-ui\|@radix-ui" src/components/ui/tabs.tsx` returned 0 matches. Clean.
- `src/components/curriculum/CurriculumSidebar.tsx`:
  - Rewrote `tabTriggerClass` to use `data-active:` instead of `data-[state=active]:` (`data-active:border-accent data-active:bg-transparent data-active:text-text data-active:shadow-none`).
  - Rewrote `TabsContent` panels from `data-[state=inactive]:hidden` to `data-hidden:hidden`.
  - Leftover scan: `grep -n "radix-ui\|@radix-ui" src/components/curriculum/CurriculumSidebar.tsx` returned 0 matches. Clean.

## Left alone

- `src/components/ui/scroll-area.tsx` (the 1 remaining Radix UI wrapper in `src/components/ui/`).
- Non-radix wrappers and dependencies: `lucide-react`, `marked`, `highlight.js` untouched.

## Behavior changes

- Tab activation mode default: Radix Tabs defaulted to automatic activation on keyboard focus (`activationMode="automatic"`). Base UI defaults to manual activation (`activateOnFocus={false}`), requiring <kbd>Enter</kbd> or <kbd>Space</kbd> to activate the focused tab. Flagged per skill specification.
- Panel mounting: Radix used `forceMount` to keep hidden tabs in the DOM. Base UI unmounts inactive panels by default unless `keepMounted={true}` is explicitly provided (which then renders with `data-hidden` and the `hidden` attribute).

## Verify by hand

1. Open a course in the player with the curriculum sidebar visible.
2. Confirm the active tab ("Content") displays the active accent border (`data-active:border-accent`) and background.
3. For a course with resources, click the "Files" tab: verify the panel switches to the files view and the "Files" tab gains active styling while "Content" becomes inactive.
4. Click back to "Content": verify the curriculum list displays and scrolls to the active lesson.
5. Keyboard navigation: <kbd>Tab</kbd> into the tab list, navigate tabs using <kbd>Arrow Left</kbd> / <kbd>Arrow Right</kbd>, and press <kbd>Enter</kbd> or <kbd>Space</kbd> to activate.

---

1 wrapper remains on Radix (`src/components/ui/scroll-area.tsx`).
