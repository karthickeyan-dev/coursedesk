# CourseDesk — agent notes

## Stack

- Vite + React 19 + TypeScript, **pnpm**
- UI: React + Zustand; styling: CSS shell + Tailwind v4 tokens
- Packages: `marked`, `highlight.js`, `lucide-react`
- Dev: `sirv` (HTTP Range for course video seek via Vite plugin)

## Run

```bash
pnpm install
pnpm start
```

| Command | Purpose |
|---------|---------|
| `pnpm start` / `pnpm dev` | Dev server + live course discovery |
| `pnpm build` | Production build |
| `pnpm test` | Vitest unit tests |
| `pnpm typecheck` | TypeScript check |

## Layout

| Path | Role |
|------|------|
| `src/components/` | UI by feature (library, lesson, curriculum, player, layout) |
| `src/store/` | Zustand store, boot, progress selectors |
| `src/lib/` | Domain helpers (storage, loader, notes, format, assets) |
| `plugins/vite-plugin-courses.ts` | Live `/courses/manifest.json` + static media (sirv) |
| `course-template/` | Package contract |
| `courses/` | Gitignored local packages |

## Import rules

- Path / duration / labels → `src/lib/assets`, `src/lib/format`
- Progress helpers → `src/store/selectors` (not from `useAppStore`)
- Store → state and actions only (`useAppStore`)
- Course packages → classic script tags (`window.COURSES`); never `import()` course.js

## Rules

- All course details live in `courses/<id>/` only
- Never hardcode course ids in app source
- Keep lesson `id`s stable (progress keys)
- Do not open via `file://`
- `storage.ts` is the only writer of `coursedesk.*` localStorage keys
- Keep ProgressPill `useShallow(selectProgressStats)` — required for React 19
