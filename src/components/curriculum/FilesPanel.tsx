import { useEffect, useMemo } from "react";
import { ChevronRight, File } from "lucide-react";
import { extensionLabel } from "../../lib/format";
import type { CourseResource } from "../../types/course";
import { resolveCourseAsset } from "../../lib/assets";
import { useAppStore } from "../../store/useAppStore";

function groupResources(resources: CourseResource[]) {
  const groups: string[] = [];
  const byGroup: Record<string, CourseResource[]> = Object.create(null);
  for (const item of resources) {
    if (!item?.path) continue;
    const group = String(item.group || "Files").trim() || "Files";
    if (!byGroup[group]) {
      byGroup[group] = [];
      groups.push(group);
    }
    byGroup[group].push(item);
  }
  return { groups, byGroup };
}

export function FilesPanel() {
  const activeCourse = useAppStore((s) => s.activeCourse);
  const openFileGroupId = useAppStore((s) => s.openFileGroupId);
  const setOpenFileGroupId = useAppStore((s) => s.setOpenFileGroupId);

  const resources = useMemo(() => {
    const list = activeCourse?.data?.resources;
    return Array.isArray(list) ? list : [];
  }, [activeCourse]);

  const { groups, byGroup } = useMemo(
    () => groupResources(resources),
    [resources]
  );

  useEffect(() => {
    if (!groups.length) return;
    if (!openFileGroupId || !groups.includes(openFileGroupId)) {
      setOpenFileGroupId(groups[0] ?? null);
    }
  }, [activeCourse?.data.id, groups, openFileGroupId, setOpenFileGroupId]);

  if (!resources.length) {
    return (
      <div className="files-body">
        <p className="files-empty">No downloadable files for this course.</p>
      </div>
    );
  }

  return (
    <div className="files-body curriculum-list">
      {groups.map((groupName) => {
        const items = byGroup[groupName] || [];
        if (!items.length) return null;
        const open = openFileGroupId === groupName;
        return (
          <div
            key={groupName}
            className={`category${open ? " open" : ""}`}
            data-file-group={groupName}
          >
            <button
              type="button"
              className="category-toggle files-group-toggle"
              aria-expanded={open}
              onClick={() =>
                setOpenFileGroupId(open ? null : groupName)
              }
            >
              <span className="files-group-spacer" aria-hidden="true" />
              <span className="category-text">
                <span className="label">{groupName}</span>
                <span className="meta">
                  {items.length} file{items.length === 1 ? "" : "s"}
                </span>
              </span>
              <span className="category-chevron">
                <ChevronRight size={16} className="chev" />
              </span>
            </button>
            <div className="category-lessons">
              {items.map((item) => {
                const href = resolveCourseAsset(activeCourse, item.path);
                if (!href) return null;
                return (
                  <a
                    key={item.id || item.path}
                    className="files-item"
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    download=""
                  >
                    <span className="files-item-icon" aria-hidden="true">
                      <File size={16} />
                    </span>
                    <span className="title-wrap">
                      <span className="title">{item.title || item.path}</span>
                      {item.description ? (
                        <span className="lesson-meta">{item.description}</span>
                      ) : null}
                    </span>
                    <span className="lesson-duration files-item-ext">
                      {extensionLabel(item.path)}
                    </span>
                  </a>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
