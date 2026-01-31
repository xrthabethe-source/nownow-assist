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
  sm: "h-8",
  md: "h-10",
  lg: "h-12",
  xl: "h-14",
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
          "object-contain",
          showText && size === "sm" && "h-8 w-auto",
          showText && size === "md" && "h-10 w-auto",
          showText && size === "lg" && "h-[22px] w-auto",
          showText && size === "xl" && "h-14 w-auto",
          !showText && size === "sm" && "h-8 w-8",
          !showText && size === "md" && "h-10 w-10",
          !showText && size === "lg" && "h-12 w-12",
          !showText && size === "xl" && "h-14 w-14",
          !showText && "object-cover object-center"
        )}
      />
    </motion.div>
  );
};
