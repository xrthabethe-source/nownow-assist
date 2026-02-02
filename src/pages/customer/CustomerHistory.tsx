import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { BottomNav } from "@/components/shared/BottomNav";
import { TyreIcon, BatteryIcon, FuelIcon, MechanicIcon } from "@/components/icons/ServiceIcons";
import { 
  Clock, 
  Star, 
  Download, 
  MapPin, 
  CreditCard, 
  User, 
  Car, 
  Timer,
  ChevronRight,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { jsPDF } from "jspdf";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

interface JobHistory {
  id: string;
  job_number: string;
  service: string;
  icon: React.ComponentType<{ className?: string }>;
  date: string;
  time: string;
  location: string;
  fullAddress: string;
  driver: string;
  driverPhone: string;
  vehicleReg: string;
  vehicleMake: string;
  rating: number;
  price: string;
  priceBreakdown: {
    basePrice: string;
    calloutFee: string;
    vat: string;
    total: string;
  };
  paymentMethod: string;
  cardLast4: string;
  paymentDate: string;
  duration: string;
  status: string;
}

const serviceIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "Tyre Change": TyreIcon,
  "Jump-Start Rescue": BatteryIcon,
  "Jump-Start": BatteryIcon,
  "Fuel Rescue": FuelIcon,
  "Call a Mechanic": MechanicIcon,
};

const generateReceipt = (job: JobHistory) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Colors
    const primaryColor: [number, number, number] = [16, 185, 129]; // Emerald green
    const darkGray: [number, number, number] = [55, 65, 81];
    const lightGray: [number, number, number] = [107, 114, 128];

    // Header background
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 50, "F");

    // Company Logo area (stylized NN)
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(20, 12, 26, 26, 4, 4, "F");
    doc.setTextColor(...primaryColor);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("NN", 33, 29, { align: "center" });

    // Company name and tagline
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("NowNow Assist", 55, 22);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("24/7 Roadside Assistance", 55, 32);

    // Receipt title
    doc.setFontSize(11);
    doc.text("OFFICIAL RECEIPT", pageWidth - 20, 25, { align: "right" });
    doc.text(`#${job.job_number}`, pageWidth - 20, 33, { align: "right" });

    // Company details section
    doc.setTextColor(...lightGray);
    doc.setFontSize(9);
    let y = 60;
    doc.text("NowNow Assist (Pty) Ltd", 20, y);
    doc.text("Reg: 2024/123456/07", 20, y + 5);
    doc.text("VAT: 4123456789", 20, y + 10);
    doc.text("123 Main Road, Sandton, 2196", 20, y + 15);
    doc.text("Tel: 0800 NOW NOW (669 669)", 20, y + 20);
    doc.text("Email: receipts@nownowassist.co.za", 20, y + 25);

    // Issue date on right
    doc.text(`Issued: ${job.paymentDate}`, pageWidth - 20, y, { align: "right" });

    // Service details box
    y = 95;
    doc.setDrawColor(229, 231, 235);
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(20, y, pageWidth - 40, 45, 3, 3, "FD");

    y += 12;
    doc.setTextColor(...darkGray);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("SERVICE DETAILS", 30, y);

    y += 12;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...lightGray);
    doc.text("Service Type:", 30, y);
    doc.setTextColor(...darkGray);
    doc.setFont("helvetica", "bold");
    doc.text(job.service, 80, y);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...lightGray);
    doc.text("Date & Time:", 120, y);
    doc.setTextColor(...darkGray);
    doc.text(`${job.date} at ${job.time}`, 155, y);

    y += 10;
    doc.setTextColor(...lightGray);
    doc.text("Location:", 30, y);
    doc.setTextColor(...darkGray);
    doc.text(job.fullAddress || job.location, 80, y);

    // Responder details box
    y = 150;
    doc.setDrawColor(229, 231, 235);
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(20, y, pageWidth - 40, 35, 3, 3, "FD");

    y += 12;
    doc.setTextColor(...darkGray);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("RESPONDER DETAILS", 30, y);

    y += 12;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...lightGray);
    doc.text("Name:", 30, y);
    doc.setTextColor(...darkGray);
    doc.text(job.driver, 55, y);

    doc.setTextColor(...lightGray);
    doc.text("Vehicle:", 100, y);
    doc.setTextColor(...darkGray);
    doc.text(`${job.vehicleMake} (${job.vehicleReg})`, 125, y);

    doc.setTextColor(...lightGray);
    doc.text("Duration:", 30, y + 8);
    doc.setTextColor(...darkGray);
    doc.text(job.duration, 60, y + 8);

    // Rating stars
    doc.setTextColor(...lightGray);
    doc.text("Rating:", 100, y + 8);
    doc.setTextColor(...primaryColor);
    doc.text("★".repeat(job.rating) + "☆".repeat(5 - job.rating), 125, y + 8);

    // Payment breakdown
    y = 200;
    doc.setTextColor(...darkGray);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("PAYMENT BREAKDOWN", 20, y);

    y += 15;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    // Line items
    const items = [
      ["Base Service Fee", job.priceBreakdown.basePrice],
      ["Callout Fee", job.priceBreakdown.calloutFee],
      ["VAT (15%)", job.priceBreakdown.vat],
    ];

    items.forEach(([label, amount]) => {
      doc.setTextColor(...lightGray);
      doc.text(label, 30, y);
      doc.setTextColor(...darkGray);
      doc.text(amount, pageWidth - 30, y, { align: "right" });
      y += 8;
    });

    // Total line
    y += 5;
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.line(20, y, pageWidth - 20, y);
    
    y += 12;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...darkGray);
    doc.text("TOTAL PAID", 30, y);
    doc.setTextColor(...primaryColor);
    doc.text(job.priceBreakdown.total, pageWidth - 30, y, { align: "right" });

    // Payment method
    y += 15;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...lightGray);
    doc.text(`Paid via ${job.paymentMethod} ending in ${job.cardLast4}`, 30, y);

    // Footer
    const footerY = 270;
    doc.setDrawColor(229, 231, 235);
    doc.line(20, footerY - 10, pageWidth - 20, footerY - 10);
    
    doc.setFontSize(9);
    doc.setTextColor(...lightGray);
    doc.text("Thank you for choosing NowNow Assist!", pageWidth / 2, footerY, { align: "center" });
    doc.text("This is an official tax receipt. Please retain for your records.", pageWidth / 2, footerY + 6, { align: "center" });
    doc.text("For queries: support@nownowassist.co.za | 0800 NOW NOW", pageWidth / 2, footerY + 12, { align: "center" });

    // Save the PDF
    doc.save(`NowNow_Receipt_${job.job_number}.pdf`);
    toast.success("Receipt downloaded successfully");
  } catch (error) {
    console.error("Error generating receipt:", error);
    toast.error("Failed to generate receipt");
  }
};

