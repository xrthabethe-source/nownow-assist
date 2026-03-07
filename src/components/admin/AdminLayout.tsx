import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/Logo";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { RoleSwitcher } from "@/components/shared/RoleSwitcher";
import { useAuth } from "@/hooks/useAuth";
import { NotificationBell } from "./NotificationBell";
import {
  LayoutDashboard,
  Users,
  Car,
  DollarSign,
  CreditCard,
  AlertTriangle,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Search,
  Menu,
  Wrench,
  BarChart3,
  Shield,
  FileText,
  TrendingUp,
  Wallet,
  MapPin,
  Clock,
  HelpCircle,
  Database,
  Lock,
  ShieldAlert,
  Globe,
  Palette,
  Mail,
  Smartphone,
  ChevronDown,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
  badge?: string;
  badgeVariant?: "default" | "destructive" | "warning" | "success";
}

const navSections: NavSection[] = [
  {
    title: "Overview",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
      { icon: TrendingUp, label: "Analytics", path: "/admin/reports", badge: "New", badgeVariant: "success" },
      { icon: AlertTriangle, label: "Notifications", path: "/admin/notifications" },
    ],
  },
  {
    title: "User Management",
    items: [
      { icon: Users, label: "Team & Access", path: "/admin/users" },
      { icon: Car, label: "Drivers", path: "/admin/drivers" },
      { icon: Shield, label: "Verification Queue", path: "/admin/verification-queue", badge: "New", badgeVariant: "warning" },
      { icon: Users, label: "Customers", path: "/admin/customers" },
    ],
  },
  {
    title: "Operations",
    items: [
      { icon: MapPin, label: "Live Jobs", path: "/admin?view=jobs" },
      { icon: Wrench, label: "Services", path: "/admin/services" },
      { icon: Clock, label: "Job History", path: "/admin/reports?type=jobs" },
    ],
  },
  {
    title: "Finance",
    items: [
      { icon: DollarSign, label: "Pricing", path: "/admin/pricing" },
      { icon: CreditCard, label: "Payments", path: "/admin/payments" },
      { icon: Wallet, label: "Payouts", path: "/admin/payments?tab=payouts" },
      { icon: FileText, label: "Invoices", path: "/admin/payments?tab=invoices" },
    ],
  },
  {
    title: "Support & Disputes",
    items: [
      { icon: AlertTriangle, label: "Disputes", path: "/admin/disputes", badge: "3", badgeVariant: "destructive" },
      { icon: HelpCircle, label: "Support Tickets", path: "/admin/disputes?tab=support" },
    ],
  },
  {
    title: "Security & Compliance",
    items: [
      { icon: ShieldAlert, label: "Security Monitor", path: "/admin/security", badge: "New", badgeVariant: "destructive" },
      { icon: Shield, label: "Audit Logs", path: "/admin/audit" },
      { icon: Lock, label: "Security Settings", path: "/admin/settings?tab=security" },
      { icon: Database, label: "Data Management", path: "/admin/settings?tab=data" },
    ],
  },
  {
    title: "Configuration",
    items: [
      { icon: Settings, label: "General Settings", path: "/admin/settings" },
      { icon: Palette, label: "Branding", path: "/admin/settings?tab=branding" },
      { icon: Globe, label: "Regions", path: "/admin/settings?tab=regions" },
      { icon: Mail, label: "Notifications", path: "/admin/settings?tab=notifications" },
      { icon: Smartphone, label: "Mobile App", path: "/admin/settings?tab=mobile" },
    ],
  },
];

// Flattened nav items for quick lookup
const allNavItems = navSections.flatMap((section) => section.items);

