/**
 * WhatsApp Fallback Button
 * Shown when a request can't be submitted within 20 seconds.
 * Provides a direct link to WhatsApp for emergency help.
 */
import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SUPPORT_WHATSAPP_URL } from '@/lib/contact';

interface WhatsAppFallbackProps {
  visible: boolean;
  serviceName?: string;
  location?: string;
}

export function WhatsAppFallback({ visible }: WhatsAppFallbackProps) {
  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4"
    >
      <Button
        asChild
        variant="success"
        size="lg"
        className="w-full gap-2 text-base font-semibold"
      >
        <a href={SUPPORT_WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
          <MessageCircle className="h-5 w-5" />
          Request Help on WhatsApp
        </a>
      </Button>
      <p className="text-xs text-muted-foreground text-center mt-2">
        Having trouble submitting? Get help directly via WhatsApp.
      </p>
    </motion.div>
  );
}