export const CustomerHistory = () => {
  const [selectedJob, setSelectedJob] = useState<JobHistory | null>(null);
  const { user } = useAuth();

  const { data: jobHistory, isLoading } = useQuery({
    queryKey: ["customer-job-history", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data: jobs, error } = await supabase
        .from("jobs")
        .select(`
          id,
          job_number,
          pickup_address,
          completed_at,
          started_at,
          final_price,
          estimated_price,
          rating,
          status,
          services:service_id (name, base_price),
          drivers:driver_id (
            vehicle_make,
            vehicle_plate,
            rating,
            profiles:user_id (full_name, phone)
          )
        `)
        .eq("customer_id", user.id)
        .eq("status", "completed")
        .order("completed_at", { ascending: false });

      if (error) throw error;

      // Fetch payment info for each job
      const jobsWithPayments = await Promise.all(
        (jobs || []).map(async (job) => {
          const { data: payment } = await supabase
            .from("payments")
            .select("payment_method, created_at")
            .eq("job_id", job.id)
            .single();

          const price = job.final_price || job.estimated_price || 0;
          const basePrice = (job.services as any)?.base_price || price * 0.7;
          const calloutFee = price * 0.15;
          const vat = price * 0.15;
          
          const completedAt = job.completed_at ? new Date(job.completed_at) : new Date();
          const startedAt = job.started_at ? new Date(job.started_at) : completedAt;
          const durationMs = completedAt.getTime() - startedAt.getTime();
          const durationMins = Math.round(durationMs / 60000);

          return {
            id: job.id,
            job_number: job.job_number,
            service: (job.services as any)?.name || "Service",
            icon: serviceIcons[(job.services as any)?.name] || TyreIcon,
            date: format(completedAt, "MMM d, yyyy"),
            time: format(completedAt, "HH:mm"),
            location: job.pickup_address?.split(",")[0] || "Location",
            fullAddress: job.pickup_address || "Address not available",
            driver: (job.drivers as any)?.profiles?.full_name || "Driver",
            driverPhone: "••• ••• ••••",
            vehicleReg: (job.drivers as any)?.vehicle_plate || "N/A",
            vehicleMake: (job.drivers as any)?.vehicle_make || "Vehicle",
            rating: job.rating || (job.drivers as any)?.rating || 5,
            price: `R${Math.round(price)}`,
            priceBreakdown: {
              basePrice: `R${basePrice.toFixed(2)}`,
              calloutFee: `R${calloutFee.toFixed(2)}`,
              vat: `R${vat.toFixed(2)}`,
              total: `R${price.toFixed(2)}`,
            },
            paymentMethod: payment?.payment_method || "Card",
            cardLast4: "••••",
            paymentDate: payment?.created_at 
              ? format(new Date(payment.created_at), "MMM d, yyyy 'at' HH:mm")
              : format(completedAt, "MMM d, yyyy 'at' HH:mm"),
            duration: `${durationMins} minutes`,
            status: job.status,
          };
        })
      );

      return jobsWithPayments;
    },
    enabled: !!user?.id,
  });

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
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !jobHistory || jobHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Clock className="h-12 w-12 mb-4 opacity-50" />
            <p className="font-medium">No service history yet</p>
            <p className="text-sm text-center mt-2">Your completed assists will appear here</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {jobHistory.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  variant="default" 
                  className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30"
                  onClick={() => setSelectedJob(job)}
                >
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
                      <div className="flex items-center gap-2">
                        <StatusBadge variant="success">Completed</StatusBadge>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>

                    <div className="mb-3 space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{job.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>{job.driver}</span>
                        <div className="flex items-center gap-1 ml-2">
                          {Array.from({ length: Math.min(job.rating, 5) }).map((_, i) => (
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
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          generateReceipt(job);
                        }}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Receipt
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Job Details Dialog */}
      <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          {selectedJob && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <selectedJob.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <DialogTitle className="text-left">{selectedJob.service}</DialogTitle>
                    <p className="text-sm text-muted-foreground">{selectedJob.job_number}</p>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-5 pt-2">
                {/* Service Details */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    Service Details
                  </h3>
                  <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Date & Time</span>
                      <span className="font-medium">{selectedJob.date} at {selectedJob.time}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Duration</span>
                      <span className="font-medium">{selectedJob.duration}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Status</span>
                      <StatusBadge variant="success" className="text-xs">Completed</StatusBadge>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Location */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    Location
                  </h3>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-sm text-foreground">{selectedJob.fullAddress}</p>
                  </div>
                </div>

                <Separator />

                {/* Driver Details */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    Responder Details
                  </h3>
                  <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Name</span>
                      <span className="font-medium">{selectedJob.driver}</span>
                    </div>
                    <div className="flex justify-between text-sm items-center">
                      <span className="text-muted-foreground">Rating</span>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-4 w-4 ${i < selectedJob.rating ? 'fill-primary text-primary' : 'text-muted-foreground'}`} 
                          />
                        ))}
                        <span className="ml-1 text-sm font-medium">{selectedJob.rating}.0</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Vehicle Details */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Car className="h-4 w-4 text-primary" />
                    Vehicle Details
                  </h3>
                  <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Vehicle</span>
                      <span className="font-medium">{selectedJob.vehicleMake}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Registration</span>
                      <span className="font-medium font-mono">{selectedJob.vehicleReg}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Payment Details */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-primary" />
                    Payment Details
                  </h3>
                  <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Base Service</span>
                      <span>{selectedJob.priceBreakdown.basePrice}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Callout Fee</span>
                      <span>{selectedJob.priceBreakdown.calloutFee}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">VAT (15%)</span>
                      <span>{selectedJob.priceBreakdown.vat}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between text-sm font-semibold">
                      <span>Total</span>
                      <span className="text-primary">{selectedJob.priceBreakdown.total}</span>
                    </div>
                  </div>
                  
                  <div className="rounded-lg border border-border p-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <CreditCard className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{selectedJob.paymentMethod} •••• {selectedJob.cardLast4}</p>
                      <p className="text-xs text-muted-foreground">{selectedJob.paymentDate}</p>
                    </div>
                  </div>
                </div>

                {/* Download Receipt Button */}
                <Button 
                  className="w-full" 
                  onClick={() => generateReceipt(selectedJob)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Receipt
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <BottomNav type="customer" />
    </div>
  );
};

export default CustomerHistory;
