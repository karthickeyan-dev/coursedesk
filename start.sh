#!/bin/bash
# CourseDesk — start local server and open in browser
PORT=8000
echo "🎓 CourseDesk → http://localhost:$PORT"
open "http://localhost:$PORT"
python3 -m http.server "$PORT"
