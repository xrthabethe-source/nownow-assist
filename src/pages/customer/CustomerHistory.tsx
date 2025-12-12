import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { BottomNav } from "@/components/shared/BottomNav";
import { TyreIcon, BatteryIcon, FuelIcon } from "@/components/icons/ServiceIcons";
import { Clock, Star, Receipt, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const mockHistory = [
  {
    id: "JOB-156",
    service: "Tyre Change",
    icon: TyreIcon,
    date: "Dec 10, 2025",
    time: "14:32",
    location: "Sandton, JHB",
    driver: "Samuel K.",
    rating: 5,
    price: "R350",
    status: "completed",
  },
  {
    id: "JOB-142",
    service: "Jump Start",
    icon: BatteryIcon,
    date: "Dec 5, 2025",
    time: "09:15",
    location: "Rosebank, JHB",
    driver: "David O.",
    rating: 5,
    price: "R250",
    status: "completed",
  },
  {
    id: "JOB-128",
    service: "Fuel Delivery",
    icon: FuelIcon,
    date: "Nov 28, 2025",
    time: "18:45",
    location: "Fourways, JHB",
    driver: "Michael T.",
    rating: 4,
    price: "R180",
    status: "completed",
  },
];

export const CustomerHistory = () => {
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-xl">
        <div className="container py-4">
          <h1 className="text-xl font-bold text-foreground">Service History</h1>
          <p className="text-sm text-muted-foreground">Your past roadside assists</p>
        </div>
      </header>

      <div className="container py-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {mockHistory.map((job, index) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card variant="default">
                <CardContent className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                        <job.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{job.service}</p>
                        <p className="text-sm text-muted-foreground">{job.date} • {job.time}</p>
                      </div>
                    </div>
                    <StatusBadge variant="success">Completed</StatusBadge>
                  </div>

                  <div className="mb-3 space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{job.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span>Responder: {job.driver}</span>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: job.rating }).map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-primary text-primary" />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-border pt-3">
                    <div>
                      <span className="text-sm text-muted-foreground">Total Paid</span>
                      <p className="text-lg font-bold text-foreground">{job.price}</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Receipt
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <BottomNav type="customer" />
    </div>
  );
};

export default CustomerHistory;
