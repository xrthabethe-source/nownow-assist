import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { MapPin, Clock, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { format, subDays, startOfDay, endOfDay, isToday } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface WeekJobsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const WeekJobsDialog = ({ open, onOpenChange }: WeekJobsDialogProps) => {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
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

  const { data: weekJobs, isLoading } = useQuery({
    queryKey: ["week-jobs", driverRecord?.id],
    queryFn: async () => {
      if (!driverRecord?.id) return [];
      
      const today = new Date();
      const weekAgo = subDays(today, 6);
      
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
        .gte("completed_at", startOfDay(weekAgo).toISOString())
        .lte("completed_at", endOfDay(today).toISOString())
        .order("completed_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!driverRecord?.id && open,
  });

  // Group jobs by day
  const weekData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dayJobs = weekJobs?.filter((job) => {
      if (!job.completed_at) return false;
      const jobDate = new Date(job.completed_at);
      return format(jobDate, "yyyy-MM-dd") === format(date, "yyyy-MM-dd");
    }) || [];
    
    const earnings = dayJobs.reduce((sum, job) => {
      return sum + ((job.final_price || job.estimated_price || 0) * 0.8);
    }, 0);

    return {
      date,
      dayName: format(date, "EEE"),
      dateStr: format(date, "MMM d"),
      isToday: isToday(date),
      jobCount: dayJobs.length,
      earnings: `R${Math.round(earnings)}`,
      jobs: dayJobs,
    };
  });

  const handleBack = () => setSelectedDay(null);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) setSelectedDay(null);
    }}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {selectedDay !== null && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleBack}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            {selectedDay !== null
              ? `Jobs on ${weekData[selectedDay].dateStr}`
              : "This Week's Jobs"}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : selectedDay === null ? (
          <div className="space-y-2 mt-4">
            {weekData.map((day, index) => (
              <div
                key={index}
                onClick={() => day.jobCount > 0 && setSelectedDay(index)}
                className={`flex items-center justify-between rounded-xl border p-4 transition-all ${
                  day.jobCount > 0 ? "cursor-pointer hover:border-primary/50 active:scale-[0.99]" : "opacity-60"
                } ${
                  day.isToday ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                <div>
                  <p className="font-semibold text-foreground">
                    {day.dayName} {day.isToday && <span className="text-primary text-sm">(Today)</span>}
                  </p>
                  <p className="text-sm text-muted-foreground">{day.dateStr}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{day.jobCount} jobs</p>
                    <p className="text-sm text-success">{day.earnings}</p>
                  </div>
                  {day.jobCount > 0 && (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3 mt-4">
            {weekData[selectedDay].jobs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No jobs on this day</p>
            ) : (
              weekData[selectedDay].jobs.map((job) => (
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
        )}
      </DialogContent>
    </Dialog>
  );
};
