# CourseDesk — agent notes

## Stack

- Vite + React 19 + TypeScript, **pnpm**
- UI: React + Zustand; styling: existing CSS shell + Tailwind v4 tokens
- Packages: `marked`, `highlight.js`, `lucide-react`, `sirv`

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
| `src/` | React app (course-agnostic) |
| `src/components/` | UI components |
| `src/store/` | Zustand store + boot |
| `src/lib/` | Shared helpers (storage, loader, notes, format) |
| `plugins/vite-plugin-courses.ts` | Live `/courses/manifest.json` + static media |
| `course-template/` | Package contract |
| `courses/` | Gitignored local packages |

## Rules

- All course details live in `courses/<id>/` only
- Never hardcode course ids in app source
- Keep lesson `id`s stable (progress keys)
- Do not open via `file://`
- Course packages load via classic script tags (`window.COURSES`) — never `import()` course.js
- `storage.ts` is the only writer of `coursedesk.*` localStorage keys
