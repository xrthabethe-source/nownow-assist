import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { toast } from "sonner";
import {
  MessageCircle,
  Plus,
  Copy,
  ExternalLink,
  Inbox,
  Loader2,
  Phone,
  MapPin,
  Wrench,
  Trash2,
} from "lucide-react";

const STATUS_OPTIONS = [
  { value: "new", label: "New", variant: "primary" as const },
  { value: "location_needed", label: "Location Needed", variant: "warning" as const },
  { value: "price_sent", label: "Price Sent", variant: "warning" as const },
  { value: "responder_needed", label: "Responder Needed", variant: "warning" as const },
  { value: "responder_dispatched", label: "Responder Dispatched", variant: "primary" as const },
  { value: "in_progress", label: "In Progress", variant: "primary" as const },
  { value: "completed", label: "Completed", variant: "success" as const },
  { value: "cancelled", label: "Cancelled", variant: "destructive" as const },
];

const ACTIVE_STATUSES = [
  "new",
  "location_needed",
  "price_sent",
  "responder_needed",
  "responder_dispatched",
  "in_progress",
];

const QUICK_REPLIES = [
  {
    label: "Greeting",
    text: "Hi! This is Now-Now Assist. We received your roadside request. Please share your exact location (drop a pin on WhatsApp) so we can dispatch the nearest responder.",
  },
  {
    label: "Request location",
    text: "Please send your live location pin on WhatsApp so we can route the closest responder to you.",
  },
  {
    label: "Price quote",
    text: "Quote for your request: R{price}. Reply YES to confirm and we will dispatch a responder right away.",
  },
  {
    label: "Dispatched",
    text: "Your responder is on the way. Estimated arrival: {eta} minutes. Stay safe and keep your hazards on.",
  },
  {
    label: "Completed",
    text: "Job completed. Thanks for choosing Now-Now Assist! A PayFast link will follow shortly. Stay safe on the road.",
  },
];

const normalizePhone = (raw: string) => raw.replace(/[^\d]/g, "").replace(/^0/, "27");

