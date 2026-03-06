import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Home, Clock, User, MessageCircle } from "lucide-react";
import { NavLink as RouterNavLink } from "react-router-dom";

interface BottomNavProps {
  type: "customer" | "driver";
}

const customerLinks = [
  { to: "/customer", icon: Home, label: "Home" },
  { to: "/customer/history", icon: Clock, label: "History" },
  { to: "/customer/support", icon: MessageCircle, label: "Support" },
  { to: "/customer/profile", icon: User, label: "Profile" },
];

const driverLinks = [
  { to: "/driver", icon: Home, label: "Home" },
  { to: "/driver/earnings", icon: Clock, label: "Earnings" },
  { to: "/driver/support", icon: MessageCircle, label: "Support" },
  { to: "/driver/profile", icon: User, label: "Profile" },
];

export const BottomNav = ({ type }: BottomNavProps) => {
  const links = type === "customer" ? customerLinks : driverLinks;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-white/95 backdrop-blur-xl safe-area-inset-bottom">
      <div className="flex items-center justify-around py-2">
        {links.map((link) => (
          <RouterNavLink
            key={link.to}
            to={link.to}
            end={link.to === "/customer" || link.to === "/driver"}
            className={({ isActive }) =>
              cn(
                "relative flex flex-col items-center gap-1 px-4 py-2 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId={`nav-indicator-${type}`}
                    className="absolute -top-2 left-1/2 h-1 w-8 -translate-x-1/2 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <link.icon className="h-5 w-5" />
                <span className="text-xs font-medium">{link.label}</span>
              </>
            )}
          </RouterNavLink>
        ))}
      </div>
    </nav>
  );
};
