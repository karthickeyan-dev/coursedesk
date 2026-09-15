# dropdown-menu

2026-09-15, transformation engine (legacy new-york style without Base UI registry equivalent), successfully migrated to `@base-ui/react` Menu parts.

## Changed

- `src/components/ui/dropdown-menu.tsx`:
  - Replaced `@radix-ui/react-dropdown-menu` with `@base-ui/react/menu` (`import { Menu } from "@base-ui/react/menu"`).
  - Rewired primitives:
    - `DropdownMenu` -> `Menu.Root`
    - `DropdownMenuTrigger` -> `Menu.Trigger`
    - `DropdownMenuGroup` -> `Menu.Group`
    - `DropdownMenuPortal` -> `Menu.Portal`
    - `DropdownMenuSub` -> `Menu.SubmenuRoot`
    - `DropdownMenuRadioGroup` -> `Menu.RadioGroup`
    - `DropdownMenuSubTrigger` -> `Menu.SubmenuTrigger` with `data-popup-open:bg-panel-2 data-open:bg-panel-2` replacing `data-[state=open]:bg-panel-2`
    - `DropdownMenuContent` -> structured into `<Menu.Portal><Menu.Positioner align={align} alignOffset={alignOffset} side={side} sideOffset={sideOffset} className="isolate z-50 outline-none"><Menu.Popup ref={ref} ...>{children}</Menu.Popup></Menu.Positioner></Menu.Portal>`
    - Rewrote CSS variables: `--radix-dropdown-menu-content-available-height` -> `--available-height`, `--radix-dropdown-menu-content-transform-origin` -> `--transform-origin`
    - Rewrote data attributes: `data-[state=open]` -> `data-open`, `data-[state=closed]` -> `data-closed`
    - `DropdownMenuSubContent` -> composed `DropdownMenuContent` with submenu defaults (`align="start"`, `alignOffset={-3}`, `side="right"`, `sideOffset={0}`)
    - `DropdownMenuItem` -> `Menu.Item` with `data-disabled` selector
    - `DropdownMenuCheckboxItem` -> `Menu.CheckboxItem` and `Menu.CheckboxItemIndicator` (part split from generic ItemIndicator)
    - `DropdownMenuRadioItem` -> `Menu.RadioItem` and `Menu.RadioItemIndicator`
    - `DropdownMenuLabel` -> `Menu.GroupLabel`
    - `DropdownMenuSeparator` -> `Menu.Separator`
    - `DropdownMenuShortcut` -> preserved span utility
  - Maintained all 15 public exports and custom CourseDesk styling (`focus:bg-panel-2`, `text-text`, etc.).
  - Leftover scan: `grep -n "radix-ui\|@radix-ui\|IconPlaceholder" src/components/ui/dropdown-menu.tsx` returned 0 matches. Clean.
- `src/components/layout/SettingsMenu.tsx`:
  - Updated `DropdownMenuTrigger` call site from `asChild` to `render={<Button ... />}` (line 69).
  - Updated `DropdownMenuItem` call sites from `onSelect` with `keepOpen(e)` (`e.preventDefault()`) to Base UI's native `closeOnClick={false}` and `onClick` (lines 98-204).
  - Wrapped `DropdownMenuLabel` inside `<DropdownMenuGroup>` to satisfy Base UI `Menu.GroupLabel`'s requirement for a parent group context (lines 83-95).
  - Removed unused `keepOpen` helper function.
  - Leftover scan: `grep -n "radix-ui\|@radix-ui\|IconPlaceholder" src/components/layout/SettingsMenu.tsx` returned 0 matches. Clean.

## Left alone

- Remaining Radix UI wrappers in `src/components/ui/` (`completion-check.tsx`, `scroll-area.tsx`) intentionally left untouched for their respective migration steps.
- Non-radix UI wrappers and dependencies (`lucide-react`, `marked`, `highlight.js`) untouched.

## Behavior changes

- In Radix UI, menu items closed the menu on select unless `e.preventDefault()` was called. In Base UI, item closing is controlled by the explicit `closeOnClick` boolean prop (defaulting to `true` on `Item`, and `false` on `CheckboxItem`/`RadioItem`). The settings menu items use `closeOnClick={false}` to preserve the existing behavior of keeping the menu open to show action status messages.
- Submenu open state attribute changed from `data-[state=open]` to `data-popup-open` / `data-open`.
- Base UI `Menu.GroupLabel` requires being inside a `Menu.Group` or `Menu.RadioGroup` (for accessible `aria-labelledby` association).

## Verify by hand

1. Click the Settings icon button (gear) in the topbar to toggle the settings dropdown. Verify opening and closing animation transitions smoothly.
2. Verify keyboard navigation: press Escape to close, Arrow keys to navigate menu items.
3. Click "Save packaging guide" or "Download packaging guide" — verify action executes, status message updates, and menu remains open (`closeOnClick={false}`).
4. Click outside or press Escape — verify dropdown closes properly and focus returns to the trigger button.
