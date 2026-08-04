# CourseDesk

Local Udemy-style course player. Watch self-contained course packages (video + notes + curriculum) offline in the browser. Progress is saved per course.

## Structure

```text
.
├── index.html              # App shell
├── css/  js/  fonts/       # Player UI
├── course-template/        # Tracked template + AI packaging guide
│   ├── AGENTS.md           # How to structure a course from raw media
│   ├── course.js           # Sample curriculum
│   ├── notes.js            # Sample notes
│   └── …
└── courses/                # Gitignored — your real courses live here
    ├── catalog.js          # Library list
    └── <course-id>/
        ├── course.js
        ├── notes.js        # optional
        ├── videos/
        └── assets/
```

## Add a course

1. Follow **`course-template/AGENTS.md`** (or ask an AI agent to use that guide).
2. Copy the template → `courses/<your-course-id>/`.
3. Drop videos into `videos/`, fill in `course.js` / `notes.js`.
4. Register in `courses/catalog.js` and add `<script>` tags in `index.html`.

## Run

Serve the project root (recommended for local video playback):

```bash
npx serve .
# or: python3 -m http.server 8080
```

Then open the URL shown in the terminal.

## Git

`courses/*` is ignored so multi‑GB videos stay off the remote. After clone, recreate packages under `courses/` from your media + `course-template/`.
