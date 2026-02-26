"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const labelVariants = cva(
  "text-sm font-medium text-muted-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

interface LabelProps extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>,
  VariantProps<typeof labelVariants> {
  optional?: boolean
  text: string
}

export const LabelComponent = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  LabelProps
>(({ className, optional = false, text, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  >
    {text}
    {!optional && <span className="text-red-500 ml-0.5">*</span>}
  </LabelPrimitive.Root>
))
LabelComponent.displayName = LabelPrimitive.Root.displayName
