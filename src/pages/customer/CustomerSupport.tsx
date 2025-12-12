import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BottomNav } from "@/components/shared/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Phone, HelpCircle, FileText, ChevronRight, Send, Bot } from "lucide-react";
import { useState } from "react";

const faqs = [
  {
    question: "How long does it take for help to arrive?",
    answer: "Our average response time is 15-25 minutes, depending on your location and traffic conditions.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit/debit cards, instant EFT, and mobile payments like SnapScan.",
  },
  {
    question: "Can I cancel a request?",
    answer: "Yes, you can cancel anytime before the responder arrives. A small cancellation fee may apply.",
  },
  {
    question: "How are responders verified?",
    answer: "All responders undergo background checks, license verification, and skills assessment.",
  },
];

export const CustomerSupport = () => {
  const [message, setMessage] = useState("");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

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
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 gap-3"
        >
          <Card variant="interactive">
            <CardContent className="p-4 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Phone className="h-6 w-6 text-primary" />
              </div>
              <p className="font-medium">Call Support</p>
              <p className="text-xs text-muted-foreground">24/7 helpline</p>
            </CardContent>
          </Card>
          <Card variant="interactive">
            <CardContent className="p-4 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
                <MessageCircle className="h-6 w-6 text-success" />
              </div>
              <p className="font-medium">Live Chat</p>
              <p className="text-xs text-muted-foreground">Avg 2 min wait</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Chat Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card variant="default">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bot className="h-5 w-5 text-primary" />
                Ask a Question
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Type your question..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="flex-1"
                />
                <Button variant="amber" size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
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
            <CardContent className="space-y-2">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-border overflow-hidden"
                >
                  <button
                    className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-muted/50"
                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  >
                    <span className="font-medium pr-4">{faq.question}</span>
                    <ChevronRight
                      className={`h-5 w-5 text-muted-foreground transition-transform ${
                        expandedFaq === index ? "rotate-90" : ""
                      }`}
                    />
                  </button>
                  {expandedFaq === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-border bg-muted/30 p-4"
                    >
                      <p className="text-sm text-muted-foreground">{faq.answer}</p>
                    </motion.div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Report Issue */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card variant="interactive">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10">
                    <FileText className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <p className="font-medium">Report an Issue</p>
                    <p className="text-sm text-muted-foreground">Had a problem with a service?</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <BottomNav type="customer" />
    </div>
  );
};

export default CustomerSupport;
