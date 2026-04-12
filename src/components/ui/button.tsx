import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-base font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        // Primary CTA: Brand Blue
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary",
        // Secondary: Light blue surface
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        // Destructive
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        // Outline: Blue border
        outline: "border-2 border-primary/20 bg-transparent text-primary hover:bg-primary/5 hover:border-primary/40",
        // Ghost
        ghost: "text-foreground hover:bg-muted",
        // Link style
        link: "text-primary underline-offset-4 hover:underline",
        // Amber/CTA: Orange action
        amber: "bg-accent text-accent-foreground hover:bg-accent/90 shadow-accent",
        // Dark variant: Deep Blue solid
        dark: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary",
        // Glass
        glass: "bg-card/80 backdrop-blur-xl border border-border text-foreground hover:bg-card/90",
        // Success
        success: "bg-success text-success-foreground hover:bg-success/90",
        // Warning
        warning: "bg-warning text-warning-foreground hover:bg-warning/90",
        // SOS Emergency
        sos: "bg-destructive text-destructive-foreground animate-pulse-amber hover:bg-destructive/90",
        // Light: White button
        light: "bg-card text-primary hover:bg-card/90 shadow-md border border-border",
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
