import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { BottomNav } from "@/components/shared/BottomNav";
import { TyreIcon, BatteryIcon, FuelIcon } from "@/components/icons/ServiceIcons";
import { 
  Clock, 
  Star, 
  Download, 
  MapPin, 
  CreditCard, 
  User, 
  Car, 
  Timer,
  Phone,
  ChevronRight
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

interface JobHistory {
  id: string;
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

const mockHistory: JobHistory[] = [
  {
    id: "JOB-156",
    service: "Tyre Change",
    icon: TyreIcon,
    date: "Dec 10, 2025",
    time: "14:32",
    location: "Sandton, JHB",
    fullAddress: "123 Rivonia Road, Sandton, Johannesburg, 2196",
    driver: "Samuel Khumalo",
    driverPhone: "••• ••• 4521",
    vehicleReg: "GP 123 ABC",
    vehicleMake: "Toyota Hilux",
    rating: 5,
    price: "R350",
    priceBreakdown: {
      basePrice: "R250.00",
      calloutFee: "R50.00",
      vat: "R50.00",
      total: "R350.00",
    },
    paymentMethod: "Visa",
    cardLast4: "4829",
    paymentDate: "Dec 10, 2025 at 15:45",
    duration: "32 minutes",
    status: "completed",
  },
  {
    id: "JOB-142",
    service: "Jump Start",
    icon: BatteryIcon,
    date: "Dec 5, 2025",
    time: "09:15",
    location: "Rosebank, JHB",
    fullAddress: "45 Oxford Road, Rosebank, Johannesburg, 2196",
    driver: "David Okonkwo",
    driverPhone: "••• ••• 7832",
    vehicleReg: "GP 456 DEF",
    vehicleMake: "Ford Ranger",
    rating: 5,
    price: "R250",
    priceBreakdown: {
      basePrice: "R180.00",
      calloutFee: "R40.00",
      vat: "R30.00",
      total: "R250.00",
    },
    paymentMethod: "Mastercard",
    cardLast4: "1234",
    paymentDate: "Dec 5, 2025 at 09:58",
    duration: "18 minutes",
    status: "completed",
  },
  {
    id: "JOB-128",
    service: "Fuel Delivery",
    icon: FuelIcon,
    date: "Nov 28, 2025",
    time: "18:45",
    location: "Fourways, JHB",
    fullAddress: "Monte Casino Boulevard, Fourways, Johannesburg, 2055",
    driver: "Michael Thabo",
    driverPhone: "••• ••• 9156",
    vehicleReg: "GP 789 GHI",
    vehicleMake: "VW Amarok",
    rating: 4,
    price: "R180",
    priceBreakdown: {
      basePrice: "R120.00",
      calloutFee: "R35.00",
      vat: "R25.00",
      total: "R180.00",
    },
    paymentMethod: "Visa",
    cardLast4: "5678",
    paymentDate: "Nov 28, 2025 at 19:22",
    duration: "25 minutes",
    status: "completed",
  },
];

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
    doc.text(`#${job.id}`, pageWidth - 20, 33, { align: "right" });

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
    doc.text(job.fullAddress, 80, y);

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
    doc.save(`NowNow_Receipt_${job.id}.pdf`);
    toast.success("Receipt downloaded successfully");
  } catch (error) {
    console.error("Error generating receipt:", error);
    toast.error("Failed to generate receipt");
  }
};

export const CustomerHistory = () => {
  const [selectedJob, setSelectedJob] = useState<JobHistory | null>(null);

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
                    <p className="text-sm text-muted-foreground">{selectedJob.id}</p>
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
