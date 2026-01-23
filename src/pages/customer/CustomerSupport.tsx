import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BottomNav } from "@/components/shared/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mail, HelpCircle, FileText, Send, Bot, AlertTriangle, Loader2, User } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const faqs = [
  {
    question: "How long does it take for help to arrive?",
    answer: "Our average response time is 15-25 minutes, depending on your location and traffic conditions. You can track your responder in real-time through the app once they're dispatched.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit/debit cards, instant EFT, and mobile payments like SnapScan. Payment is processed securely after the service is completed.",
  },
  {
    question: "Can I cancel a request?",
    answer: "Yes, you can cancel anytime before the responder arrives at no charge. A small cancellation fee may apply if cancelled after the responder has been dispatched and is en route.",
  },
  {
    question: "How are responders verified?",
    answer: "All our responders undergo comprehensive background checks, license verification, vehicle inspection, and skills assessment before being approved to provide services.",
  },
  {
    question: "What services do you offer?",
    answer: "We offer flat tyre change, battery jump start, fuel delivery, towing services, locksmith assistance, and general mechanical help for common roadside issues.",
  },
  {
    question: "How do I track my responder?",
    answer: "Once a responder accepts your request, you'll see a live map with their location and estimated arrival time. You'll also receive notifications as they get closer.",
  },
  {
    question: "What if I'm not satisfied with the service?",
    answer: "We take quality seriously. If you're unhappy with any aspect of our service, please use the 'Report an Issue' feature below. Our team will investigate and respond within 24 hours.",
  },
  {
    question: "Are your services available 24/7?",
    answer: "Yes! NowNow Assist operates 24 hours a day, 7 days a week, including holidays. Help is always just a tap away.",
  },
  {
    question: "How is pricing determined?",
    answer: "Pricing varies based on the service type, your location, and time of day. You'll always see an estimated price before confirming your request. Final pricing is confirmed after service completion.",
  },
  {
    question: "What areas do you cover?",
    answer: "We currently operate in major metropolitan areas across South Africa including Johannesburg, Pretoria, Cape Town, Durban, and surrounding areas. We're constantly expanding coverage.",
  },
  {
    question: "Can I save my payment details?",
    answer: "Yes, you can securely save your payment cards in your profile for faster checkout. Your payment information is encrypted and stored safely.",
  },
  {
    question: "How do I rate my responder?",
    answer: "After each completed service, you'll be prompted to rate your experience. Your feedback helps us maintain high-quality service and reward great responders.",
  },
];

type Message = { role: "user" | "assistant"; content: string };