const buildWaLink = (phone: string, text?: string) => {
  const num = normalizePhone(phone);
  return `https://wa.me/${num}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
};

interface RequestRow {
  id: string;
  customer_name: string;
  customer_phone: string;
  service_id: string | null;
  service_name: string | null;
  pickup_address: string | null;
  notes: string | null;
  status: string;
  assigned_driver_id: string | null;
  estimated_price: number | null;
  eta_minutes: number | null;
  source: string;
  created_at: string;
}

export default function AdminWhatsAppRequests() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<RequestRow | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");

  const { data: services = [] } = useQuery({
    queryKey: ["wa-services"],
    queryFn: async () => {
      const { data } = await supabase
        .from("services")
        .select("id,name")
        .eq("is_active", true)
        .order("name");
      return data || [];
    },
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ["wa-drivers"],
    queryFn: async () => {
      const { data } = await supabase
        .from("drivers")
        .select("id,user_id,vehicle_plate,status")
        .eq("status", "approved");
      if (!data || data.length === 0) return [] as any[];
      const ids = data.map((d) => d.user_id);
      const { data: profs } = await supabase
        .from("profiles")
        .select("id,full_name")
        .in("id", ids);
      return data.map((d) => ({
        ...d,
        full_name: profs?.find((p) => p.id === d.user_id)?.full_name || "Driver",
      }));
    },
  });

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["whatsapp-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as RequestRow[];
    },
    refetchInterval: 30000,
  });

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (serviceFilter !== "all" && r.service_id !== serviceFilter) return false;
      if (dateFilter) {
        const d = new Date(r.created_at).toISOString().slice(0, 10);
        if (d !== dateFilter) return false;
      }
      return true;
    });
  }, [requests, statusFilter, serviceFilter, dateFilter]);

  const activeCount = requests.filter((r) => ACTIVE_STATUSES.includes(r.status)).length;

  const saveMutation = useMutation({
    mutationFn: async (payload: Partial<RequestRow> & { id?: string }) => {
      const { id, ...rest } = payload;
      const service = services.find((s) => s.id === rest.service_id);
      const body: any = { ...rest, service_name: service?.name || rest.service_name };
      if (id) {
        const { error } = await supabase.from("whatsapp_requests").update(body).eq("id", id);
        if (error) throw error;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase
          .from("whatsapp_requests")
          .insert({ ...body, created_by: user?.id, source: "whatsapp" });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["whatsapp-requests"] });
      setDialogOpen(false);
      setEditing(null);
      toast.success("Request saved");
    },
    onError: (e: any) => toast.error(e.message || "Failed to save"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("whatsapp_requests").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["whatsapp-requests"] });
      toast.success("Request deleted");
    },
    onError: (e: any) => toast.error(e.message || "Failed to delete"),
  });

  const updateStatus = (id: string, status: string) => {
    saveMutation.mutate({ id, status });
  };

  const copyReply = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">WhatsApp Requests</h1>
              <StatusBadge variant="warning">Manual WhatsApp Intake</StatusBadge>
            </div>
            <p className="text-sm text-muted-foreground">
              Log and dispatch requests received via WhatsApp. {activeCount} active.
            </p>
          </div>
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <Plus className="mr-2 h-4 w-4" /> New Request
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="grid gap-3 p-4 sm:grid-cols-3">
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Service</Label>
              <Select value={serviceFilter} onValueChange={setServiceFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All services</SelectItem>
                  {services.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Date</Label>
              <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Quick replies */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Replies</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {QUICK_REPLIES.map((r) => (
              <Button
                key={r.label}
                size="sm"
                variant="outline"
                onClick={() => copyReply(r.text)}
              >
                <Copy className="mr-2 h-3 w-3" /> {r.label}
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <Inbox className="h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-semibold">No WhatsApp requests yet</h3>
              <p className="max-w-sm text-sm text-muted-foreground">
                When a customer messages +27 65 663 6685, log it here so it can be tracked
                and dispatched.
              </p>
              <Button
                onClick={() => { setEditing(null); setDialogOpen(true); }}
                className="bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <Plus className="mr-2 h-4 w-4" /> Log first request
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((r) => {
              const status = STATUS_OPTIONS.find((s) => s.value === r.status);
              return (
                <Card key={r.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold">{r.customer_name}</span>
                          <StatusBadge variant={status?.variant || "default"}>
                            {status?.label || r.status}
                          </StatusBadge>
                          <StatusBadge variant="outline">WhatsApp</StatusBadge>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{r.customer_phone}</span>
                          {r.service_name && (
                            <span className="flex items-center gap-1"><Wrench className="h-3 w-3" />{r.service_name}</span>
                          )}
                          {r.pickup_address && (
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{r.pickup_address}</span>
                          )}
                          {r.estimated_price != null && (
                            <span>R{Number(r.estimated_price).toFixed(2)}</span>
                          )}
                          {r.eta_minutes != null && <span>ETA {r.eta_minutes} min</span>}
                        </div>
                        {r.notes && <p className="text-sm">{r.notes}</p>}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Select value={r.status} onValueChange={(v) => updateStatus(r.id, v)}>
                          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((s) => (
                              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button asChild size="sm" variant="outline">
                          <a
                            href={buildWaLink(r.customer_phone)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <MessageCircle className="mr-2 h-4 w-4" /> Open WhatsApp
                            <ExternalLink className="ml-1 h-3 w-3" />
                          </a>
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { setEditing(r); setDialogOpen(true); }}>
                          Edit
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => {
                            if (confirm("Delete this request?")) deleteMutation.mutate(r.id);
                          }}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <RequestDialog
        open={dialogOpen}
        onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}
        editing={editing}
        services={services}
        drivers={drivers}
        onSubmit={(payload) => saveMutation.mutate(payload)}
        saving={saveMutation.isPending}
      />
    </AdminLayout>
  );
}

interface DialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: RequestRow | null;
  services: { id: string; name: string }[];
  drivers: any[];
  onSubmit: (payload: any) => void;
  saving: boolean;
}

function RequestDialog({ open, onOpenChange, editing, services, drivers, onSubmit, saving }: DialogProps) {
  const [form, setForm] = useState<any>(() => editing || {
    customer_name: "",
    customer_phone: "",
    service_id: "",
    pickup_address: "",
    notes: "",
    status: "new",
    assigned_driver_id: "",
    estimated_price: "",
    eta_minutes: "",
  });

  // reset when opening
  useState(() => {});
  const handleOpenChange = (o: boolean) => {
    if (o) {
      setForm(editing || {
        customer_name: "", customer_phone: "", service_id: "", pickup_address: "",
        notes: "", status: "new", assigned_driver_id: "", estimated_price: "", eta_minutes: "",
      });
    }
    onOpenChange(o);
  };

  const submit = () => {
    if (!form.customer_name?.trim() || !form.customer_phone?.trim()) {
      toast.error("Customer name and phone are required");
      return;
    }
    onSubmit({
      ...(editing?.id ? { id: editing.id } : {}),
      customer_name: form.customer_name.trim(),
      customer_phone: form.customer_phone.trim(),
      service_id: form.service_id || null,
      pickup_address: form.pickup_address?.trim() || null,
      notes: form.notes?.trim() || null,
      status: form.status,
      assigned_driver_id: form.assigned_driver_id || null,
      estimated_price: form.estimated_price ? Number(form.estimated_price) : null,
      eta_minutes: form.eta_minutes ? Number(form.eta_minutes) : null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Request" : "New WhatsApp Request"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Customer name *</Label>
              <Input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} />
            </div>
            <div>
              <Label>Phone *</Label>
              <Input placeholder="+27..." value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Service</Label>
            <Select value={form.service_id || ""} onValueChange={(v) => setForm({ ...form, service_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
              <SelectContent>
                {services.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Pickup address / location</Label>
            <Input value={form.pickup_address || ""} onChange={(e) => setForm({ ...form, pickup_address: e.target.value })} />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea rows={3} value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Est. price (R)</Label>
              <Input type="number" value={form.estimated_price || ""} onChange={(e) => setForm({ ...form, estimated_price: e.target.value })} />
            </div>
            <div>
              <Label>ETA (min)</Label>
              <Input type="number" value={form.eta_minutes || ""} onChange={(e) => setForm({ ...form, eta_minutes: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Assign responder</Label>
            <Select value={form.assigned_driver_id || ""} onValueChange={(v) => setForm({ ...form, assigned_driver_id: v })}>
              <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
              <SelectContent>
                {drivers.length === 0 ? (
                  <SelectItem value="__none" disabled>No approved drivers</SelectItem>
                ) : drivers.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.full_name} {d.vehicle_plate ? `(${d.vehicle_plate})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving} className="bg-accent text-accent-foreground hover:bg-accent/90">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editing ? "Save changes" : "Create request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
