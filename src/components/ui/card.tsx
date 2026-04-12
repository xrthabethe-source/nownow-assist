import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const cardVariants = cva(
  "rounded-2xl border transition-all duration-200",
  {
    variants: {
      variant: {
        // Default: White card with subtle border
        default: "bg-card text-card-foreground border-border shadow-sm",
        // Elevated: White with stronger shadow
        elevated: "bg-card text-card-foreground border-border shadow-lg hover:shadow-xl",
        // Glass: Translucent white
        glass: "bg-card/80 backdrop-blur-xl border-border text-foreground",
        // Outline: Transparent with visible border
        outline: "bg-transparent border-2 border-border text-foreground",
        // Primary surface: Blue background
        primary: "bg-primary text-primary-foreground border-primary/50 shadow-md",
        // Amber/Accent: Light orange tint
        amber: "bg-accent/5 border-accent/20 text-foreground",
        // Dark: Deep blue solid
        dark: "bg-primary text-primary-foreground border-transparent shadow-lg",
        // Interactive: White with hover states
        interactive: "bg-card text-card-foreground border-border shadow-sm hover:shadow-md hover:border-primary/30 cursor-pointer",
        // Status variants
        success: "bg-success/5 border-success/20 text-foreground",
        warning: "bg-warning/5 border-warning/20 text-foreground",
        destructive: "bg-destructive/5 border-destructive/20 text-foreground",
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
