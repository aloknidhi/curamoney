"use client"

import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { cn } from "@/lib/utils"

const Sheet = SheetPrimitive.Root
const SheetTrigger = SheetPrimitive.Trigger
const SheetClose = SheetPrimitive.Close

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content> & { side?: "top" | "right" | "bottom" | "left" }
>(({ className, side = "right", ...props }, ref) => (
  <SheetPrimitive.Portal>
    <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
    <SheetPrimitive.Content
      ref={ref}
      className={cn(
        "fixed z-50 grid w-full max-w-lg translate-y-0 data-[state=closed]:duration-300 data-[state=open]:duration-500 dark:bg-border",
        side === "bottom" &&
          "bottom-0 left-0 h-1/2 w-full rounded-t-xl border-t data-[state=closed]:slide-out-to-bottom-full data-[state=open]:slide-in-from-bottom-full sm:rounded-none sm:h-auto sm:border-b sm:border-t-0",
        side === "left" &&
          "left-0 top-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left-full data-[state=open]:slide-in-from-left-full sm:border-none sm:r",
        side === "right" &&
          "right-0 top-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-right-full sm:border-none sm:l",
        side === "top" &&
          "top-0 left-0 h-1/2 w-full rounded-b-xl border-b data-[state=closed]:slide-out-to-top-full data-[state=open]:slide-in-from-top-full sm:rounded-none sm:h-auto sm:border-t sm:border-b-0",
        className
      )}
      {...props}
    />
  </SheetPrimitive.Portal>
))
SheetContent.displayName = SheetPrimitive.Content.displayName

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 p-6 text-center sm:text-left", className)} {...props} />
)
SheetHeader.displayName = "SheetHeader"

const SheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("mt-4 flex flex-row-reverse gap-2 p-6", className)} {...props} />
)
SheetFooter.displayName = "SheetFooter"

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title ref={ref} className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />
))
SheetTitle.displayName = SheetPrimitive.Title.displayName

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
))
SheetDescription.displayName = SheetPrimitive.Description.displayName

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
