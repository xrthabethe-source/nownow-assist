import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const cardVariants = cva(
  "rounded-2xl border transition-all duration-200",
  {
    variants: {
      variant: {
        // Default: Soft Grey for secondary panels on blue backgrounds
        default: "bg-secondary text-secondary-foreground border-border/50 shadow-sm",
        // Elevated: Soft Grey with stronger shadow
        elevated: "bg-secondary text-secondary-foreground border-border/50 shadow-lg hover:shadow-xl",
        // Glass: Translucent dark for overlays
        glass: "bg-primary/80 backdrop-blur-xl border-border/50 text-white",
        // Outline: Transparent with visible border
        outline: "bg-transparent border-2 border-white/20 text-white",
        // Primary surface: Deep Trust Blue background
        primary: "bg-primary text-primary-foreground border-primary/50 shadow-md",
        // Amber/Accent highlight card
        amber: "bg-accent/15 border-accent/30 text-white",
        // Dark: Deep Trust Blue solid
        dark: "bg-primary text-white border-transparent shadow-lg",
        // Interactive: Soft Grey with hover states
        interactive: "bg-secondary text-secondary-foreground border-border/50 shadow-sm hover:shadow-md hover:border-accent/50 cursor-pointer",
        // Status variants
        success: "bg-success/15 border-success/30 text-white",
        warning: "bg-warning/15 border-warning/30 text-white",
        destructive: "bg-destructive/15 border-destructive/30 text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, className }))}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  )
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-xl font-bold leading-none tracking-tight", className)} {...props} />
  )
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  )
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  )
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants };
