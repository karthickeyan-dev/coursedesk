import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Download, ExternalLink } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { resolveCourseAssetUrl } from "@/lib/assets";
import { canViewInBrowser, fileBasename } from "@/lib/format";
import { FileTypeIcon } from "./FileTypeIcon";
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

const fileActionClass =
  "h-7 w-7 min-h-7 shrink-0 text-muted-2 hover:text-text";

function ResourceRow({
  item,
  href,
}: {
  item: CourseResource;
  href?: string;
}) {
  const label = item.title || item.path;
  const canView = Boolean(href) && canViewInBrowser(item.path);

  return (
    <div
      className={cn(
        "grid w-full min-w-0 grid-cols-[auto_1fr_auto] items-center gap-2 px-3 py-3 text-left",
        href ? "text-text" : "opacity-65"
      )}
    >
      <FileTypeIcon path={item.path} />
      <span className="min-w-0">
        <span className="block truncate text-[13.5px] leading-snug font-medium">
          {label}
        </span>
        {item.description ? (
          <span className="mt-0.5 block text-xs text-muted-2">
            {item.description}
          </span>
        ) : null}
      </span>
      <span className="flex items-center gap-0.5">
        {href && canView ? (
          <Button asChild variant="ghost" size="icon" className={fileActionClass}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              title="View in browser"
              aria-label={`View ${label} in browser`}
            >
              <ExternalLink />
            </a>
          </Button>
        ) : null}
        {href ? (
          <Button asChild variant="ghost" size="icon" className={fileActionClass}>
            <a
              href={href}
              download={fileBasename(item.path)}
              title="Download"
              aria-label={`Download ${label}`}
            >
              <Download />
            </a>
          </Button>
        ) : null}
      </span>
    </div>
  );
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
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="grid w-full min-w-0 grid-cols-[1fr_auto] items-center gap-2 border-0 bg-panel-2 px-4 py-3.5 text-left text-text hover:bg-[color-mix(in_srgb,var(--text)_7%,var(--panel-2))]"
              >
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="text-sm leading-snug font-semibold">
                    {groupName}
                  </span>
                  <span className="text-left text-xs font-medium text-muted-2 tabular-nums">
                    {items.length} file{items.length === 1 ? "" : "s"}
                  </span>
                </span>
                <span className="grid place-items-center">
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

            <CollapsibleContent className="block w-full bg-elevated">
              {items.map((item) => {
                const key = item.id || item.path;
                return (
                  <ResourceRow
                    key={key}
                    item={item}
                    href={hrefById[key]}
                  />
                );
              })}
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </nav>
  );
}
