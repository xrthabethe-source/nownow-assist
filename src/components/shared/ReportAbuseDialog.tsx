import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertTriangle, Shield, Loader2, CheckCircle } from "lucide-react";
import { useReportAbuse, AbuseReportType } from "@/hooks/useReportAbuse";

interface ReportAbuseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId?: string;
  reportedId: string;
  reportedType: "customer" | "driver";
  reportedName?: string;
}

const reportTypes: { value: AbuseReportType; label: string; description: string }[] = [
  {
    value: "harassment",
    label: "Harassment",
    description: "Unwanted contact, stalking, or personal attacks",
  },
  {
    value: "threatening",
    label: "Threatening Behavior",
    description: "Threats of violence or harm",
  },
  {
    value: "inappropriate_content",
    label: "Inappropriate Content",
    description: "Offensive messages, images, or language",
  },
  {
    value: "spam",
    label: "Spam",
    description: "Excessive or unwanted messages",
  },
  {
    value: "fraud",
    label: "Fraud",
    description: "Scams, fake profiles, or deceptive behavior",
  },
  {
    value: "other",
    label: "Other",
    description: "Other safety concerns",
  },
];

export const ReportAbuseDialog = ({
  open,
  onOpenChange,
  jobId,
  reportedId,
  reportedType,
  reportedName,
}: ReportAbuseDialogProps) => {
  const { submitting, submitted, submitReport, reset } = useReportAbuse();
  const [selectedType, setSelectedType] = useState<AbuseReportType | null>(null);
  const [description, setDescription] = useState("");
  const [blockUser, setBlockUser] = useState(true);

  const handleSubmit = async () => {
    if (!selectedType) return;

    await submitReport({
      jobId,
      reportedId,
      reportedType,
      reportType: selectedType,
      description: description.trim() || undefined,
      blockUser,
    });
  };

  const handleClose = () => {
    if (!submitting) {
      onOpenChange(false);
      // Reset form after animation
      setTimeout(() => {
        setSelectedType(null);
        setDescription("");
        setBlockUser(true);
        reset();
      }, 300);
    }
  };

  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-sm">
          <div className="flex flex-col items-center py-6 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <DialogTitle className="mb-2">Report Submitted</DialogTitle>
            <DialogDescription>
              Thank you for helping keep our community safe. Our safety team will review
              your report within 24 hours.
            </DialogDescription>
            <Button className="mt-6 w-full" onClick={handleClose}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-destructive" />
            Report {reportedName || (reportedType === "driver" ? "Driver" : "Customer")}
          </DialogTitle>
          <DialogDescription>
            Help us maintain a safe community. Your report is confidential.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Report Type Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">What happened?</Label>
            <RadioGroup
              value={selectedType || ""}
              onValueChange={(v) => setSelectedType(v as AbuseReportType)}
            >
              {reportTypes.map((type) => (
                <div
                  key={type.value}
                  className={`flex items-start space-x-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                    selectedType === type.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/30"
                  }`}
                  onClick={() => setSelectedType(type.value)}
                >
                  <RadioGroupItem value={type.value} id={type.value} className="mt-0.5" />
                  <div className="flex-1">
                    <Label htmlFor={type.value} className="cursor-pointer font-medium text-foreground">
                      {type.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">{type.description}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Additional details (optional)</Label>
            <Textarea
              id="description"
              placeholder="Describe what happened..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              rows={4}
            />
            <p className="text-xs text-muted-foreground text-right">
              {description.length}/2000
            </p>
          </div>

          {/* Block User Toggle */}
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="block-user" className="font-medium">
                Block this user
              </Label>
              <p className="text-xs text-muted-foreground">
                They won't be able to contact you
              </p>
            </div>
            <Switch
              id="block-user"
              checked={blockUser}
              onCheckedChange={setBlockUser}
            />
          </div>

          {/* Warning for threatening behavior */}
          {selectedType === "threatening" && (
            <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-destructive">
                  If you're in immediate danger
                </p>
                <p className="text-muted-foreground">
                  Please call emergency services at <strong>10111</strong> immediately.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={!selectedType || submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Report"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
