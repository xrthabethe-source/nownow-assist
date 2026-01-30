import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Send,
  Phone,
  Loader2,
  MoreVertical,
  Shield,
  Ban,
  Check,
  CheckCheck,
} from "lucide-react";
import { SecureMessage, MessageStatus } from "@/hooks/useSecureMessaging";

interface SecureChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  otherPartyName: string;
  otherPartyId: string;
  otherPartyType: "customer" | "driver";
  messages: SecureMessage[];
  sending: boolean;
  rateLimited: boolean;
  onSendMessage: (text: string) => Promise<{ error: string | null }>;
  onCallClick: () => void;
  onReportClick: () => void;
  onBlockClick: () => void;
  currentUserId?: string;
}

const MessageStatusIcon = ({ status }: { status: MessageStatus }) => {
  switch (status) {
    case "sent":
      return <Check className="h-3 w-3 text-muted-foreground/50" />;
    case "delivered":
      return <CheckCheck className="h-3 w-3 text-muted-foreground/70" />;
    case "read":
      return <CheckCheck className="h-3 w-3 text-primary" />;
    default:
      return null;
  }
};

export const SecureChatDialog = ({
  open,
  onOpenChange,
  otherPartyName,
  otherPartyId,
  otherPartyType,
  messages,
  sending,
  rateLimited,
  onSendMessage,
  onCallClick,
  onReportClick,
  onBlockClick,
  currentUserId,
}: SecureChatDialogProps) => {
  const [newMessage, setNewMessage] = useState("");
  const [localSending, setLocalSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || localSending || sending || rateLimited) return;

    setLocalSending(true);
    const { error } = await onSendMessage(newMessage);
    setLocalSending(false);

    if (!error) {
      setNewMessage("");
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isSending = localSending || sending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md h-[80vh] flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-semibold">
                  {otherPartyName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-semibold">{otherPartyName}</p>
                <p className="text-xs text-muted-foreground font-normal">
                  {otherPartyType === "driver" ? "Your Driver" : "Customer"}
                </p>
              </div>
            </DialogTitle>

            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={onCallClick}>
                <Phone className="h-5 w-5 text-primary" />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onReportClick}>
                    <Shield className="mr-2 h-4 w-4" />
                    Report Issue
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onBlockClick} className="text-destructive">
                    <Ban className="mr-2 h-4 w-4" />
                    Block User
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </DialogHeader>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-3">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No messages yet</p>
                <p className="text-xs mt-1">
                  Send a message to start the conversation
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isOwnMessage = msg.sender_id === currentUserId;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                        isOwnMessage
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted text-foreground rounded-bl-sm"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {msg.message}
                      </p>
                      <div
                        className={`flex items-center justify-end gap-1 mt-1 ${
                          isOwnMessage
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                        }`}
                      >
                        <span className="text-[10px]">{formatTime(msg.created_at)}</span>
                        {isOwnMessage && <MessageStatusIcon status={msg.status} />}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t border-border">
          {rateLimited && (
            <p className="text-xs text-destructive mb-2 text-center">
              Slow down! Wait a moment before sending another message.
            </p>
          )}
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              maxLength={1000}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={isSending || rateLimited}
            />
            <Button
              size="icon"
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isSending || rateLimited}
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
