import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { MapPin, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { format, subDays } from "date-fns";

interface WeekJobsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const generateWeekData = () => {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const date = subDays(today, 6 - i);
    const jobCount = Math.floor(Math.random() * 5) + 1;
    const earnings = jobCount * (Math.floor(Math.random() * 150) + 150);
    return {
      date,
      dayName: format(date, "EEE"),
      dateStr: format(date, "MMM d"),
      isToday: i === 6,
      jobCount,
      earnings: `R${earnings}`,
      jobs: Array.from({ length: jobCount }, (_, j) => ({
        id: `${i}-${j}`,
        service: ["Tyre Change", "Jump Start", "Fuel Delivery", "Towing", "Battery Replacement"][Math.floor(Math.random() * 5)],
        customer: ["John M.", "Sarah L.", "Mike R.", "Lisa K.", "David P."][Math.floor(Math.random() * 5)],
        location: ["123 Main St", "45 Oak Ave", "78 Pine Rd", "12 Beach Blvd", "56 Hill St"][Math.floor(Math.random() * 5)],
        time: `${9 + j * 2}:${Math.floor(Math.random() * 60).toString().padStart(2, "0")} AM`,
        amount: `R${Math.floor(Math.random() * 150) + 150}`,
      })),
    };
  });
};

const weekData = generateWeekData();

export const WeekJobsDialog = ({ open, onOpenChange }: WeekJobsDialogProps) => {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

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

        {selectedDay === null ? (
          <div className="space-y-2 mt-4">
            {weekData.map((day, index) => (
              <div
                key={index}
                onClick={() => setSelectedDay(index)}
                className={`flex items-center justify-between rounded-xl border p-4 cursor-pointer transition-all hover:border-primary/50 active:scale-[0.99] ${
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
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3 mt-4">
            {weekData[selectedDay].jobs.map((job) => (
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
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
