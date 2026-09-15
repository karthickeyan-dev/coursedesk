import type { MouseEvent } from "react";
import { Checkbox } from "@base-ui/react";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export type CheckedState = boolean | "indeterminate";

type Props = {
  checked: CheckedState;
  title?: string;
  className?: string;
  /** When true, renders as a non-interactive visual (e.g. inside another button). */
  decorative?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  onClick?: (e: MouseEvent) => void;
};

/** Circular completion check used in the curriculum sidebar and Autoplay control. */
export function CompletionCheck({
  checked,
  title,
  className,
  decorative = false,
  onCheckedChange,
  onClick,
}: Props) {
  const isIndeterminate = checked === "indeterminate";

  return (
    <Checkbox.Root
      checked={isIndeterminate ? false : checked}
      indeterminate={isIndeterminate}
      title={decorative ? undefined : title}
      aria-label={decorative ? undefined : title}
      aria-hidden={decorative || undefined}
      tabIndex={decorative ? -1 : undefined}
      disabled={decorative}
      onCheckedChange={
        decorative
          ? undefined
          : (value) => onCheckedChange?.(value === true)
      }
      onClick={onClick}
      className={cn(
        // circular ring — matches curriculum rows
        "peer grid size-[18px] shrink-0 place-content-center rounded-full border-2 border-[var(--check-border)] bg-transparent shadow-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        // force white tick on green fill in both themes (avoid inheriting parent text-ok / text-text)
        "data-checked:border-ok data-checked:bg-ok",
        "data-checked:!text-[var(--check-mark)] data-checked:[&_svg]:!text-[var(--check-mark)] data-checked:[&_svg]:!stroke-[var(--check-mark)]",
        "data-indeterminate:border-ok data-indeterminate:bg-ok/20 data-indeterminate:!text-ok",
        "data-indeterminate:[&_svg]:!text-ok data-indeterminate:[&_svg]:!stroke-ok",
        !decorative &&
          "hover:border-[color-mix(in_srgb,var(--check-border)_45%,var(--text))] focus-visible:ring-ok/40",
        decorative &&
          "pointer-events-none opacity-100 disabled:cursor-default disabled:opacity-100",
        // keep indicator glyph compact inside the 18px ring
        "[&_svg]:size-3",
        className
      )}
    >
      <Checkbox.Indicator
        className="grid place-content-center text-current"
        render={(indicatorProps, state) => (
          <span {...indicatorProps}>
            {state.indeterminate ? (
              <Minus className="size-3" strokeWidth={3} color="currentColor" />
            ) : (
              <Check className="size-3" strokeWidth={3} color="currentColor" />
            )}
          </span>
        )}
      />
    </Checkbox.Root>
  );
}
