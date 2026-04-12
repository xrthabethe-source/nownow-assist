import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import logoImage from "@/assets/logo-new.png";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "hero";
  variant?: "default" | "dark" | "light";
  showText?: boolean;
}

const sizeClasses = {
  sm: "h-14",
  md: "h-20",
  lg: "h-28",
  xl: "h-36",
  "2xl": "h-52",
  hero: "h-56",
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
        style={{ marginTop: '-8px' }}
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
