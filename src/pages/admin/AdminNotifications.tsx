import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bell, 
  Briefcase, 
  CreditCard, 
  AlertTriangle, 
  CheckCheck, 
  Search,
  Filter,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminNotifications, AdminNotification } from "@/hooks/useAdminNotifications";
import { formatDistanceToNow, format } from "date-fns";

const getNotificationIcon = (type: AdminNotification['type'], severity: AdminNotification['severity']) => {
  switch (type) {
    case 'driver_application':
      return <Briefcase className="h-5 w-5 text-warning" />;
    case 'payment':
      return <CreditCard className={cn(
        "h-5 w-5",
        severity === 'success' && "text-success",
        severity === 'error' && "text-destructive",
        severity === 'warning' && "text-warning"
      )} />;
    case 'dispute':
      return <AlertTriangle className="h-5 w-5 text-destructive" />;
    case 'system_alert':
      return <AlertTriangle className={cn(
        "h-5 w-5",
        severity === 'error' && "text-destructive",
        severity === 'warning' && "text-warning",
        severity === 'info' && "text-primary"
      )} />;
    default:
      return <Bell className="h-5 w-5" />;
  }
};

const getSeverityBadge = (severity: AdminNotification['severity']) => {
  switch (severity) {
    case 'error':
      return <Badge variant="destructive">Error</Badge>;
    case 'warning':
      return <Badge className="bg-warning text-warning-foreground">Warning</Badge>;
    case 'success':
      return <Badge className="bg-success text-success-foreground">Success</Badge>;
    default:
      return <Badge variant="secondary">Info</Badge>;
  }
};

const getTypeBadge = (type: AdminNotification['type']) => {
  switch (type) {
    case 'driver_application':
      return <Badge variant="outline">Driver Application</Badge>;
    case 'payment':
      return <Badge variant="outline">Payment</Badge>;
    case 'dispute':
      return <Badge variant="outline">Dispute</Badge>;
    case 'system_alert':
      return <Badge variant="outline">System Alert</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

export default function AdminNotifications() {
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } = useAdminNotifications();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const filteredNotifications = notifications.filter((notification) => {
    const matchesSearch = 
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    if (activeTab === "unread") return matchesSearch && !notification.is_read;
    if (activeTab === "drivers") return matchesSearch && notification.type === "driver_application";
    if (activeTab === "payments") return matchesSearch && notification.type === "payment";
    if (activeTab === "disputes") return matchesSearch && notification.type === "dispute";
    if (activeTab === "alerts") return matchesSearch && notification.type === "system_alert";
    return matchesSearch;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
            <p className="text-muted-foreground">
              Manage and view all system notifications
            </p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button variant="outline" onClick={() => markAllAsRead()}>
                <CheckCheck className="mr-2 h-4 w-4" />
                Mark All Read ({unreadCount})
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Bell className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{notifications.length}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
                <Bell className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{unreadCount}</p>
                <p className="text-sm text-muted-foreground">Unread</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10">
                <Briefcase className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {notifications.filter(n => n.type === 'driver_application').length}
                </p>
                <p className="text-sm text-muted-foreground">Driver Applications</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {notifications.filter(n => n.type === 'dispute').length}
                </p>
                <p className="text-sm text-muted-foreground">Disputes</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader className="border-b">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>All Notifications</CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="border-b px-4">
                <TabsList className="h-12 w-full justify-start rounded-none bg-transparent p-0">
                  <TabsTrigger 
                    value="all" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                  >
                    All
                  </TabsTrigger>
                  <TabsTrigger 
                    value="unread"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                  >
                    Unread
                    {unreadCount > 0 && (
                      <Badge variant="destructive" className="ml-2 h-5 px-1.5">
                        {unreadCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="drivers"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                  >
                    Drivers
                  </TabsTrigger>
                  <TabsTrigger 
                    value="disputes"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                  >
                    Disputes
                  </TabsTrigger>
                  <TabsTrigger 
                    value="payments"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                  >
                    Payments
                  </TabsTrigger>
                  <TabsTrigger 
                    value="alerts"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                  >
                    Alerts
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value={activeTab} className="m-0">
                <ScrollArea className="h-[500px]">
                  {isLoading ? (
                    <div className="flex items-center justify-center p-12">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                  ) : filteredNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center">
                      <Bell className="mb-4 h-12 w-12 text-muted-foreground/30" />
                      <h3 className="text-lg font-medium">No notifications</h3>
                      <p className="text-sm text-muted-foreground">
                        {activeTab === "unread" 
                          ? "You're all caught up!" 
                          : "No notifications match your search"}
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredNotifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={cn(
                            "flex items-start gap-4 p-4 transition-colors hover:bg-muted/50",
                            !notification.is_read && "bg-primary/5"
                          )}
                        >
                          <div className="mt-1 shrink-0">
                            {getNotificationIcon(notification.type, notification.severity)}
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-1">
                                <p className={cn(
                                  "text-sm",
                                  !notification.is_read && "font-semibold"
                                )}>
                                  {notification.title}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {notification.message}
                                </p>
                              </div>
                              <div className="flex shrink-0 items-center gap-2">
                                {!notification.is_read && (
                                  <div className="h-2 w-2 rounded-full bg-primary" />
                                )}
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 pt-2">
                              {getTypeBadge(notification.type)}
                              {getSeverityBadge(notification.severity)}
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(notification.created_at), "MMM d, yyyy 'at' h:mm a")}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                ({formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })})
                              </span>
                            </div>
                          </div>
                          {!notification.is_read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              className="shrink-0"
                            >
                              Mark Read
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
