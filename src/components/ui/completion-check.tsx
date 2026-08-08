import type { CheckedState } from "@radix-ui/react-checkbox";
import type { MouseEvent } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

type Props = {
  checked: CheckedState;
  title?: string;
  className?: string;
  /** When true, renders as a non-interactive visual (e.g. inside another button). */
  decorative?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  onClick?: (e: MouseEvent) => void;
};

/**
 * Udemy-style circular completion check — shared by curriculum sidebar
 * and the lecture “Mark as complete” control.
 */
export function CompletionCheck({
  checked,
  title,
  className,
  decorative = false,
  onCheckedChange,
  onClick,
}: Props) {
  return (
    <Checkbox
      checked={checked}
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
        "size-[18px] shrink-0 rounded-full border-2 border-[var(--check-border)] bg-transparent shadow-none",
        // force white tick on green fill in both themes (avoid inheriting parent text-ok / text-text)
        "data-[state=checked]:border-ok data-[state=checked]:bg-ok",
        "data-[state=checked]:!text-[var(--check-mark)] data-[state=checked]:[&_svg]:!text-[var(--check-mark)] data-[state=checked]:[&_svg]:!stroke-[var(--check-mark)]",
        "data-[state=indeterminate]:border-ok data-[state=indeterminate]:bg-ok/20 data-[state=indeterminate]:!text-ok",
        "data-[state=indeterminate]:[&_svg]:!text-ok data-[state=indeterminate]:[&_svg]:!stroke-ok",
        !decorative &&
          "hover:border-[color-mix(in_srgb,var(--check-border)_45%,var(--text))] focus-visible:ring-ok/40",
        decorative &&
          "pointer-events-none opacity-100 disabled:cursor-default disabled:opacity-100",
        // keep indicator glyph compact inside the 18px ring
        "[&_svg]:size-3",
        className
      )}
    />
  );
}
