import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import logoImage from "@/assets/logo.png";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "dark" | "light";
  showText?: boolean;
}

const sizeClasses = {
  sm: "h-12",
  md: "h-16",
  lg: "h-20",
  xl: "h-28",
};

export const Logo = ({
  className,
  size = "md",
  variant = "default",
  showText = true,
}: LogoProps) => {
  return (
    <motion.div
      className={cn("flex items-center", className)}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <img
        src={logoImage}
        alt="Now-Now Assist"
        className={cn(
          "object-contain drop-shadow-lg",
          showText && size === "sm" && "h-14 w-auto",
          showText && size === "md" && "h-18 w-auto",
          showText && size === "lg" && "h-24 w-auto",
          showText && size === "xl" && "h-32 w-auto",
          !showText && size === "sm" && "h-12 w-12",
          !showText && size === "md" && "h-16 w-16",
          !showText && size === "lg" && "h-20 w-20",
          !showText && size === "xl" && "h-28 w-28",
          !showText && "object-cover object-center"
        )}
      />
    </motion.div>
  );
};
