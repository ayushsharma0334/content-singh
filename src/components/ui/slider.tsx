"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label" // Import Label

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
    label?: string; // Optional label prop
    showValue?: boolean; // Optional prop to show value
    valueSuffix?: string; // Optional suffix for the value display (e.g., 'px', '%')
  }
>(({ className, label, showValue = false, valueSuffix = "", ...props }, ref) => {
  const currentValue = props.value?.[0] ?? props.defaultValue?.[0] ?? 0;

  return (
    <div className="grid gap-2">
       {label && ( // Conditionally render Label
         <Label htmlFor={props.id} className="text-sm font-medium">
           {label}
         </Label>
       )}
      <div className={cn("flex items-center gap-3", {'justify-between': showValue})}>
        <SliderPrimitive.Root
          ref={ref}
          className={cn(
            "relative flex w-full touch-none select-none items-center",
            className
          )}
          {...props}
          id={props.id} // Ensure id is passed for label association
        >
          <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
            <SliderPrimitive.Range className="absolute h-full bg-primary" />
          </SliderPrimitive.Track>
          <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
        </SliderPrimitive.Root>
        {showValue && ( // Conditionally render value display
          <span className="text-sm text-muted-foreground font-mono w-12 text-right tabular-nums">
            {currentValue.toFixed(props.step && props.step < 1 ? 2 : 0)}{valueSuffix}
          </span>
        )}
      </div>
    </div>
  )
})
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
