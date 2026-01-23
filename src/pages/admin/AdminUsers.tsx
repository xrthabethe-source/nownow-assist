import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Search,
  MoreVertical,
  Users,
  Car,
  Shield,
  RefreshCw,
  UserPlus,
  KeyRound,
  Settings,
  FileText,
  DollarSign,
  AlertTriangle,
  BarChart3,
} from "lucide-react";
import { motion } from "framer-motion";

type AppRole = "admin" | "driver" | "customer";

interface UserWithRole {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
  role: AppRole;
  permissions?: string[];
}

// Demo users data - only office staff and drivers
const demoUsers: UserWithRole[] = [
  {
    id: "usr-003",
    email: "samuel.khumalo@email.com",
    full_name: "Samuel Khumalo",
    avatar_url: null,
    phone: "+27 84 345 6789",
    created_at: "2025-03-10T14:20:00Z",
    role: "driver",
  },
  {
    id: "usr-004",
    email: "david.okonkwo@email.com",
    full_name: "David Okonkwo",
    avatar_url: null,
    phone: "+27 85 456 7890",
    created_at: "2025-05-02T09:15:00Z",
    role: "driver",
  },
  {
    id: "usr-005",
    email: "admin@nownow.co.za",
    full_name: "Admin User",
    avatar_url: null,
    phone: "+27 86 567 8901",
    created_at: "2024-01-01T00:00:00Z",
    role: "admin",
    permissions: ["all"],
  },
  {
    id: "usr-007",
    email: "blessing.ndlovu@email.com",
    full_name: "Blessing Ndlovu",
    avatar_url: null,
    phone: "+27 88 789 0123",
    created_at: "2025-09-25T16:00:00Z",
    role: "driver",
  },
  {
    id: "usr-008",
    email: "ops.manager@nownow.co.za",
    full_name: "Operations Manager",
    avatar_url: null,
    phone: "+27 82 111 2222",
    created_at: "2025-03-15T09:00:00Z",
    role: "admin",
    permissions: ["jobs", "drivers", "disputes"],
  },
  {
    id: "usr-009",
    email: "finance@nownow.co.za",
    full_name: "Finance Admin",
    avatar_url: null,
    phone: "+27 83 333 4444",
    created_at: "2025-04-20T10:30:00Z",
    role: "admin",
    permissions: ["payments", "reports", "pricing"],
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

export default function AdminUsers() {
  const [activeTab, setActiveTab] = useState("office");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState<AppRole>("admin");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // New user form state
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserPhone, setNewUserPhone] = useState("");
  const [newUserRole, setNewUserRole] = useState<AppRole>("admin");
  const [newUserPermissions, setNewUserPermissions] = useState<string[]>(["users"]);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  
  const queryClient = useQueryClient();

  const { data: fetchedUsers, isLoading, refetch } = useQuery({
    queryKey: ["admin-users-team"],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      if (!profiles || profiles.length === 0) {
        return demoUsers;
      }

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      const rolesMap = new Map(roles?.map((r) => [r.user_id, r.role as AppRole]));

      // Only include admins and drivers (not customers)
      return (profiles || [])
        .map((profile, index) => ({
          ...profile,
          role: rolesMap.get(profile.id) || "customer",
          permissions: rolesMap.get(profile.id) === "admin" 
            ? (index === 0 ? ["all"] : ["users", "jobs"]) 
            : undefined,
        }))
        .filter((u) => u.role !== "customer") as UserWithRole[];
    },
  });

  const users = fetchedUsers || [];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from("user_roles")
        .update({ role })
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("User role updated successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setRoleDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error) => {
      toast.error("Failed to update role: " + error.message);
    },
  });

  // Drivers only
  const driverUsers = users.filter((u) => u.role === "driver");
  const filteredDriverUsers = driverUsers.filter((user) => {
    const matchesSearch =
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Office staff (admins)
  const officeStaff = users.filter((u) => u.role === "admin");
  const filteredOfficeStaff = officeStaff.filter((user) => {
    const matchesSearch =
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const stats = {
    total: users.length,
    drivers: users.filter((u) => u.role === "driver").length,
    admins: users.filter((u) => u.role === "admin").length,
  };

  const handleChangeRole = (user: UserWithRole) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setRoleDialogOpen(true);
  };

  const handleEditPermissions = (user: UserWithRole) => {
    setSelectedUser(user);
    setSelectedPermissions(user.permissions || ["users"]);
    setPermissionsDialogOpen(true);
  };

  const handleSavePermissions = () => {
    if (!selectedUser) return;
    toast.success(`Permissions updated for ${selectedUser.full_name}`);
    setPermissionsDialogOpen(false);
    setSelectedUser(null);
  };

  const togglePermission = (permissionId: string) => {
    if (permissionId === "all") {
      setSelectedPermissions((prev) => prev.includes("all") ? [] : ["all"]);
    } else {
      setSelectedPermissions((prev) => {
        const withoutAll = prev.filter((p) => p !== "all");
        if (prev.includes(permissionId)) {
          return withoutAll.filter((p) => p !== permissionId);
        }
        return [...withoutAll, permissionId];
      });
    }
  };

  const toggleNewUserPermission = (permissionId: string) => {
    if (permissionId === "all") {
      setNewUserPermissions((prev) => prev.includes("all") ? [] : ["all"]);
    } else {
      setNewUserPermissions((prev) => {
        const withoutAll = prev.filter((p) => p !== "all");
        if (prev.includes(permissionId)) {
          return withoutAll.filter((p) => p !== permissionId);
        }
        return [...withoutAll, permissionId];
      });
    }
  };

  const resetAddUserForm = () => {
    setNewUserEmail("");
    setNewUserPassword("");
    setNewUserName("");
    setNewUserPhone("");
    setNewUserRole("admin");
    setNewUserPermissions(["users"]);
  };

  const handleAddUser = async () => {
    if (!newUserEmail || !newUserName || !newUserPassword) {
      toast.error("Please fill in email, name, and password");
      return;
    }

    if (newUserPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (newUserRole === "admin" && newUserPermissions.length === 0) {
      toast.error("Please select at least one permission for admin users");
      return;
    }

    setIsCreatingUser(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast.error("You must be logged in to create users");
        return;
      }

      const response = await supabase.functions.invoke("create-user", {
        body: {
          email: newUserEmail,
          password: newUserPassword,
          full_name: newUserName,
          phone: newUserPhone || null,
          role: newUserRole,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast.success(`User "${newUserName}" created successfully as ${newUserRole}`);
      setAddUserDialogOpen(false);
      resetAddUserForm();
      refetch();
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast.error(error.message || "Failed to create user");
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleResetPassword = async (user: UserWithRole) => {
    if (!user.email) {
      toast.error("User has no email address");
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast.error("You must be logged in");
        return;
      }

      const response = await supabase.functions.invoke("reset-user-password", {
        body: { email: user.email },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast.success(`Password reset initiated for ${user.email}`);
    } catch (error: any) {
      console.error("Error resetting password:", error);
      toast.error(error.message || "Failed to reset password");
    }
  };

  const getPermissionLabel = (permissions?: string[]) => {
    if (!permissions || permissions.length === 0) return "No permissions";
    if (permissions.includes("all")) return "Full Access";
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
            <h1 className="text-2xl font-bold">Team & Access</h1>
            <p className="text-muted-foreground">Manage platform users and office staff permissions</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleRefresh} variant="outline" disabled={isRefreshing}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
            <Button onClick={() => setAddUserDialogOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total Team</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-full bg-destructive/10 p-3">
                  <Shield className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.admins}</p>
                  <p className="text-sm text-muted-foreground">Office Staff</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-full bg-warning/10 p-3">
                  <Car className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.drivers}</p>
                  <p className="text-sm text-muted-foreground">Drivers</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="office" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Office Staff
            </TabsTrigger>
            <TabsTrigger value="drivers" className="flex items-center gap-2">
              <Car className="h-4 w-4" />
              Drivers
            </TabsTrigger>
          </TabsList>

          {/* Office Staff Tab */}
          <TabsContent value="office" className="mt-4">
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle>Office Staff</CardTitle>
                  <CardDescription>Employees with access to admin software</CardDescription>
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
                      {filteredOfficeStaff.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={user.avatar_url || undefined} />
                                <AvatarFallback>
                                  {user.full_name?.charAt(0).toUpperCase() || "A"}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{user.full_name || "Unnamed"}</span>
                            </div>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.phone || "-"}</TableCell>
                          <TableCell>
                            <StatusBadge
                              variant={user.permissions?.includes("all") ? "success" : "warning"}
                            >
                              {getPermissionLabel(user.permissions)}
                            </StatusBadge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(user.created_at), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon-sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditPermissions(user)}>
                                  <Shield className="mr-2 h-4 w-4" />
                                  Edit Permissions
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleResetPassword(user)}
                                  disabled={!user.email}
                                >
                                  <KeyRound className="mr-2 h-4 w-4" />
                                  Reset Password
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredOfficeStaff.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No office staff found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Drivers Tab */}
          <TabsContent value="drivers" className="mt-4">
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle>Drivers</CardTitle>
                  <CardDescription>Drivers using the platform</CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search drivers..."
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
                        <TableHead>Driver</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDriverUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={user.avatar_url || undefined} />
                                <AvatarFallback>
                                  {user.full_name?.charAt(0).toUpperCase() || "D"}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{user.full_name || "Unnamed"}</span>
                            </div>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.phone || "-"}</TableCell>
                          <TableCell>
                            {format(new Date(user.created_at), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon-sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleChangeRole(user)}>
                                  <Shield className="mr-2 h-4 w-4" />
                                  Change Role
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleResetPassword(user)}
                                  disabled={!user.email}
                                >
                                  <KeyRound className="mr-2 h-4 w-4" />
                                  Reset Password
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredDriverUsers.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No drivers found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Change Role Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Change the role for {selectedUser?.full_name || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="driver">Driver</SelectItem>
                <SelectItem value="admin">Admin (Office Staff)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                selectedUser && updateRoleMutation.mutate({ userId: selectedUser.id, role: newRole })
              }
              disabled={updateRoleMutation.isPending}
            >
              {updateRoleMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Permissions Dialog */}
      <Dialog open={permissionsDialogOpen} onOpenChange={setPermissionsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Permissions</DialogTitle>
            <DialogDescription>
              Configure access permissions for {selectedUser?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setPermissionsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePermissions}>Save Permissions</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={addUserDialogOpen} onOpenChange={(open) => {
        setAddUserDialogOpen(open);
        if (!open) resetAddUserForm();
      }}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Add a new office staff member or driver to the team.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Min 6 characters"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+27 82 123 4567"
                value={newUserPhone}
                onChange={(e) => setNewUserPhone(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">User Type *</Label>
              <Select value={newUserRole} onValueChange={(v) => setNewUserRole(v as AppRole)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-destructive" />
                      <span>Office Staff (Admin)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="driver">
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-warning" />
                      <span>Driver</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newUserRole === "admin" && (
              <div className="grid gap-2">
                <Label>Permissions *</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-2">
                  {availablePermissions.map((permission) => (
                    <div
                      key={permission.id}
                      className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                        newUserPermissions.includes(permission.id)
                          ? "bg-primary/10"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => toggleNewUserPermission(permission.id)}
                    >
                      <Checkbox
                        checked={newUserPermissions.includes(permission.id)}
                        onCheckedChange={() => toggleNewUserPermission(permission.id)}
                      />
                      <div className="flex items-center gap-2">
                        <permission.icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{permission.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setAddUserDialogOpen(false);
              resetAddUserForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleAddUser} disabled={isCreatingUser}>
              <UserPlus className="mr-2 h-4 w-4" />
              {isCreatingUser ? "Creating..." : "Add User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
