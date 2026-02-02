import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { MapPin, Clock, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, startOfToday } from "date-fns";

interface TodayJobsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TodayJobsDialog = ({ open, onOpenChange }: TodayJobsDialogProps) => {
  const { user } = useAuth();

  const { data: driverRecord } = useQuery({
    queryKey: ["driver-record", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("drivers")
        .select("id")
        .eq("user_id", user.id)
        .single();
      return data;
    },
    enabled: !!user?.id && open,
  });

  const { data: todayJobs, isLoading } = useQuery({
    queryKey: ["today-jobs", driverRecord?.id],
    queryFn: async () => {
      if (!driverRecord?.id) return [];
      const today = startOfToday();
      
      const { data, error } = await supabase
        .from("jobs")
        .select(`
          id,
          job_number,
          pickup_address,
          completed_at,
          final_price,
          estimated_price,
          services:service_id (name)
        `)
        .eq("driver_id", driverRecord.id)
        .eq("status", "completed")
        .gte("completed_at", today.toISOString())
        .order("completed_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!driverRecord?.id && open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Today's Completed Jobs</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !todayJobs || todayJobs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No jobs completed today</p>
          ) : (
            todayJobs.map((job) => (
              <div
                key={job.id}
                className="rounded-xl border border-border p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-foreground">
                    {(job.services as any)?.name || "Service"}
                  </h4>
                  <span className="text-success font-semibold">
                    R{Math.round(((job.final_price || job.estimated_price || 0) * 0.8))}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{job.job_number}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>{job.pickup_address || "Location not specified"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>
                      {job.completed_at 
                        ? format(new Date(job.completed_at), "h:mm a")
                        : "N/A"
                      }
                    </span>
                  </div>
                  <StatusBadge variant="success">Completed</StatusBadge>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
