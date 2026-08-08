import { cn } from "@/lib/utils";
import { BrandMark } from "./BrandMark";

interface BrandLogoProps {
  className?: string;
  /** Wordmark color — default follows theme text. */
  wordmarkClassName?: string;
  markClassName?: string;
}

/** Horizontal lockup: mark + lowercase wordmark (udemy-like). */
export function BrandLogo({
  className,
  wordmarkClassName,
  markClassName,
}: BrandLogoProps) {
  return (
    <span
      className={cn("inline-flex items-center gap-2", className)}
      aria-label="CourseDesk"
    >
      <BrandMark className={cn("h-6 w-6", markClassName)} />
      <span
        className={cn(
          "text-[0.95rem] leading-none font-bold tracking-tight lowercase",
          wordmarkClassName
        )}
      >
        coursedesk
      </span>
    </span>
  );
}
