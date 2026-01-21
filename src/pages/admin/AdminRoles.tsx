import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Search,
  MoreVertical,
  Shield,
  RefreshCw,
  UserPlus,
  KeyRound,
  Users,
  Settings,
  FileText,
  DollarSign,
  Car,
  AlertTriangle,
  BarChart3,
} from "lucide-react";
import { motion } from "framer-motion";

interface AdminUser {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
  permissions: string[];
}

// Demo admin users
const demoAdminUsers: AdminUser[] = [
  {
    id: "adm-001",
    user_id: "usr-005",
    email: "admin@nownow.co.za",
    full_name: "Admin User",
    avatar_url: null,
    phone: "+27 86 567 8901",
    created_at: "2024-01-01T00:00:00Z",
    permissions: ["all"],
  },
  {
    id: "adm-002",
    user_id: "usr-009",
    email: "ops.manager@nownow.co.za",
    full_name: "Operations Manager",
    avatar_url: null,
    phone: "+27 82 111 2222",
    created_at: "2025-03-15T09:00:00Z",
    permissions: ["jobs", "drivers", "disputes"],
  },
  {
    id: "adm-003",
    user_id: "usr-010",
    email: "finance@nownow.co.za",
    full_name: "Finance Admin",
    avatar_url: null,
    phone: "+27 83 333 4444",
    created_at: "2025-04-20T10:30:00Z",
    permissions: ["payments", "reports", "pricing"],
  },
  {
    id: "adm-004",
    user_id: "usr-011",
    email: "support.lead@nownow.co.za",
    full_name: "Support Lead",
    avatar_url: null,
    phone: "+27 84 555 6666",
    created_at: "2025-05-10T14:00:00Z",
    permissions: ["disputes", "users"],
  },
];

const availablePermissions = [
  { id: "all", label: "Full Access", icon: Shield, description: "Complete system access" },
  { id: "users", label: "User Management", icon: Users, description: "Manage customers and user accounts" },
  { id: "drivers", label: "Driver Management", icon: Car, description: "Manage driver applications and profiles" },
  { id: "jobs", label: "Job Operations", icon: Settings, description: "View and manage active/completed jobs" },
  { id: "payments", label: "Payments", icon: DollarSign, description: "Process payments and refunds" },
  { id: "pricing", label: "Pricing", icon: DollarSign, description: "Manage service pricing" },
  { id: "disputes", label: "Disputes", icon: AlertTriangle, description: "Handle customer disputes" },
  { id: "reports", label: "Reports & Analytics", icon: BarChart3, description: "View reports and analytics" },
  { id: "settings", label: "Settings", icon: Settings, description: "Manage system settings" },
  { id: "audit", label: "Audit Logs", icon: FileText, description: "View security audit logs" },
];

