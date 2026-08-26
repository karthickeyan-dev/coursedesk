import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

export function SidebarGroup({
  open,
  onOpenChange,
  title,
  meta,
  leading,
  children,
  dataCategoryId,
  dataFileGroup,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  meta: string;
  leading?: ReactNode;
  children: ReactNode;
  dataCategoryId?: string;
  dataFileGroup?: string;
}) {
  return (
    <Collapsible
      open={open}
      onOpenChange={onOpenChange}
      className="block w-full border-b border-border"
      data-category-id={dataCategoryId}
      data-file-group={dataFileGroup}
    >
      <div className="relative">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className={cn(
              "grid w-full min-w-0 gap-2.5 border-0 bg-panel-2 py-3.5 pr-4 text-left text-text hover:bg-[color-mix(in_srgb,var(--text)_7%,var(--panel-2))]",
              leading
                ? "grid-cols-[22px_1fr_auto] items-start pl-3.5"
                : "grid-cols-[1fr_auto] items-center px-4"
            )}
          >
            {leading ? <span className="mt-0.5 size-[18px] shrink-0" aria-hidden /> : null}
            <span className="flex min-w-0 flex-col gap-1">
              <span className="text-sm leading-snug font-semibold">{title}</span>
              <span className="text-left text-xs font-medium text-muted-2 tabular-nums">
                {meta}
              </span>
            </span>
            <span className={cn("grid place-items-center", leading && "mt-0.5")}>
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
        {leading ? (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-start pt-3.5 pl-3.5">
            {leading}
          </div>
        ) : null}
      </div>
      <CollapsibleContent className="block w-full bg-elevated">{children}</CollapsibleContent>
    </Collapsible>
  );
}
