# Project Migration: Radix UI to Base UI

2026-09-15, Strategy: Transformation engine (legacy style 'new-york'), Completed successfully.

## Dependency Swap
- Added `@base-ui/react`.
- Removed all `@radix-ui/react-*` dependencies.

## App-Code Sweep Summary
All Radix wrappers within `src/components/ui` were individually updated to use Base UI equivalents.
Consumer call sites across the application were systematically updated:
- Converted `asChild` prop usages to Base UI's native `render` prop (e.g., `<Button render={<a />} />`).
- Re-wired animation attributes (e.g. `data-[state=open]` -> `data-open`).
- Migrated specialized primitives handling for specific components (e.g., wrapping `HoverCardContent` within `<PreviewCard.Positioner>`).
- Rewrote callback events that rely on Radix UI's `preventDefault()` interception for preserving open state on Menu items with Base UI's native `closeOnClick={false}` API.

## Final Build Result
- `pnpm lint` and `pnpm typecheck` passed cleanly across the entire codebase.
- Full `pnpm build` succeeded flawlessly with all Radix dependencies fully eliminated.

## Important Note regarding Legacy Style (new-york)
> **FLAG:** The project uses the legacy `new-york` style, which does not have a direct `base-new-york` equivalent in the Shadcn registry. 
Because of this, `components.json` retains `radix` as the base. Future uses of the Shadcn CLI (`npx shadcn add ...`) will still fetch Radix variants for this project. To add future Base UI components, you will need to add them manually or switch to a Base UI supported style (like `base-zinc` or `base-neutral`) in your config.