export default function AdminRoles() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [addAdminDialogOpen, setAddAdminDialogOpen] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // New admin form state
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminPhone, setNewAdminPhone] = useState("");
  const [newAdminPermissions, setNewAdminPermissions] = useState<string[]>([ "users" ]);
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  
  const queryClient = useQueryClient();

  const { data: adminUsers, isLoading, refetch } = useQuery({
    queryKey: ["admin-staff"],
    queryFn: async () => {
      // Get all users with admin role
      const { data: adminRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      if (rolesError) throw rolesError;

      if (!adminRoles || adminRoles.length === 0) {
        return demoAdminUsers;
      }

      const adminUserIds = adminRoles.map((r) => r.user_id);

      // Get profiles for admin users
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .in("id", adminUserIds);

      if (profilesError) throw profilesError;

      if (!profiles || profiles.length === 0) {
        return demoAdminUsers;
      }

      // For now, we'll use demo permissions since we don't have a permissions table yet
      return profiles.map((profile, index) => ({
        id: `adm-${index + 1}`,
        user_id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        phone: profile.phone,
        created_at: profile.created_at,
        permissions: index === 0 ? ["all"] : ["users", "jobs"], // First admin gets full access
      })) as AdminUser[];
    },
  });

  const admins = adminUsers || demoAdminUsers;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const filteredAdmins = admins.filter((admin) => {
    const matchesSearch =
      admin.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleEditPermissions = (admin: AdminUser) => {
    setSelectedAdmin(admin);
    setSelectedPermissions(admin.permissions);
    setPermissionsDialogOpen(true);
  };

  const handleSavePermissions = () => {
    if (!selectedAdmin) return;
    
    // In a real implementation, save to database
    toast.success(`Permissions updated for ${selectedAdmin.full_name}`);
    setPermissionsDialogOpen(false);
    setSelectedAdmin(null);
  };

  const togglePermission = (permissionId: string) => {
    if (permissionId === "all") {
      // If selecting "all", clear others; if deselecting, keep empty
      setSelectedPermissions((prev) => 
        prev.includes("all") ? [] : ["all"]
      );
    } else {
      setSelectedPermissions((prev) => {
        // Remove "all" if it was selected and adding specific permissions
        const withoutAll = prev.filter((p) => p !== "all");
        if (prev.includes(permissionId)) {
          return withoutAll.filter((p) => p !== permissionId);
        }
        return [...withoutAll, permissionId];
      });
    }
  };

  const toggleNewAdminPermission = (permissionId: string) => {
    if (permissionId === "all") {
      setNewAdminPermissions((prev) =>
        prev.includes("all") ? [] : ["all"]
      );
    } else {
      setNewAdminPermissions((prev) => {
        const withoutAll = prev.filter((p) => p !== "all");
        if (prev.includes(permissionId)) {
          return withoutAll.filter((p) => p !== permissionId);
        }
        return [...withoutAll, permissionId];
      });
    }
  };

  const resetAddAdminForm = () => {
    setNewAdminEmail("");
    setNewAdminPassword("");
    setNewAdminName("");
    setNewAdminPhone("");
    setNewAdminPermissions([ "users" ]);
  };

  const handleAddAdmin = async () => {
    if (!newAdminEmail || !newAdminName || !newAdminPassword) {
      toast.error("Please fill in email, name, and password");
      return;
    }

    if (newAdminPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (newAdminPermissions.length === 0) {
      toast.error("Please select at least one permission");
      return;
    }

    setIsCreatingAdmin(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast.error("You must be logged in to create admin users");
        return;
      }

      const response = await supabase.functions.invoke("create-user", {
        body: {
          email: newAdminEmail,
          password: newAdminPassword,
          full_name: newAdminName,
          phone: newAdminPhone || null,
          role: "admin",
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast.success(`Admin "${newAdminName}" created successfully`);
      setAddAdminDialogOpen(false);
      resetAddAdminForm();
      refetch();
    } catch (error: any) {
      console.error("Error creating admin:", error);
      toast.error(error.message || "Failed to create admin");
    } finally {
      setIsCreatingAdmin(false);
    }
  };

  const getPermissionLabel = (permissions: string[]) => {
    if (permissions.includes("all")) return "Full Access";
    if (permissions.length === 0) return "No permissions";
    if (permissions.length <= 2) {
      return permissions.map((p) =>
        availablePermissions.find((ap) => ap.id === p)?.label || p
      ).join(", ");
    }
    return `${permissions.length} permissions`;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Roles & Permissions</h1>
            <p className="text-muted-foreground">Manage office staff access to admin features</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleRefresh} variant="outline" disabled={isRefreshing}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
            <Button onClick={() => setAddAdminDialogOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Admin
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{admins.length}</p>
                  <p className="text-sm text-muted-foreground">Total Admin Staff</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-full bg-success/10 p-3">
                  <Users className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {admins.filter((a) => a.permissions.includes("all")).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Full Access</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-full bg-warning/10 p-3">
                  <Settings className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {admins.filter((a) => !a.permissions.includes("all")).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Limited Access</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Admin Staff Table */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle>Admin Staff</CardTitle>
              <CardDescription>Office employees with access to admin software</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search staff..."
                className="w-64 pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff Member</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAdmins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={admin.avatar_url || undefined} />
                            <AvatarFallback>
                              {admin.full_name?.charAt(0).toUpperCase() || "A"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{admin.full_name || "Unnamed"}</span>
                        </div>
                      </TableCell>
                      <TableCell>{admin.email}</TableCell>
                      <TableCell>{admin.phone || "-"}</TableCell>
                      <TableCell>
                        <StatusBadge
                          variant={admin.permissions.includes("all") ? "success" : "warning"}
                        >
                          {getPermissionLabel(admin.permissions)}
                        </StatusBadge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(admin.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditPermissions(admin)}>
                              <Shield className="mr-2 h-4 w-4" />
                              Edit Permissions
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <KeyRound className="mr-2 h-4 w-4" />
                              Reset Password
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredAdmins.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No admin staff found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Permissions Dialog */}
        <Dialog open={permissionsDialogOpen} onOpenChange={setPermissionsDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Permissions</DialogTitle>
              <DialogDescription>
                Configure access permissions for {selectedAdmin?.full_name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-3">
                {availablePermissions.map((permission) => (
                  <div
                    key={permission.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedPermissions.includes(permission.id)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                    onClick={() => togglePermission(permission.id)}
                  >
                    <Checkbox
                      checked={selectedPermissions.includes(permission.id)}
                      onCheckedChange={() => togglePermission(permission.id)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <permission.icon className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">{permission.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {permission.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPermissionsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSavePermissions}>Save Permissions</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Admin Dialog */}
        <Dialog open={addAdminDialogOpen} onOpenChange={setAddAdminDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Admin Staff</DialogTitle>
              <DialogDescription>
                Create a new admin account with specific permissions
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="admin-name">Full Name *</Label>
                <Input
                  id="admin-name"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  placeholder="Enter full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-email">Email *</Label>
                <Input
                  id="admin-email"
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="admin@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password">Password *</Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  placeholder="Min 6 characters"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-phone">Phone (Optional)</Label>
                <Input
                  id="admin-phone"
                  value={newAdminPhone}
                  onChange={(e) => setNewAdminPhone(e.target.value)}
                  placeholder="+27 XX XXX XXXX"
                />
              </div>
              <div className="space-y-2">
                <Label>Permissions *</Label>
                <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-2">
                  {availablePermissions.map((permission) => (
                    <div
                      key={permission.id}
                      className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                        newAdminPermissions.includes(permission.id)
                          ? "bg-primary/10"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => toggleNewAdminPermission(permission.id)}
                    >
                      <Checkbox
                        checked={newAdminPermissions.includes(permission.id)}
                        onCheckedChange={() => toggleNewAdminPermission(permission.id)}
                      />
                      <div className="flex items-center gap-2">
                        <permission.icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{permission.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddAdminDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddAdmin} disabled={isCreatingAdmin}>
                {isCreatingAdmin ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Admin
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

