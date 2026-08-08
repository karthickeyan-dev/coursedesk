import { useEffect, useMemo, useState } from "react";
import { ChevronRight, File } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { resolveCourseAssetUrl } from "@/lib/assets";
import { extensionLabel } from "@/lib/format";
import type { CourseResource } from "@/types/course";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";

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

/** Match curriculum lesson / section row chrome. */
const rowGrid =
  "grid w-full grid-cols-[22px_1fr_auto] items-start gap-2.5 border-0 py-3 pr-4 pl-3.5 text-left";

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

  const [hrefById, setHrefById] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    if (!activeCourse || !resources.length) {
      setHrefById({});
      return;
    }
    void (async () => {
      const next: Record<string, string> = {};
      for (const item of resources) {
        const key = item.id || item.path;
        const url = await resolveCourseAssetUrl(activeCourse, item.path);
        if (url) next[key] = url;
      }
      if (!cancelled) setHrefById(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [activeCourse, resources]);

  // Only clear if the open group was removed — allow null (closed), like Content sections
  useEffect(() => {
    if (!groups.length) return;
    if (openFileGroupId && !groups.includes(openFileGroupId)) {
      setOpenFileGroupId(null);
    }
  }, [groups, openFileGroupId, setOpenFileGroupId]);

  if (!resources.length) {
    return (
      <div className="w-full p-4">
        <p className="m-0 text-[13px] text-muted-2 italic">
          No files for this course.
        </p>
      </div>
    );
  }

  return (
    <nav className="block w-full min-w-0">
      {groups.map((groupName) => {
        const items = byGroup[groupName] || [];
        if (!items.length) return null;
        const open = openFileGroupId === groupName;
        return (
          <Collapsible
            key={groupName}
            open={open}
            onOpenChange={(next) =>
              setOpenFileGroupId(next ? groupName : null)
            }
            className="block w-full border-b border-border"
            data-file-group={groupName}
          >
            {/* Same outer header shell as CategorySection */}
            <div className="grid w-full grid-cols-[22px_1fr_auto] items-start gap-2.5 bg-panel-2 px-4 py-3.5 pr-4 pl-3.5 text-text hover:bg-[color-mix(in_srgb,var(--text)_7%,var(--panel-2))]">
              <span
                className="mt-0.5 h-[18px] w-[18px] shrink-0"
                aria-hidden
              />
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="col-span-2 grid w-full min-w-0 grid-cols-[1fr_auto] items-start gap-2.5 border-0 bg-transparent p-0 text-left text-inherit"
                >
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="text-sm leading-snug font-semibold">
                      {groupName}
                    </span>
                    <span className="text-left text-xs font-medium text-muted-2 tabular-nums">
                      {items.length} file{items.length === 1 ? "" : "s"}
                    </span>
                  </span>
                  <span className="mt-0.5 grid place-items-center">
                    <ChevronRight
                      size={16}
                      strokeWidth={2}
                      className={cn(
                        "block text-muted-2 transition-transform duration-150",
                        open && "rotate-90"
                      )}
                      aria-hidden
                    />
                  </span>
                </button>
              </CollapsibleTrigger>
            </div>

            <CollapsibleContent className="block w-full bg-elevated">
              {items.map((item) => {
                const key = item.id || item.path;
                const href = hrefById[key];
                const body = (
                  <>
                    <span
                      className="mt-px grid h-[18px] w-[18px] place-items-center text-muted-2"
                      aria-hidden="true"
                    >
                      <File size={16} className="block" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[13.5px] leading-snug font-medium">
                        {item.title || item.path}
                      </span>
                      {item.description ? (
                        <span className="mt-0.5 block text-xs text-muted-2">
                          {item.description}
                        </span>
                      ) : null}
                    </span>
                    {href ? (
                      <span className="mt-px whitespace-nowrap text-xs font-semibold tracking-wide text-muted-2 uppercase tabular-nums">
                        {extensionLabel(item.path)}
                      </span>
                    ) : null}
                  </>
                );

                if (!href) {
                  return (
                    <div
                      key={key}
                      className={cn(
                        rowGrid,
                        "border-l-[3px] border-l-transparent opacity-65"
                      )}
                    >
                      {body}
                    </div>
                  );
                }

                return (
                  <a
                    key={key}
                    className={cn(
                      rowGrid,
                      "cursor-pointer border-l-[3px] border-l-transparent bg-transparent font-inherit text-text no-underline hover:bg-text/4"
                    )}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`Open ${item.title || item.path}`}
                  >
                    {body}
                  </a>
                );
              })}
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </nav>
  );
}
