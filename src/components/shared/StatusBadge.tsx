import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-secondary text-secondary-foreground",
        success: "bg-success/15 text-success",
        warning: "bg-warning/15 text-warning",
        destructive: "bg-destructive/15 text-destructive",
        primary: "bg-primary/15 text-primary",
        outline: "border border-border bg-transparent",
        online: "bg-success/15 text-success",
        offline: "bg-muted text-muted-foreground",
        pending: "bg-warning/15 text-warning",
        active: "bg-primary/15 text-primary",
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
              variant === "warning" && "bg-warning",
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
              variant === "warning" && "bg-warning",
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
