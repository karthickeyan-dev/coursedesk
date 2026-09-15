# button

2026-09-15, transformation engine (legacy new-york style without Base UI registry equivalent), successfully migrated to `@base-ui/react` native Button primitive.

## Changed

- `src/components/ui/button.tsx`:
  - Replaced `@radix-ui/react-slot` import with `import { Button as BaseUIButton } from "@base-ui/react"`.
  - Replaced `asChild?: boolean` with `render?: React.ReactElement | ((props: any) => React.ReactElement)` on `ButtonProps` (line 54).
  - Replaced `asChild ? Slot : "button"` dispatch with `<BaseUIButton render={render} ...>` forwarding `ref` and merging `className` with CVA variants (line 61).
  - Maintained all existing Udemy-style Tailwind styling variants (`default`, `destructive`, `outline`, `secondary`, `ghost`, `link`) and sizes (`default`, `sm`, `lg`, `icon`).
  - Leftover scan: `grep -n "radix-ui\|@radix-ui" src/components/ui/button.tsx` returned 0 matches. Clean.
- `src/components/curriculum/FilesPanel.tsx`:
  - Updated consumer call sites (lines 60, 78) replacing `asChild` with `render={<a ... />}` for external link viewer and file download action buttons.

## Left alone

- Remaining 8 Radix UI component wrappers in `src/components/ui/` (`checkbox.tsx`, `collapsible.tsx`, `completion-check.tsx`, `dropdown-menu.tsx`, `hover-card.tsx`, `scroll-area.tsx`, `sheet.tsx`, `tabs.tsx`) intentionally left untouched in progressive migration mode.
- Non-radix UI wrappers and dependencies: `lucide-react`, `marked`, `highlight.js` untouched.

## Behavior changes

- When using `render={<a ... />} `, Base UI's native `Button` primitive defaults to adding `type="button"` and `tabindex="0"` to the rendered element. Non-button links rendered via `render` remain fully clickable without interference with normal link navigation or file downloads.

## Verify by hand

1. Open curriculum files panel in the course player.
2. Hover and click the external link button on a lesson file (`View in browser`) — verify the link opens in a new tab.
3. Click the download file button (`Download`) — verify the download triggers properly.
4. Test button variants across the app (Settings dropdown button, topbar navigation buttons, player controls buttons) — verify hover, focus rings (`focus-visible:ring-2`), and active styles look and behave identically to before.
