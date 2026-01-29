import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Check, ChevronDown, Shield, Car, User } from "lucide-react";
import { cn } from "@/lib/utils";

type AppRole = "admin" | "driver" | "customer";

interface RoleConfig {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  color: string;
}

const roleConfigs: Record<AppRole, RoleConfig> = {
  admin: {
    label: "Admin",
    icon: Shield,
    path: "/admin",
    color: "text-purple-500",
  },
  driver: {
    label: "Driver",
    icon: Car,
    path: "/driver",
    color: "text-blue-500",
  },
  customer: {
    label: "Customer",
    icon: User,
    path: "/customer",
    color: "text-primary",
  },
};

interface RoleSwitcherProps {
  variant?: "default" | "compact";
  className?: string;
}

export function RoleSwitcher({ variant = "default", className }: RoleSwitcherProps) {
  const { user, role: activeRole } = useAuth();
  const navigate = useNavigate();
  const [allRoles, setAllRoles] = useState<AppRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all roles for the current user
  useEffect(() => {
    const fetchAllRoles = async () => {
      if (!user?.id) {
        setAllRoles([]);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);

        if (error) {
          console.error("Error fetching user roles:", error);
          setAllRoles(activeRole ? [activeRole] : []);
        } else {
          const roles = data?.map((d) => d.role as AppRole) || [];
          // Sort by priority: admin > driver > customer
          const sortedRoles = roles.sort((a, b) => {
            const priority: Record<AppRole, number> = { admin: 0, driver: 1, customer: 2 };
            return priority[a] - priority[b];
          });
          setAllRoles(sortedRoles);
        }
      } catch (error) {
        console.error("Error fetching user roles:", error);
        setAllRoles(activeRole ? [activeRole] : []);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllRoles();
  }, [user?.id, activeRole]);

  // Don't render if user has only one role or no roles
  if (isLoading || allRoles.length <= 1) {
    return null;
  }

  const currentRoleConfig = activeRole ? roleConfigs[activeRole] : null;
  const CurrentIcon = currentRoleConfig?.icon || User;

  const handleRoleSwitch = (targetRole: AppRole) => {
    if (targetRole === activeRole) return;
    
    const config = roleConfigs[targetRole];
    navigate(config.path);
  };

  if (variant === "compact") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn("gap-1.5 h-8 px-2", className)}
          >
            <CurrentIcon className={cn("h-4 w-4", currentRoleConfig?.color)} />
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Switch Role
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {allRoles.map((role) => {
            const config = roleConfigs[role];
            const Icon = config.icon;
            const isActive = role === activeRole;

            return (
              <DropdownMenuItem
                key={role}
                onClick={() => handleRoleSwitch(role)}
                className={cn("gap-2", isActive && "bg-accent")}
              >
                <Icon className={cn("h-4 w-4", config.color)} />
                <span className="flex-1">{config.label}</span>
                {isActive && <Check className="h-4 w-4 text-primary" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("gap-2 h-9", className)}
        >
          <CurrentIcon className={cn("h-4 w-4", currentRoleConfig?.color)} />
          <span className="hidden sm:inline">{currentRoleConfig?.label}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Switch Dashboard
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {allRoles.map((role) => {
          const config = roleConfigs[role];
          const Icon = config.icon;
          const isActive = role === activeRole;

          return (
            <DropdownMenuItem
              key={role}
              onClick={() => handleRoleSwitch(role)}
              className={cn(
                "gap-2 cursor-pointer",
                isActive && "bg-accent"
              )}
            >
              <Icon className={cn("h-4 w-4", config.color)} />
              <span className="flex-1 font-medium">{config.label}</span>
              {isActive && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
