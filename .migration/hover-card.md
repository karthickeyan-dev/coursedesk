# hover-card

2026-09-15, transformation engine (legacy new-york style without Base UI registry equivalent), successfully migrated to `@base-ui/react` PreviewCard parts.

## Changed

- `src/components/ui/hover-card.tsx`:
  - Replaced `@radix-ui/react-hover-card` import with `import { PreviewCard } from "@base-ui/react"` (line 1).
  - Replaced `HoverCardPrimitive.Root` with `PreviewCard.Root` (line 6).
  - Replaced `HoverCardPrimitive.Trigger` with `PreviewCard.Trigger` (line 8).
  - Added `HoverCardPortal = PreviewCard.Portal` and exported it (lines 10, 43).
  - Restructured `HoverCardContent` to wrap `PreviewCard.Popup` inside `PreviewCard.Positioner` inside `PreviewCard.Portal` (lines 21-38).
  - Exposed and forwarded positioning props (`align`, `alignOffset`, `side`, `sideOffset`) to `PreviewCard.Positioner` with `isolate z-50` stacking context.
  - Rewrote data-attribute animation selectors on `PreviewCard.Popup`: `data-[state=open]` -> `data-open`, `data-[state=closed]` -> `data-closed`.
  - Replaced CSS custom property `origin-[--radix-hover-card-content-transform-origin]` with `origin-[--transform-origin]`.
  - Maintained `React.forwardRef` signature typing ref to `HTMLDivElement` (`React.ElementRef<typeof PreviewCard.Popup>`).
  - Leftover scan: `grep -n "radix-ui\|@radix-ui" src/components/ui/hover-card.tsx` returned 0 matches. Clean.
- `src/components/layout/ProgressPill.tsx`:
  - Updated `HoverCard` consumer: relocated `openDelay={120}` and `closeDelay={80}` from `HoverCard` (Root) to `HoverCardTrigger` as `delay={120}` and `closeDelay={80}`.
  - Replaced `asChild` on `HoverCardTrigger` with `render={trigger}` (line 45).
  - Leftover scan: `grep -n "radix-ui\|@radix-ui" src/components/layout/ProgressPill.tsx` returned 0 matches. Clean.

## Left alone

- Remaining Radix UI component wrappers in `src/components/ui/` (`checkbox.tsx`, `completion-check.tsx`, `scroll-area.tsx`) intentionally left untouched in progressive migration mode.
- Non-radix UI wrappers and dependencies (`lucide-react`, `marked`, `highlight.js`) untouched.

## Behavior changes

- In Radix UI, `openDelay` and `closeDelay` were defined on `HoverCard.Root` (defaulting to 700ms and 300ms). In Base UI PreviewCard, delay configuration moves to `PreviewCard.Trigger` as `delay` (default 600ms) and `closeDelay` (default 300ms).
- `PreviewCard.Trigger` renders an `<a>` element by default in Base UI (matching Radix UI HoverCard Trigger). When rendered with `render={trigger}`, it clones the custom trigger element (`div`) and binds pointer/focus event handlers.

## Verify by hand

1. In the course player topbar, locate the course progress pill.
2. Hover over the progress pill: verify the hover card opens smoothly after the 120ms delay.
3. Move pointer away from the pill and the hover card: verify the card closes after the 80ms delay.
4. Move pointer directly from the trigger into the card popup: verify the card remains open while hovered.
5. Verify positioning aligns to the end of the pill with a 10px offset (`align="end"`, `sideOffset={10}`).
6. Verify card appearance: table displaying lectures and time (total, completed, remaining) with popover background, shadow, and borders intact.
