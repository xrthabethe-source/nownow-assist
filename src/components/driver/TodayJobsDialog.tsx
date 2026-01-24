import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { MapPin, Clock } from "lucide-react";

interface TodayJobsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const mockTodayJobs = [
  { id: 1, service: "Tyre Change", customer: "John M.", location: "123 Main St, Pretoria", time: "09:30 AM", amount: "R280", status: "completed" },
  { id: 2, service: "Jump Start", customer: "Sarah L.", location: "45 Oak Ave, Centurion", time: "11:15 AM", amount: "R200", status: "completed" },
  { id: 3, service: "Fuel Delivery", customer: "Mike R.", location: "78 Pine Rd, Midrand", time: "02:45 PM", amount: "R144", status: "completed" },
];

export const TodayJobsDialog = ({ open, onOpenChange }: TodayJobsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Today's Completed Jobs</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-4">
          {mockTodayJobs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No jobs completed today</p>
          ) : (
            mockTodayJobs.map((job) => (
              <div
                key={job.id}
                className="rounded-xl border border-border p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-foreground">{job.service}</h4>
                  <span className="text-success font-semibold">{job.amount}</span>
                </div>
                <p className="text-sm text-muted-foreground">{job.customer}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>{job.location}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{job.time}</span>
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
