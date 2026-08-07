# CourseDesk — agent notes

## Stack

- Vite + TypeScript, **pnpm**
- UI: vanilla TS (do not change layout/CSS without being asked)
- Packages: `marked`, `highlight.js`, `lucide`, `sirv`

## Run

```bash
pnpm install
pnpm start
```

## Layout

| Path | Role |
|------|------|
| `src/` | Player app (course-agnostic) |
| `plugins/vite-plugin-courses.ts` | Live `/courses/manifest.json` + static media |
| `course-template/` | Package contract |
| `courses/` | Gitignored local packages |

## Rules

- All course details live in `courses/<id>/` only
- Never hardcode course ids in app source
- Keep lesson `id`s stable (progress keys)
- Do not open via `file://`
