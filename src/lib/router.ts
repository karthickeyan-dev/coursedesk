export type Route =
  | { view: "library"; courseId?: undefined }
  | { view: "course"; courseId: string };

/** Extract route information from window.location (pathname, search, or hash). */
export function getRouteFromLocation(
  location: { pathname: string; search: string; hash: string } = window.location
): Route {
  // 1. Check pathname: e.g. /course/react-101 or /course/react-101/
  const pathMatch = location.pathname.match(/^\/course\/([^/?#]+)/i);
  if (pathMatch?.[1]) {
    try {
      const courseId = decodeURIComponent(pathMatch[1]);
      if (courseId) return { view: "course", courseId };
    } catch {
      // Invalid URI encoding in path
    }
  }

  // 2. Check search params: e.g. ?course=react-101
  if (location.search) {
    try {
      const params = new URLSearchParams(location.search);
      const courseId = params.get("course");
      if (courseId?.trim()) {
        return { view: "course", courseId: courseId.trim() };
      }
    } catch {
      // Invalid search params
    }
  }

  // 3. Check hash: e.g. #/course/react-101 or #course=react-101
  if (location.hash) {
    const hashPathMatch = location.hash.match(/^#\/?course\/([^/?#]+)/i);
    if (hashPathMatch?.[1]) {
      try {
        const courseId = decodeURIComponent(hashPathMatch[1]);
        if (courseId) return { view: "course", courseId };
      } catch {
        // Invalid URI encoding in hash
      }
    }
    const hashQueryMatch = location.hash.match(/[?&]course=([^&]+)/i);
    if (hashQueryMatch?.[1]) {
      try {
        const courseId = decodeURIComponent(hashQueryMatch[1]);
        if (courseId) return { view: "course", courseId };
      } catch {
        // Invalid URI encoding in hash
      }
    }
  }

  return { view: "library" };
}

export function getCoursePath(courseId: string): string {
  return `/course/${encodeURIComponent(courseId)}`;
}

export function getLibraryPath(): string {
  return "/";
}

export function pushCourseRoute(courseId: string): void {
  const path = getCoursePath(courseId);
  const currentPath =
    window.location.pathname + window.location.search + window.location.hash;
  if (currentPath !== path) {
    window.history.pushState(
      { view: "course", courseId, fromApp: true },
      "",
      path
    );
  }
}

export function pushLibraryRoute(): void {
  const path = getLibraryPath();
  const currentPath = window.location.pathname;
  if (currentPath !== path && currentPath !== "/index.html") {
    window.history.pushState({ view: "library", fromApp: true }, "", path);
  }
}

export function replaceCourseRoute(courseId: string): void {
  const path = getCoursePath(courseId);
  window.history.replaceState({ view: "course", courseId }, "", path);
}

export function replaceLibraryRoute(): void {
  const path = getLibraryPath();
  window.history.replaceState({ view: "library" }, "", path);
}