export const CustomerSupport = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [reportCategory, setReportCategory] = useState("");
  const [reportSubject, setReportSubject] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const streamChat = async (userMessages: Message[]) => {
    const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/support-chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages: userMessages }),
    });

    if (!resp.ok) {
      const error = await resp.json().catch(() => ({ error: "Failed to connect" }));
      throw new Error(error.error || "Failed to get response");
    }

    if (!resp.body) throw new Error("No response body");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let assistantContent = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") break;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantContent += content;
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant") {
                return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantContent } : m));
              }
              return [...prev, { role: "assistant", content: assistantContent }];
            });
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMsg: Message = { role: "user", content: inputMessage.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setIsLoading(true);

    try {
      await streamChat([...messages, userMsg]);
    } catch (error) {
      console.error("Chat error:", error);
      toast.error("Failed to get response. Please try again.");
      setMessages((prev) => [
        ...prev,
        { 
          role: "assistant", 
          content: "I'm sorry, I couldn't process your request. Please try again or send us an email using the form below." 
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async () => {
    if (!emailSubject.trim() || !emailMessage.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!user) {
      toast.error("Please log in to send an email");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create support ticket for the email
      const { error: ticketError } = await supabase
        .from("support_tickets")
        .insert({
          user_id: user.id,
          subject: emailSubject.trim(),
          description: emailMessage.trim(),
          category: "general",
          priority: "normal",
        });

      if (ticketError) throw ticketError;

      // Create admin notification
      await supabase
        .from("admin_notifications")
        .insert({
          type: "dispute",
          title: "New Customer Email",
          message: emailSubject.trim(),
          severity: "info",
          metadata: { 
            category: "general", 
            subject: emailSubject.trim(),
            user_id: user.id,
          },
        });

      toast.success("Your message has been sent. We'll respond within 24 hours.");
      setShowEmailDialog(false);
      setEmailSubject("");
      setEmailMessage("");
    } catch (error) {
      console.error("Failed to send email:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReportSubmit = async () => {
    if (!reportCategory || !reportSubject.trim() || !reportDescription.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!user) {
      toast.error("Please log in to submit a report");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create support ticket
      const { error: ticketError } = await supabase
        .from("support_tickets")
        .insert({
          user_id: user.id,
          subject: reportSubject.trim(),
          description: reportDescription.trim(),
          category: reportCategory,
          priority: reportCategory === "billing" || reportCategory === "safety" ? "high" : "normal",
        });

      if (ticketError) throw ticketError;

      // Create admin notification
      const { error: notifError } = await supabase
        .from("admin_notifications")
        .insert({
          type: "dispute",
          title: "New Support Ticket",
          message: `${reportCategory}: ${reportSubject.trim()}`,
          severity: reportCategory === "safety" ? "error" : "warning",
          metadata: { 
            category: reportCategory, 
            subject: reportSubject.trim(),
            user_id: user.id,
          },
        });

      if (notifError) console.error("Failed to create notification:", notifError);

      toast.success("Your report has been submitted. We'll respond within 24 hours.");
      setShowReportDialog(false);
      setReportCategory("");
      setReportSubject("");
      setReportDescription("");
    } catch (error) {
      console.error("Failed to submit report:", error);
      toast.error("Failed to submit report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-xl">
        <div className="container py-4">
          <h1 className="text-xl font-bold text-foreground">Help & Support</h1>
          <p className="text-sm text-muted-foreground">We're here to help 24/7</p>
        </div>
      </header>

      <div className="container py-4 space-y-4">
        {/* Email Contact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card 
            variant="interactive" 
            className="cursor-pointer"
            onClick={() => setShowEmailDialog(true)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Email Support</p>
                  <p className="text-sm text-muted-foreground">Send us a message</p>
                </div>
                <Send className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* AI Chat */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card variant="default">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bot className="h-5 w-5 text-primary" />
                Chat with AI Assistant
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Chat Messages */}
              <div
                ref={chatContainerRef}
                className="h-64 overflow-y-auto rounded-lg border border-border bg-muted/30 p-3 space-y-3"
              >
                {messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
                    <div>
                      <Bot className="mx-auto h-8 w-8 mb-2 opacity-50" />
                      <p>Ask me anything about our services!</p>
                      <p className="text-xs mt-1">I can help with questions about pricing, services, and more.</p>
                    </div>
                  </div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {messages.map((msg, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        {msg.role === "assistant" && (
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                            <Bot className="h-4 w-4 text-primary" />
                          </div>
                        )}
                        <div
                          className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-card border border-border"
                          }`}
                        >
                          {msg.content}
                        </div>
                        {msg.role === "user" && (
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                            <User className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </motion.div>
                    ))}
                    {isLoading && messages[messages.length - 1]?.role === "user" && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex gap-2"
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                        <div className="bg-card border border-border rounded-xl px-3 py-2">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>

              {/* Chat Input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Type your question..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button 
                  variant="amber" 
                  size="icon" 
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputMessage.trim()}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Can't find an answer? Use the Report Issue form below to email us.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* FAQs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card variant="default">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <HelpCircle className="h-5 w-5 text-primary" />
                Frequently Asked Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left text-sm">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </motion.div>

        {/* Report Issue */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card 
            variant="interactive" 
            className="cursor-pointer"
            onClick={() => setShowReportDialog(true)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Report an Issue</p>
                  <p className="text-sm text-muted-foreground">Had a problem? Let us know via email.</p>
                </div>
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Report Issue Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Report an Issue
            </DialogTitle>
            <DialogDescription>
              Describe your issue below. Our team will respond within 24 hours via email.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={reportCategory} onValueChange={setReportCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="service">Service Quality</SelectItem>
                  <SelectItem value="driver">Driver Behavior</SelectItem>
                  <SelectItem value="billing">Billing Issue</SelectItem>
                  <SelectItem value="app">App Problem</SelectItem>
                  <SelectItem value="safety">Safety Concern</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Brief summary of the issue"
                value={reportSubject}
                onChange={(e) => setReportSubject(e.target.value)}
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Please provide details about your issue..."
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                rows={4}
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground text-right">
                {reportDescription.length}/1000
              </p>
            </div>

            <Button 
              className="w-full" 
              onClick={handleReportSubmit}
              disabled={isSubmitting || !reportCategory || !reportSubject.trim() || !reportDescription.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Report
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Email Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Send us a Message
            </DialogTitle>
            <DialogDescription>
              We'll respond to your email within 24 hours.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email-subject">Subject</Label>
              <Input
                id="email-subject"
                placeholder="What's this about?"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email-message">Message</Label>
              <Textarea
                id="email-message"
                placeholder="How can we help you?"
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                rows={6}
                maxLength={2000}
              />
              <p className="text-xs text-muted-foreground text-right">
                {emailMessage.length}/2000
              </p>
            </div>

            <Button 
              className="w-full" 
              onClick={handleEmailSubmit}
              disabled={isSubmitting || !emailSubject.trim() || !emailMessage.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Message
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav type="customer" />
    </div>
  );
};

export default CustomerSupport;
