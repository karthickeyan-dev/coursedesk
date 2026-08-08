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
src/
  components/     # UI (library, lesson, curriculum, player, layout)
  store/          # Zustand + boot + progress selectors
  lib/            # storage, course-loader, notes, format, assets
plugins/          # Vite courses plugin (manifest + static media via sirv)
course-template/  # Package contract
courses/<id>/     # Your packages (gitignored)
  course.js       # required
  notes.js        # optional
  videos/ assets/
```

Course media is served from `courses/` (not `public/`) with **HTTP Range** support so video scrubbing works. That is why the Vite plugin uses **sirv**.

Add a course: copy `course-template` → `courses/<id>/`, fill `course.js`, refresh.
