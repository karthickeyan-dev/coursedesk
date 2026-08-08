import { cn } from "@/lib/utils";

interface BrandMarkProps {
  className?: string;
  title?: string;
}

/** CourseDesk app mark — purple tile + play icon. */
export function BrandMark({ className, title }: BrandMarkProps) {
  return (
    <svg
      className={cn("block h-7 w-7 shrink-0", className)}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <rect width="32" height="32" rx="8" fill="#a435f0" />
      <path d="M12.5 9.5v13l11-6.5-11-6.5Z" fill="#ffffff" />
    </svg>
  );
}
