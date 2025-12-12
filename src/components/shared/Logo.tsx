import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "dark" | "light";
  showText?: boolean;
}

const sizeClasses = {
  sm: "h-8",
  md: "h-10",
  lg: "h-12",
  xl: "h-16",
};

const textSizeClasses = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-2xl",
  xl: "text-3xl",
};

export const Logo = ({
  className,
  size = "md",
  variant = "default",
  showText = true,
}: LogoProps) => {
  return (
    <motion.div
      className={cn("flex items-center gap-2", className)}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div
        className={cn(
          "relative flex items-center justify-center rounded-xl bg-gradient-amber",
          sizeClasses[size],
          size === "sm" && "w-8",
          size === "md" && "w-10",
          size === "lg" && "w-12",
          size === "xl" && "w-16"
        )}
      >
        <motion.div
          className="absolute inset-0 rounded-xl bg-gradient-amber opacity-50 blur-md"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <span
          className={cn(
            "relative font-extrabold text-primary-foreground",
            size === "sm" && "text-sm",
            size === "md" && "text-base",
            size === "lg" && "text-lg",
            size === "xl" && "text-2xl"
          )}
        >
          NN
        </span>
      </div>
      {showText && (
        <div className="flex flex-col">
          <span
            className={cn(
              "font-extrabold leading-none tracking-tight",
              textSizeClasses[size],
              variant === "default" && "text-foreground",
              variant === "dark" && "text-brand-dark",
              variant === "light" && "text-brand-white"
            )}
          >
            Now-Now
          </span>
          <span
            className={cn(
              "font-medium leading-none",
              size === "sm" && "text-xs",
              size === "md" && "text-sm",
              size === "lg" && "text-base",
              size === "xl" && "text-lg",
              variant === "default" && "text-primary",
              variant === "dark" && "text-primary",
              variant === "light" && "text-primary"
            )}
          >
            Assist
          </span>
        </div>
      )}
    </motion.div>
  );
};
