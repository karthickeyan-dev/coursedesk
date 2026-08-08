import { useEffect, useMemo } from "react";
import { useAppStore } from "../../store/useAppStore";
import { CategorySection } from "./CategorySection";
import { FilesPanel } from "./FilesPanel";

export function CurriculumSidebar() {
  const categories = useAppStore((s) => s.categories);
  const lessons = useAppStore((s) => s.lessons);
  const sidebarTab = useAppStore((s) => s.sidebarTab);
  const setSidebarTab = useAppStore((s) => s.setSidebarTab);
  const activeCourse = useAppStore((s) => s.activeCourse);
  const activeLessonId = useAppStore((s) => s.activeLessonId);

  const resources = activeCourse?.data?.resources;
  const hasFiles = Array.isArray(resources) && resources.length > 0;
  const isContent = sidebarTab === "content" || !hasFiles;

  const lessonsByCategory = useMemo(() => {
    const map = new Map<string, typeof lessons>();
    for (const lesson of lessons) {
      const list = map.get(lesson.categoryId) || [];
      list.push(lesson);
      map.set(lesson.categoryId, list);
    }
    return map;
  }, [lessons]);

  useEffect(() => {
    if (!activeLessonId) return;
    requestAnimationFrame(() => {
      document
        .querySelector<HTMLElement>(`.lesson-btn[data-id="${activeLessonId}"]`)
        ?.scrollIntoView({ block: "nearest" });
    });
  }, [activeLessonId]);

  return (
    <aside className="curriculum" aria-label="Course sidebar">
      <div
        className={`sidebar-tabs${!hasFiles ? " is-single hidden" : ""}`}
        role="tablist"
        aria-label="Sidebar panels"
      >
        <button
          type="button"
          className={`sidebar-tab${isContent ? " is-active" : ""}`}
          role="tab"
          aria-selected={isContent}
          aria-controls="panelContent"
          onClick={() => setSidebarTab("content")}
        >
          Content
        </button>
        {hasFiles && (
          <button
            type="button"
            className={`sidebar-tab${!isContent ? " is-active" : ""}`}
            role="tab"
            aria-selected={!isContent}
            aria-controls="panelFiles"
            onClick={() => setSidebarTab("files")}
          >
            Files
          </button>
        )}
      </div>
      <div
        id="panelContent"
        className={`sidebar-panel${isContent ? " is-active" : ""}`}
        role="tabpanel"
        hidden={!isContent}
      >
        <nav className="curriculum-list">
          {categories.map((category, index) => {
            const catLessons = lessonsByCategory.get(category.id) || [];
            if (!catLessons.length) return null;
            return (
              <CategorySection
                key={category.id}
                category={category}
                sectionNumber={index + 1}
                lessons={catLessons}
              />
            );
          })}
        </nav>
      </div>
      {hasFiles && (
        <div
          id="panelFiles"
          className={`sidebar-panel${!isContent ? " is-active" : ""}`}
          role="tabpanel"
          hidden={isContent}
        >
          <FilesPanel />
        </div>
      )}
    </aside>
  );
}
