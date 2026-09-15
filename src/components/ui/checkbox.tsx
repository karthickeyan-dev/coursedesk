import * as React from "react";
import { Checkbox as CheckboxPrimitive } from "@base-ui/react";
import { Check, Minus } from "lucide-react";

import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends Omit<CheckboxPrimitive.Root.Props, "checked"> {
  checked?: boolean | "indeterminate";
}

const Checkbox = Object.assign(
  React.forwardRef<
    React.ComponentRef<typeof CheckboxPrimitive.Root>,
    CheckboxProps
  >(({ className, checked, indeterminate, ...props }, ref) => {
    const isIndeterminate = indeterminate || checked === "indeterminate";
    const isChecked = checked === "indeterminate" ? false : checked;

    return (
      <CheckboxPrimitive.Root
        ref={ref}
        checked={isChecked}
        indeterminate={isIndeterminate}
        className={cn(
          "peer grid size-4 shrink-0 place-content-center rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground data-indeterminate:border-primary data-indeterminate:bg-primary data-indeterminate:text-primary-foreground [&_svg]:size-3",
          className
        )}
        {...props}
      >
        <CheckboxPrimitive.Indicator
          className={cn("grid place-content-center text-current")}
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
      </CheckboxPrimitive.Root>
    );
  }),
  {
    Root: CheckboxPrimitive.Root,
    Indicator: CheckboxPrimitive.Indicator,
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
