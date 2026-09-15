# sheet

2026-09-15, transformation engine (legacy new-york style without Base UI registry equivalent), successfully migrated to `@base-ui/react`'s Dialog parts.

## Changed

- `src/components/ui/sheet.tsx`:
  - Replaced `@radix-ui/react-dialog` with `import { Dialog } from "@base-ui/react/dialog"`.
  - Rewired primitives:
    - `Sheet = Dialog.Root`
    - `SheetTrigger = Dialog.Trigger`
    - `SheetClose = Dialog.Close`
    - `SheetPortal = Dialog.Portal`
    - `SheetOverlay`: rewired to render `<Dialog.Backdrop>`, typed with `React.ElementRef<typeof Dialog.Backdrop>` and `React.ComponentPropsWithoutRef<typeof Dialog.Backdrop>`.
    - `SheetContent`: rewired to render `<Dialog.Popup>` instead of `<SheetPrimitive.Content>` inside `<SheetPortal>`, wrapping `<SheetOverlay />` and `<Dialog.Close>`.
    - `SheetTitle`: rewired to render `<Dialog.Title>`.
    - `SheetDescription`: rewired to render `<Dialog.Description>` while preserving custom token class `text-muted-2`.
  - Class and attribute mappings:
    - In `SheetOverlay`: mapped `data-[state=open]` -> `data-open` and `data-[state=closed]` -> `data-closed`.
    - In `sheetVariants`: mapped `data-[state=open]` -> `data-open` and `data-[state=closed]` -> `data-closed` across root classes and all four side variants (`top`, `bottom`, `left`, `right`).
    - In `SheetContent` close button: mapped `data-[state=open]:bg-secondary` -> `data-open:bg-secondary`.
  - Leftover scan: `grep -n "radix-ui\|@radix-ui" src/components/ui/sheet.tsx` returned 0 matches. Clean.

## Left alone

- `src/components/curriculum/CurriculumSidebar.tsx`:
  - Audited consumer call sites (lines 128–137) using `<Sheet open={curriculumOpen} onOpenChange={setCurriculumOpen}>`, `<SheetContent side="right">`, `<SheetHeader>`, `<SheetTitle>`.
  - `open` (`boolean`) and `onOpenChange` (`(open: boolean) => void`) are 100% type-compatible with Base UI Dialog; no consumer modifications were required.
- Remaining Radix UI component wrappers in `src/components/ui/` (`checkbox.tsx`, `scroll-area.tsx`, `tabs.tsx`) intentionally left untouched in progressive migration mode.
- Non-radix libraries and dependencies (`lucide-react`, `class-variance-authority`, `marked`, `highlight.js`) untouched.

## Behavior changes

- In Base UI, `Dialog.Backdrop` and `Dialog.Popup` manage presence via `data-open` and `data-closed` attributes. Transitions and unmounting upon exit animation completion are handled natively by Base UI.
- Focus management: Base UI Dialog focuses the first tabbable element inside `<Dialog.Popup>` on desktop and the popup itself when opened via touch. Focus returns to the trigger on close.

## Verify by hand

1. Resize the browser viewport below 980px to trigger the narrow layout where the curriculum sidebar renders inside `<Sheet>`.
2. Click the sidebar toggle icon in the topbar to open the sheet.
3. Verify that the backdrop overlay appears and the sheet slides in smoothly from the right side (`sm:max-w-sm`).
4. Click the close button (`X`) in the top right of the sheet, or press the `Escape` key, or tap on the backdrop — verify the sheet animates out to the right and dismisses cleanly.
5. Verify keyboard navigation: focus traps correctly within the open sheet and returns to the toggle button upon dismissal.
