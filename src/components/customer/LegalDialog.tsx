import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, ChevronRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";

interface LegalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const legalSections = [
  {
    id: "terms",
    title: "Terms of Service",
    content: `Terms of Service for Now-Now Assist

Last Updated: January 2025

1. ACCEPTANCE OF TERMS
By accessing or using the Now-Now Assist mobile application and services, you agree to be bound by these Terms of Service.

2. SERVICE DESCRIPTION
Now-Now Assist provides on-demand roadside assistance services connecting customers with service providers for jump starts, tyre changes, fuel delivery, tyre inflation, and minor roadside assistance. We do not offer vehicle lockout, locksmith, key replacement, standalone towing, or accident assist services.

3. USER ACCOUNTS
- You must be at least 18 years old to use our services
- You are responsible for maintaining the confidentiality of your account
- You agree to provide accurate and complete information

4. SERVICE AVAILABILITY
Services are subject to availability of nearby service providers. Response times may vary based on location, time, and demand.

5. PAYMENTS
- All payments are processed securely through our platform
- Prices are displayed before confirming a service request
- Cancellation fees may apply after a driver has been dispatched

6. LIABILITY
Now-Now Assist acts as an intermediary between customers and service providers. We are not liable for damages caused by service providers during the provision of services.

7. MODIFICATIONS
We reserve the right to modify these terms at any time. Continued use of the service constitutes acceptance of modified terms.`,
  },
  {
    id: "privacy",
    title: "Privacy Policy",
    content: `Privacy Policy for Now-Now Assist

Last Updated: January 2025

1. INFORMATION WE COLLECT
- Personal Information: Name, email, phone number, payment details
- Location Data: GPS coordinates during service requests
- Device Information: Device type, OS version, app version

2. HOW WE USE YOUR INFORMATION
- To provide and improve our services
- To connect you with nearby service providers
- To process payments and send receipts
- To communicate service updates and promotions

3. INFORMATION SHARING
We share your information with:
- Service providers assigned to assist you
- Payment processors for transaction handling
- Analytics partners (anonymized data only)

4. DATA SECURITY
We implement industry-standard security measures including encryption, secure servers, and regular security audits.

5. YOUR RIGHTS
- Access your personal data
- Request data correction or deletion
- Opt-out of marketing communications
- Export your data

6. CONTACT US
For privacy concerns, contact: privacy@nownowassist.co.za`,
  },
  {
    id: "refund",
    title: "Refund Policy",
    content: `Refund Policy for Now-Now Assist

1. CANCELLATION BEFORE DISPATCH
Full refund if cancelled before a driver accepts your request.

2. CANCELLATION AFTER DISPATCH
- 50% refund if cancelled within 5 minutes of driver acceptance
- No refund after 5 minutes or if driver has arrived

3. SERVICE NOT RENDERED
Full refund if the assigned driver fails to arrive or complete the service.

4. SERVICE QUALITY ISSUES
Submit a dispute within 48 hours of service completion for review. Partial or full refunds may be issued based on investigation.

5. REFUND PROCESSING
Approved refunds are processed within 5-7 business days to the original payment method.

6. DISPUTES
Contact support@nownowassist.co.za for any billing disputes.`,
  },
  {
    id: "cookies",
    title: "Cookie Policy",
    content: `Cookie Policy for Now-Now Assist

1. WHAT ARE COOKIES
Cookies are small text files stored on your device to enhance your experience.

2. COOKIES WE USE
- Essential Cookies: Required for app functionality
- Analytics Cookies: Help us understand app usage
- Preference Cookies: Remember your settings

3. MANAGING COOKIES
You can manage cookie preferences in your device settings. Disabling essential cookies may affect app functionality.

4. THIRD-PARTY COOKIES
We use services like Google Analytics that may set their own cookies.`,
  },
  {
    id: "acceptable",
    title: "Acceptable Use Policy",
    content: `Acceptable Use Policy for Now-Now Assist

1. PROHIBITED ACTIVITIES
Users may not:
- Provide false information
- Use the service for illegal purposes
- Harass drivers or other users
- Attempt to defraud the payment system
- Misuse the dispute resolution system

2. ACCOUNT SUSPENSION
We reserve the right to suspend or terminate accounts that violate this policy.

3. REPORTING VIOLATIONS
Report policy violations to: support@nownowassist.co.za`,
  },
];

export const LegalDialog = ({ open, onOpenChange }: LegalDialogProps) => {
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  const selectedContent = legalSections.find((s) => s.id === selectedSection);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) setSelectedSection(null);
    }}>
      <DialogContent className="max-w-md max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {selectedSection ? selectedContent?.title : "Legal Information"}
          </DialogTitle>
        </DialogHeader>
        
        {!selectedSection ? (
          <div className="space-y-2">
            {legalSections.map((section) => (
              <button
                key={section.id}
                onClick={() => setSelectedSection(section.id)}
                className="flex w-full items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
              >
                <span className="font-medium text-sm">{section.title}</span>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <button
              onClick={() => setSelectedSection(null)}
              className="text-sm text-primary hover:underline"
            >
              ← Back to Legal
            </button>
            <ScrollArea className="h-[350px] pr-4">
              <div className="whitespace-pre-line text-sm text-muted-foreground">
                {selectedContent?.content}
              </div>
            </ScrollArea>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
