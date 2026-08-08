# CourseDesk

Local course player (**Vite + React + TypeScript**). Self-contained packages under `courses/`. Progress is stored in the browser.

## Run

```bash
pnpm install
pnpm start
```

Opens `http://localhost:5173`. Do not open `index.html` via `file://`.

| Command | Purpose |
|---------|---------|
| `pnpm start` / `pnpm dev` | Dev server + live course discovery |
| `pnpm build` | Production UI build |
| `pnpm preview` | Preview production build |
| `pnpm test` | Unit tests |
| `pnpm typecheck` | TypeScript check |

## Structure

```text
src/                 # React app
  components/        # UI
  store/             # Zustand
  lib/               # storage, course-loader, notes, format
plugins/             # Vite courses plugin (manifest + static media)
course-template/     # Package contract
courses/<id>/        # Your packages (gitignored)
  course.js          # required
  notes.js           # optional
  videos/ assets/
```

Add a course: copy `course-template` → `courses/<id>/`, fill `course.js`, refresh.
