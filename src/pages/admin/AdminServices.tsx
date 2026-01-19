import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  RefreshCw,
  Wrench,
  DollarSign,
  Clock,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";

interface Service {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  base_price: number;
  price_per_km: number | null;
  surge_multiplier: number | null;
  eta_minutes: number | null;
  is_active: boolean | null;
  created_at: string;
}

export default function AdminServices() {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    base_price: 0,
    price_per_km: 0,
    surge_multiplier: 1,
    eta_minutes: 30,
    is_active: true,
  });
  const queryClient = useQueryClient();

  const { data: services, isLoading, refetch } = useQuery({
    queryKey: ["admin-services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as Service[];
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (selectedService) {
        const { error } = await supabase
          .from("services")
          .update(data)
          .eq("id", selectedService.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("services").insert({ ...data, name: data.name });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(selectedService ? "Service updated" : "Service created");
      queryClient.invalidateQueries({ queryKey: ["admin-services"] });
      setEditDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("Failed to save service: " + error.message);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("services")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Service status updated");
      queryClient.invalidateQueries({ queryKey: ["admin-services"] });
    },
    onError: (error) => {
      toast.error("Failed to update status: " + error.message);
    },
  });

  const resetForm = () => {
    setSelectedService(null);
    setFormData({
      name: "",
      description: "",
      base_price: 0,
      price_per_km: 0,
      surge_multiplier: 1,
      eta_minutes: 30,
      is_active: true,
    });
  };

  const handleEdit = (service: Service) => {
    setSelectedService(service);
    setFormData({
      name: service.name,
      description: service.description || "",
      base_price: service.base_price,
      price_per_km: service.price_per_km || 0,
      surge_multiplier: service.surge_multiplier || 1,
      eta_minutes: service.eta_minutes || 30,
      is_active: service.is_active ?? true,
    });
    setEditDialogOpen(true);
  };

  const handleSubmit = () => {
    upsertMutation.mutate(formData);
  };

  const [activeFilter, setActiveFilter] = useState<string>("all");

  const stats = {
    total: services?.length || 0,
    active: services?.filter((s) => s.is_active).length || 0,
    inactive: services?.filter((s) => !s.is_active).length || 0,
    avgPrice:
      services && services.length > 0
        ? services.reduce((acc, s) => acc + s.base_price, 0) / services.length
        : 0,
  };

  const filteredServices = services?.filter((service) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "active") return service.is_active;
    if (activeFilter === "inactive") return !service.is_active;
    return true;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Services Management</h1>
            <p className="text-muted-foreground">Configure available services and pricing</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Service
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {selectedService ? "Edit Service" : "Add New Service"}
                  </DialogTitle>
                  <DialogDescription>
                    Configure the service details and pricing
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Service Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="e.g., Tyre Change"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      placeholder="Brief description of the service"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="base_price">Base Price (R)</Label>
                      <Input
                        id="base_price"
                        type="number"
                        value={formData.base_price}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            base_price: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price_per_km">Price per KM (R)</Label>
                      <Input
                        id="price_per_km"
                        type="number"
                        value={formData.price_per_km}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            price_per_km: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="surge_multiplier">Surge Multiplier</Label>
                      <Input
                        id="surge_multiplier"
                        type="number"
                        step="0.1"
                        value={formData.surge_multiplier}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            surge_multiplier: parseFloat(e.target.value) || 1,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="eta_minutes">Est. ETA (mins)</Label>
                      <Input
                        id="eta_minutes"
                        type="number"
                        value={formData.eta_minutes}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            eta_minutes: parseInt(e.target.value) || 30,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="is_active">Active</Label>
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_active: checked })
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={upsertMutation.isPending}>
                    {upsertMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card 
              className={`cursor-pointer transition-all hover:shadow-md hover:border-primary/50 ${activeFilter === "all" ? "ring-2 ring-primary" : ""}`}
              onClick={() => setActiveFilter("all")}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <Wrench className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total Services</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card 
              className={`cursor-pointer transition-all hover:shadow-md hover:border-success/50 ${activeFilter === "active" ? "ring-2 ring-success" : ""}`}
              onClick={() => setActiveFilter("active")}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-full bg-success/10 p-3">
                  <Zap className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.active}</p>
                  <p className="text-sm text-muted-foreground">Active Services</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-full bg-warning/10 p-3">
                  <DollarSign className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">R{stats.avgPrice.toFixed(0)}</p>
                  <p className="text-sm text-muted-foreground">Avg. Base Price</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Services Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Services</CardTitle>
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
                    <TableHead>Service</TableHead>
                    <TableHead>Base Price</TableHead>
                    <TableHead>Price/KM</TableHead>
                    <TableHead>Surge</TableHead>
                    <TableHead>Est. ETA</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredServices?.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{service.name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {service.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        R{service.base_price.toFixed(2)}
                      </TableCell>
                      <TableCell>R{service.price_per_km?.toFixed(2) || "0.00"}</TableCell>
                      <TableCell>
                        <span className={service.surge_multiplier && service.surge_multiplier > 1 ? "text-warning font-medium" : ""}>
                          {service.surge_multiplier?.toFixed(1) || "1.0"}x
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {service.eta_minutes || 30} min
                        </div>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={service.is_active ?? true}
                          onCheckedChange={(checked) =>
                            toggleActiveMutation.mutate({ id: service.id, is_active: checked })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(service)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
