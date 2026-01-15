import { useState } from 'react';
import { Bell, Briefcase, CreditCard, AlertTriangle, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useAdminNotifications, AdminNotification } from '@/hooks/useAdminNotifications';
import { formatDistanceToNow } from 'date-fns';

const getNotificationIcon = (type: AdminNotification['type'], severity: AdminNotification['severity']) => {
  switch (type) {
    case 'job_request':
      return <Briefcase className="h-4 w-4 text-primary" />;
    case 'payment':
      return <CreditCard className={cn(
        "h-4 w-4",
        severity === 'success' && "text-success",
        severity === 'error' && "text-destructive",
        severity === 'warning' && "text-warning"
      )} />;
    case 'system_alert':
      return <AlertTriangle className={cn(
        "h-4 w-4",
        severity === 'error' && "text-destructive",
        severity === 'warning' && "text-warning",
        severity === 'info' && "text-primary"
      )} />;
    default:
      return <Bell className="h-4 w-4" />;
  }
};

const getSeverityStyles = (severity: AdminNotification['severity']) => {
  switch (severity) {
    case 'error':
      return 'border-l-destructive bg-destructive/5';
    case 'warning':
      return 'border-l-warning bg-warning/5';
    case 'success':
      return 'border-l-success bg-success/5';
    default:
      return 'border-l-primary bg-primary/5';
  }
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } = useAdminNotifications();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border p-3">
          <h4 className="font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => markAllAsRead()}
            >
              <CheckCheck className="mr-1 h-3 w-3" />
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="h-80">
          {isLoading ? (
            <div className="flex items-center justify-center p-6">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <Bell className="mb-2 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => {
                    if (!notification.is_read) {
                      markAsRead(notification.id);
                    }
                  }}
                  className={cn(
                    "flex w-full items-start gap-3 border-l-2 p-3 text-left transition-colors hover:bg-muted/50",
                    notification.is_read 
                      ? "border-l-transparent bg-transparent opacity-60" 
                      : getSeverityStyles(notification.severity)
                  )}
                >
                  <div className="mt-0.5 shrink-0">
                    {getNotificationIcon(notification.type, notification.severity)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {notification.message}
                    </p>
                    <p className="text-[10px] text-muted-foreground/70">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  {!notification.is_read && (
                    <div className="mt-1">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        <Separator />
        <div className="p-2">
          <Button variant="ghost" size="sm" className="w-full text-xs">
            View All Notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
