import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import logoImage from "@/assets/logo-new.png";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "dark" | "light";
  showText?: boolean;
}

const sizeClasses = {
  sm: "h-10",
  md: "h-14",
  lg: "h-20",
  xl: "h-24",
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
          sizeClasses[size],
          showText ? "w-auto" : "w-auto object-cover object-center"
        )}
      />
    </motion.div>
  );
};
