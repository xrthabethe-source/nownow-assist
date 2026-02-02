import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-base font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        // Primary CTA: Warm Action Orange #F7931E - main actions
        default: "bg-accent text-white hover:bg-accent/90 shadow-accent",
        // Secondary: Deep Trust Blue #0B2A3D
        secondary: "bg-primary text-white hover:bg-primary/90 shadow-primary",
        // Destructive
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        // Outline: White border for dark backgrounds
        outline: "border-2 border-white/30 bg-transparent text-white hover:bg-white/10 hover:border-white/50",
        // Ghost: Subtle hover for dark backgrounds
        ghost: "text-white hover:bg-white/10",
        // Link style
        link: "text-accent underline-offset-4 hover:underline",
        // Amber/CTA: Warm Action Orange #F7931E - explicit orange button
        amber: "bg-accent text-white hover:bg-accent/90 shadow-accent",
        // Dark variant: Deep Trust Blue solid
        dark: "bg-primary text-white hover:bg-primary/90 shadow-primary",
        // Glass: Translucent for overlays
        glass: "bg-white/10 backdrop-blur-xl border border-white/20 text-white hover:bg-white/20",
        // Success
        success: "bg-success text-success-foreground hover:bg-success/90",
        // Warning
        warning: "bg-warning text-warning-foreground hover:bg-warning/90",
        // SOS Emergency
        sos: "bg-destructive text-destructive-foreground animate-pulse-amber hover:bg-destructive/90",
        // Light: For use on coloured backgrounds needing a light button
        light: "bg-white text-primary hover:bg-white/90 shadow-md",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 rounded-lg px-4 text-sm",
        lg: "h-14 rounded-2xl px-8 text-lg",
        xl: "h-16 rounded-2xl px-10 text-xl",
        icon: "h-12 w-12",
        "icon-sm": "h-10 w-10",
        "icon-lg": "h-14 w-14",
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
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
