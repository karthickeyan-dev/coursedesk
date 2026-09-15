import * as React from "react";
import { Button as BaseUIButton } from "@base-ui/react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Udemy-style buttons:
 * - primary: solid brand purple, white label
 * - secondary: high-contrast border (white-on-dark / black-on-light)
 */
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm",
    "text-sm font-semibold leading-none tracking-tight",
    "transition-[background-color,border-color,color,opacity] duration-150",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-40",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "border border-transparent bg-[var(--btn-primary)] !text-white hover:bg-[var(--btn-primary-hover)] active:bg-[var(--btn-primary-hover)] hover:!text-white",
        destructive:
          "border border-transparent bg-destructive !text-white hover:bg-destructive/90 hover:!text-white",
        outline:
          "border border-[var(--btn-secondary-border)] bg-transparent text-foreground hover:bg-[var(--btn-secondary-hover)] hover:text-foreground",
        secondary:
          "border border-[var(--btn-secondary-border)] bg-[var(--btn-secondary-bg)] text-[var(--btn-secondary-fg)] hover:bg-[var(--btn-secondary-hover)] hover:text-[var(--btn-secondary-fg)]",
        ghost:
          "border border-transparent bg-transparent text-foreground hover:bg-[var(--btn-secondary-hover)]",
        link: "border border-transparent text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 min-h-10 px-4 py-2.5",
        sm: "h-8 min-h-8 rounded-sm px-3 text-xs",
        lg: "h-11 min-h-11 px-6",
        icon: "h-9 w-9 min-h-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  // biome-ignore lint/suspicious/noExplicitAny: explicit type requested for custom render function
  render?: React.ReactElement | ((props: any) => React.ReactElement);
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, render, ...props }, ref) => {
    return (
      <BaseUIButton
        render={render}
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
