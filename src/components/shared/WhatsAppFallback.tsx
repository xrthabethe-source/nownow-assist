/**
 * WhatsApp Fallback Button
 * Shown when a request can't be submitted within 20 seconds.
 * Provides a direct link to WhatsApp for emergency help.
 */
import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WhatsAppFallbackProps {
  visible: boolean;
  serviceName?: string;
  location?: string;
}

export function WhatsAppFallback({ visible, serviceName, location }: WhatsAppFallbackProps) {
  if (!visible) return null;

  const whatsappUrl = "https://wa.me/27656636685?text=Hi%20Now-Now%20Assist%2C%20I%20need%20roadside%20help.%0A%0AService%3A%0ALocation%3A%0ACar%3A%0AIssue%3A";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4"
    >
      <Button
        variant="success"
        size="lg"
        className="w-full gap-2 text-base font-semibold"
        onClick={() => window.open(whatsappUrl, '_blank')}
      >
        <MessageCircle className="h-5 w-5" />
        Request help on WhatsApp
      </Button>
      <p className="text-xs text-muted-foreground text-center mt-2">
        Having trouble submitting? Get help directly via WhatsApp.
      </p>
    </motion.div>
  );
}
