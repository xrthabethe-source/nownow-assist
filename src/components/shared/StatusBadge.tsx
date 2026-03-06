import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-secondary text-secondary-foreground",
        success: "bg-success/10 text-success",
        warning: "bg-accent/10 text-accent",
        destructive: "bg-destructive/10 text-destructive",
        primary: "bg-primary/10 text-primary",
        outline: "border border-border bg-transparent text-foreground",
        online: "bg-success/10 text-success",
        offline: "bg-muted text-muted-foreground",
        pending: "bg-accent/10 text-accent",
        active: "bg-primary/10 text-primary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  pulse?: boolean;
}

export const StatusBadge = ({
  className,
  variant,
  pulse,
  children,
  ...props
}: StatusBadgeProps) => {
  return (
    <span className={cn(badgeVariants({ variant, className }))} {...props}>
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span
            className={cn(
              "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
              variant === "success" && "bg-success",
              variant === "warning" && "bg-accent",
              variant === "destructive" && "bg-destructive",
              variant === "primary" && "bg-primary",
              variant === "online" && "bg-success",
              variant === "active" && "bg-primary"
            )}
          />
          <span
            className={cn(
              "relative inline-flex h-2 w-2 rounded-full",
              variant === "success" && "bg-success",
              variant === "warning" && "bg-accent",
              variant === "destructive" && "bg-destructive",
              variant === "primary" && "bg-primary",
              variant === "online" && "bg-success",
              variant === "active" && "bg-primary"
            )}
          />
        </span>
      )}
      {children}
    </span>
  );
};
