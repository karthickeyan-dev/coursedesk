# checkbox

2026-09-15, transformation engine (legacy new-york style without Base UI registry equivalent), successfully migrated `checkbox` and `completion-check` to `@base-ui/react` Checkbox primitives.

## Changed

- `src/components/ui/checkbox.tsx`:
  - Replaced `@radix-ui/react-checkbox` with `import { Checkbox as CheckboxPrimitive } from "@base-ui/react"`.
  - Wired up `CheckboxPrimitive.Root` (`Checkbox.Root`) and `CheckboxPrimitive.Indicator` (`Checkbox.Indicator`).
  - Implemented `CheckboxPrimitive.Indicator` with `render` callback supporting both checked state (rendering `Check` icon) and indeterminate state (rendering `Minus` icon).
  - Supported `checked?: boolean | "indeterminate"` and `indeterminate?: boolean` for full backward and forward compatibility.
  - Rewrote CSS state selectors: `data-[state=checked]:` -> `data-checked:` and `data-[state=indeterminate]:` -> `data-indeterminate:`.
  - Preserved all original Tailwind classes and styling.
  - Exported callable `Checkbox` component with attached `Checkbox.Root` and `Checkbox.Indicator` compound parts.
  - Leftover scan: `grep -n "radix-ui\|@radix-ui" src/components/ui/checkbox.tsx` returned 0 matches. Clean.
- `src/components/ui/completion-check.tsx`:
  - Replaced `@radix-ui/react-checkbox` with `import { Checkbox } from "@base-ui/react"`.
  - Wired up `Checkbox.Root` and `Checkbox.Indicator`.
  - Configured `Checkbox.Indicator` with a `render` callback dynamically displaying `<Minus />` when `state.indeterminate` is true and `<Check />` when checked.
  - Replaced Radix CSS state selectors with Base UI equivalents: `data-[state=checked]:` -> `data-checked:` and `data-[state=indeterminate]:` -> `data-indeterminate:`.
  - Preserved all circular ring styling, theme color mix rules, and SVG sizing overrides.
  - Leftover scan: `grep -n "radix-ui\|@radix-ui" src/components/ui/completion-check.tsx` returned 0 matches. Clean.
- `src/components/lesson/LectureBar.tsx`:
  - Rewrote call-site CSS class in `CompletionCheck` autoplay indicator: `data-[state=checked]:border-accent data-[state=checked]:bg-accent` -> `data-checked:border-accent data-checked:bg-accent`.
  - Leftover scan: `grep -n "radix-ui\|@radix-ui" src/components/lesson/LectureBar.tsx` returned 0 matches. Clean.

## Left alone

- `src/components/ui/scroll-area.tsx` (the 1 remaining Radix UI wrapper in `src/components/ui/`).
- `package.json` & `pnpm-lock.yaml`: Radix packages are preserved until the last wrapper (`scroll-area.tsx`) is migrated, per progressive migration policy.
- Non-radix wrappers and dependencies: `cmdk`, `lucide-react`, `marked`, `highlight.js` untouched.

## Behavior changes

- Element tag: Radix `Checkbox.Root` rendered a `<button>` with a hidden `<input>` inside forms. Base UI `Checkbox.Root` renders a `<span>` with a hidden `<input>` beside it. Standard button behavior and keyboard interactions (<kbd>Space</kbd> toggle) are handled natively by Base UI.
- Prop splitting: Radix combined checked and indeterminate into a single `checked` prop (`boolean | "indeterminate"`). Base UI splits this into separate `checked: boolean` and `indeterminate: boolean` props. The wrappers normalize `checked="indeterminate"` to `checked={false}` and `indeterminate={true}` to maintain complete compatibility with existing consumer calls.

## Verify by hand

1. Open a course with multiple sections in the curriculum sidebar.
2. Section completion check (indeterminate state):
   - Mark only 1 lesson complete in a section with multiple lessons.
   - Verify the section header's `CompletionCheck` renders in indeterminate state (green tint background with `Minus` icon glyph).
3. Section completion check (complete state):
   - Mark all lessons in a section complete.
   - Verify the section header's `CompletionCheck` turns solid green with white `Check` tick mark.
4. Lesson completion check:
   - Click a lesson's circular `CompletionCheck` to toggle completion status.
   - Verify the checkmark toggles immediately and updates the overall progress pill in the topbar.
5. Autoplay toggle in LectureBar:
   - Toggle the "Autoplay" button in the lecture action bar.
   - Verify the circular checkmark toggles on/off with the accent border and fill when active.
6. Keyboard accessibility:
   - <kbd>Tab</kbd> to a checkbox, verify focus visible ring (`focus-visible:ring-1 focus-visible:ring-ring`), and press <kbd>Space</kbd> to toggle.

---

1 wrapper remains on Radix (`src/components/ui/scroll-area.tsx`).
