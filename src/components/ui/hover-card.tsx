import { PreviewCard } from "@base-ui/react";
import * as React from "react";

import { cn } from "@/lib/utils";

const HoverCard = PreviewCard.Root;

const HoverCardTrigger = PreviewCard.Trigger;

const HoverCardPortal = PreviewCard.Portal;

const HoverCardContent = React.forwardRef<
  React.ElementRef<typeof PreviewCard.Popup>,
  React.ComponentPropsWithoutRef<typeof PreviewCard.Popup> &
    Pick<PreviewCard.Positioner.Props, "align" | "alignOffset" | "side" | "sideOffset">
>(
  (
    { className, align = "center", alignOffset = 0, side = "bottom", sideOffset = 4, ...props },
    ref,
  ) => (
    <PreviewCard.Portal>
      <PreviewCard.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="isolate z-50"
      >
        <PreviewCard.Popup
          ref={ref}
          className={cn(
            "z-50 w-64 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--transform-origin]",
            className,
          )}
          {...props}
        />
      </PreviewCard.Positioner>
    </PreviewCard.Portal>
  ),
);
HoverCardContent.displayName = "HoverCardContent";

export { HoverCard, HoverCardContent, HoverCardPortal, HoverCardTrigger };