export function AdminLayout({ children }: AdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(
    navSections.map((s) => s.title) // All sections expanded by default
  );
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  // Close mobile sidebar when route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const toggleSection = (title: string) => {
    setExpandedSections((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  const isActiveItem = (itemPath: string) => {
    const [basePath, query] = itemPath.split("?");
    const currentPath = location.pathname;
    const currentSearch = location.search;
    
    // If paths don't match, not active
    if (currentPath !== basePath) return false;
    
    // If item has no query params, it's active only if current URL also has no query params
    if (!query) return !currentSearch || currentSearch === "";
    
    // If item has query params, check if current URL contains them
    const itemParams = new URLSearchParams(query);
    const currentParams = new URLSearchParams(currentSearch);
    
    // All item params must match current params
    for (const [key, value] of itemParams.entries()) {
      if (currentParams.get(key) !== value) return false;
    }
    return true;
  };

  const NavContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div
        className={cn(
          "flex items-center gap-3 border-b border-sidebar-border p-4",
          collapsed && !mobile && "justify-center"
        )}
      >
        <Logo size="lg" />
        <AnimatePresence>
          {(!collapsed || mobile) && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-sidebar-foreground">
                  Now-Now
                </span>
                <span className="text-xs text-muted-foreground">Admin Portal</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav Sections */}
      <ScrollArea className="flex-1">
        <nav className="space-y-1 p-3">
          {navSections.map((section, sectionIndex) => {
            const isExpanded = expandedSections.includes(section.title);
            const hasActiveItem = section.items.some((item) => isActiveItem(item.path));

            return (
              <div key={section.title}>
                {sectionIndex > 0 && !collapsed && (
                  <Separator className="my-3 bg-sidebar-border/50" />
                )}

                {collapsed && !mobile ? (
                  // Collapsed: show only icons
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const isActive = isActiveItem(item.path);
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => mobile && setMobileOpen(false)}
                          title={item.label}
                          className={cn(
                            "flex items-center justify-center rounded-xl p-2.5 transition-all",
                            isActive
                              ? "bg-primary text-primary-foreground shadow-md"
                              : "text-sidebar-foreground hover:bg-sidebar-accent"
                          )}
                        >
                          <item.icon className="h-5 w-5 shrink-0" />
                          {item.badge && (
                            <span
                              className={cn(
                                "absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold",
                                item.badgeVariant === "destructive" &&
                                  "bg-destructive text-destructive-foreground",
                                item.badgeVariant === "warning" &&
                                  "bg-warning text-warning-foreground",
                                item.badgeVariant === "success" &&
                                  "bg-success text-success-foreground",
                                (!item.badgeVariant || item.badgeVariant === "default") &&
                                  "bg-primary text-primary-foreground"
                              )}
                            >
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  // Expanded: show collapsible sections
                  <Collapsible
                    open={isExpanded}
                    onOpenChange={() => toggleSection(section.title)}
                  >
                    <CollapsibleTrigger asChild>
                      <button
                        className={cn(
                          "flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:bg-sidebar-accent",
                          hasActiveItem && "text-primary"
                        )}
                      >
                        {section.title}
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-transform",
                            isExpanded && "rotate-180"
                          )}
                        />
                      </button>
                    </CollapsibleTrigger>

                    <CollapsibleContent className="space-y-1 pt-1">
                      {section.items.map((item) => {
                        const isActive = isActiveItem(item.path);
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => mobile && setMobileOpen(false)}
                            className={cn(
                              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                              isActive
                                ? "bg-primary text-primary-foreground shadow-md"
                                : "text-sidebar-foreground hover:bg-sidebar-accent"
                            )}
                          >
                            <item.icon
                              className={cn(
                                "h-5 w-5 shrink-0",
                                isActive && "text-primary-foreground"
                              )}
                            />
                            <span className="flex-1">{item.label}</span>
                            {item.badge && (
                              <span
                                className={cn(
                                  "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
                                  item.badgeVariant === "destructive" &&
                                    "bg-destructive text-destructive-foreground",
                                  item.badgeVariant === "warning" &&
                                    "bg-warning text-warning-foreground",
                                  item.badgeVariant === "success" &&
                                    "bg-success text-success-foreground",
                                  (!item.badgeVariant || item.badgeVariant === "default") &&
                                    "bg-muted text-muted-foreground",
                                  isActive && "bg-primary-foreground/20 text-primary-foreground"
                                )}
                              >
                                {item.badge}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </div>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3">
        {/* User Info (mobile or expanded) */}
        {(!collapsed || mobile) && (
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-sidebar-accent/50 p-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {user?.email?.charAt(0).toUpperCase() || "A"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-sidebar-foreground">
                Admin
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {user?.email}
              </p>
            </div>
          </div>
        )}

        {/* Sign Out */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className={cn(
            "w-full text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive",
            collapsed && !mobile ? "justify-center" : "justify-start"
          )}
        >
          <LogOut className="h-4 w-4" />
          {(!collapsed || mobile) && <span className="ml-2">Sign Out</span>}
        </Button>

        {/* Collapse Button (desktop only) */}
        {!mobile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "mt-2 w-full text-sidebar-foreground",
              collapsed ? "justify-center" : "justify-start"
            )}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
            {!collapsed && <span className="ml-2">Collapse</span>}
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-secondary">
      {/* Desktop Sidebar - Deep Blue */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 72 : 280 }}
        className="hidden border-r border-sidebar-border bg-sidebar lg:block"
      >
        <NavContent />
      </motion.aside>

      {/* Main Content - Light background */}
      <div className="flex flex-1 flex-col">
        {/* Header - White */}
        <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between px-4 lg:px-6">
            {/* Left side */}
            <div className="flex items-center gap-4">
              {/* Mobile menu */}
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild className="lg:hidden">
                  <Button variant="ghost" size="icon-sm">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 p-0 flex flex-col h-full">
                  <NavContent mobile />
                </SheetContent>
              </Sheet>

              <StatusBadge variant="online" pulse className="hidden sm:flex">
                Live Operations
              </StatusBadge>

              {/* Search */}
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search jobs, users, drivers..."
                  className="w-80 pl-10"
                />
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              <RoleSwitcher />
              <NotificationBell />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm" className="rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {user?.email?.charAt(0).toUpperCase() || "A"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">Admin</span>
                      <span className="text-xs text-muted-foreground">
                        {user?.email}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/admin/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/admin/audit">
                      <Shield className="mr-2 h-4 w-4" />
                      Audit Logs
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}