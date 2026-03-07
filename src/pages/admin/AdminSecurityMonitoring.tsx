/**
 * Admin Security Monitoring Dashboard
 * 
 * Displays real-time security intelligence:
 * - Risk overview cards (low/medium/high/critical)
 * - Suspicious login attempts with IP/email analysis
 * - Driver verification fraud flags & risk scores
 * - Payment anomalies and disputes
 * - Recent critical audit events
 * - System health indicators
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Lock,
  CreditCard,
  Users,
  Activity,
  RefreshCw,
  Eye,
  Clock,
  FileWarning,
  UserX,
  Loader2,
} from "lucide-react";
import { useSecurityMonitoring } from "@/hooks/useSecurityMonitoring";
import { format, formatDistanceToNow } from "date-fns";

const riskColors = {
  low: 'bg-success/10 text-success border-success/20',
  medium: 'bg-warning/10 text-warning border-warning/20',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  critical: 'bg-destructive/10 text-destructive border-destructive/20',
};

const riskBadgeVariant = {
  low: 'success' as const,
  medium: 'warning' as const,
  high: 'warning' as const,
  critical: 'destructive' as const,
};

export default function AdminSecurityMonitoring() {
  const { data, isLoading, refetch, isFetching } = useSecurityMonitoring();
  const [activeTab, setActiveTab] = useState("overview");

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Loading security data...</span>
        </div>
      </AdminLayout>
    );
  }

  const health = data?.systemHealth;
  const totalRisks = data ? data.riskSummary.low + data.riskSummary.medium + data.riskSummary.high + data.riskSummary.critical : 0;

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Security Monitoring
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time fraud detection, login monitoring, and risk analysis
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Risk Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4"
      >
        {[
          { label: 'Critical', count: data?.riskSummary.critical || 0, icon: ShieldX, color: 'text-destructive', bg: 'bg-destructive/10' },
          { label: 'High Risk', count: data?.riskSummary.high || 0, icon: ShieldAlert, color: 'text-orange-600', bg: 'bg-orange-100' },
          { label: 'Medium Risk', count: data?.riskSummary.medium || 0, icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10' },
          { label: 'Low Risk', count: data?.riskSummary.low || 0, icon: ShieldCheck, color: 'text-success', bg: 'bg-success/10' },
        ].map((item) => (
          <Card key={item.label} variant="default">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <item.icon className={`h-5 w-5 ${item.color}`} />
                {item.count > 0 && item.label === 'Critical' && (
                  <StatusBadge variant="destructive" pulse>Alert</StatusBadge>
                )}
              </div>
              <p className="text-2xl font-bold">{item.count}</p>
              <p className="text-sm text-muted-foreground">{item.label}</p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* System Health Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <Card variant="default">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm">System Health (24h)</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center">
              <div>
                <p className="text-lg font-bold">{health?.totalLoginAttempts24h || 0}</p>
                <p className="text-xs text-muted-foreground">Login Attempts</p>
              </div>
              <div>
                <p className={`text-lg font-bold ${(health?.failedLoginRate || 0) > 30 ? 'text-destructive' : ''}`}>
                  {health?.failedLoginRate || 0}%
                </p>
                <p className="text-xs text-muted-foreground">Failed Login Rate</p>
              </div>
              <div>
                <p className={`text-lg font-bold ${(health?.activeDisputes || 0) > 0 ? 'text-warning' : ''}`}>
                  {health?.activeDisputes || 0}
                </p>
                <p className="text-xs text-muted-foreground">Active Disputes</p>
              </div>
              <div>
                <p className="text-lg font-bold">{health?.pendingVerifications || 0}</p>
                <p className="text-xs text-muted-foreground">Pending Verifications</p>
              </div>
              <div>
                <p className={`text-lg font-bold ${(health?.highRiskDrivers || 0) > 0 ? 'text-destructive' : ''}`}>
                  {health?.highRiskDrivers || 0}
                </p>
                <p className="text-xs text-muted-foreground">High-Risk Drivers</p>
              </div>
              <div>
                <p className={`text-lg font-bold ${(health?.flaggedPayments || 0) > 0 ? 'text-warning' : ''}`}>
                  {health?.flaggedPayments || 0}
                </p>
                <p className="text-xs text-muted-foreground">Flagged Payments</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabbed Detail View */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview" className="gap-1">
            <Eye className="h-4 w-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="logins" className="gap-1">
            <Lock className="h-4 w-4" /> Logins
            {(data?.suspiciousLogins.length || 0) > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-[10px]">
                {data?.suspiciousLogins.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="drivers" className="gap-1">
            <Users className="h-4 w-4" /> Drivers
            {(data?.fraudDrivers.filter(d => d.riskLevel === 'high' || d.riskLevel === 'critical').length || 0) > 0 && (
              <Badge variant="warning" className="ml-1 h-5 px-1.5 text-[10px]">
                {data?.fraudDrivers.filter(d => d.riskLevel === 'high' || d.riskLevel === 'critical').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-1">
            <CreditCard className="h-4 w-4" /> Payments
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-1">
            <FileWarning className="h-4 w-4" /> Audit
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Top Suspicious Logins */}
            <Card variant="default">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Lock className="h-4 w-4 text-destructive" />
                  Top Suspicious Logins
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data?.suspiciousLogins.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No suspicious login activity detected</p>
                ) : (
                  <div className="space-y-3">
                    {data?.suspiciousLogins.slice(0, 5).map((login) => (
                      <div key={login.email} className={`rounded-lg border p-3 ${riskColors[login.riskLevel]}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-sm font-medium">{login.email}</span>
                          <StatusBadge variant={riskBadgeVariant[login.riskLevel]}>
                            {login.riskLevel}
                          </StatusBadge>
                        </div>
                        <p className="text-xs">
                          {login.failedAttempts} failed attempts · {login.uniqueIPs} IP(s) · {formatDistanceToNow(new Date(login.lastAttempt), { addSuffix: true })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Fraud Drivers */}
            <Card variant="default">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <UserX className="h-4 w-4 text-warning" />
                  Highest Risk Drivers
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data?.fraudDrivers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No fraud flags detected</p>
                ) : (
                  <div className="space-y-3">
                    {data?.fraudDrivers.slice(0, 5).map((driver) => (
                      <div key={driver.id} className={`rounded-lg border p-3 ${riskColors[driver.riskLevel]}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">Score: {driver.fraudRiskScore}/100</span>
                          <StatusBadge variant={riskBadgeVariant[driver.riskLevel]}>
                            {driver.riskLevel}
                          </StatusBadge>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {driver.fraudFlags.map((flag) => (
                            <Badge key={flag} variant="outline" className="text-[10px]">
                              {flag.replace(/_/g, ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Critical Audit Events */}
            <Card variant="default" className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileWarning className="h-4 w-4 text-primary" />
                  Recent Critical Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(data?.recentAuditEvents.length || 0) === 0 ? (
                  <p className="text-sm text-muted-foreground">No critical events in last 24 hours</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {data?.recentAuditEvents.slice(0, 10).map((event: any) => (
                      <div key={event.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <StatusBadge
                              variant={event.severity === 'critical' ? 'destructive' : event.severity === 'error' ? 'destructive' : 'warning'}
                            >
                              {event.severity}
                            </StatusBadge>
                            <span className="text-sm font-medium">{event.event_type}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {event.event_category} · {event.user_email || 'System'} · {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Logins Tab */}
        <TabsContent value="logins">
          <Card variant="default">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-destructive" />
                Suspicious Login Attempts (24h)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data?.suspiciousLogins.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShieldCheck className="h-12 w-12 mx-auto mb-3 text-success" />
                  <p>No suspicious login activity in the last 24 hours</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data?.suspiciousLogins.map((login) => (
                    <div key={login.email} className={`rounded-xl border p-4 ${riskColors[login.riskLevel]}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-sm font-bold">{login.email}</span>
                        <StatusBadge variant={riskBadgeVariant[login.riskLevel]}>
                          {login.riskLevel}
                        </StatusBadge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Failed Attempts</p>
                          <p className="font-bold">{login.failedAttempts}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Unique IPs</p>
                          <p className="font-bold">{login.uniqueIPs}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Last Attempt</p>
                          <p className="font-bold">
                            {formatDistanceToNow(new Date(login.lastAttempt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      {login.reasons.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {login.reasons.map((reason) => (
                            <Badge key={reason} variant="outline" className="text-[10px]">
                              {reason}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Drivers Tab */}
        <TabsContent value="drivers">
          <Card variant="default">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserX className="h-5 w-5 text-warning" />
                Driver Fraud Flags
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data?.fraudDrivers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShieldCheck className="h-12 w-12 mx-auto mb-3 text-success" />
                  <p>No driver fraud flags detected</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data?.fraudDrivers.map((driver) => (
                    <div key={driver.id} className={`rounded-xl border p-4 ${riskColors[driver.riskLevel]}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold">Risk Score: {driver.fraudRiskScore}/100</span>
                          <StatusBadge variant={riskBadgeVariant[driver.riskLevel]}>
                            {driver.riskLevel}
                          </StatusBadge>
                        </div>
                        <Badge variant="outline">{driver.status}</Badge>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-xs mt-2">
                        <div className="flex items-center gap-1">
                          <span className={driver.idDocStatus === 'approved' ? 'text-success' : 'text-muted-foreground'}>
                            ID: {driver.idDocStatus}
                          </span>
                        </div>
                        <div>License: {driver.licenseStatus}</div>
                        <div>Photo: {driver.profilePhotoStatus}</div>
                        <div>BG Check: {driver.backgroundCheckStatus}</div>
                      </div>
                      {driver.fraudFlags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {driver.fraudFlags.map((flag) => (
                            <Badge key={flag} variant="outline" className="text-[10px] border-destructive/50 text-destructive">
                              {flag.replace(/_/g, ' ')}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments">
          <Card variant="default">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Payment Alerts (7 days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data?.paymentAlerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShieldCheck className="h-12 w-12 mx-auto mb-3 text-success" />
                  <p>No payment anomalies in the last 7 days</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data?.paymentAlerts.map((payment) => (
                    <div key={payment.id} className={`rounded-xl border p-4 ${riskColors[payment.riskLevel]}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold">R{payment.amount.toLocaleString()}</span>
                        <div className="flex items-center gap-2">
                          <StatusBadge variant={payment.status === 'failed' ? 'destructive' : 'warning'}>
                            {payment.status}
                          </StatusBadge>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {payment.failureReason || 'No reason provided'} · {formatDistanceToNow(new Date(payment.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Tab */}
        <TabsContent value="audit">
          <Card variant="default">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileWarning className="h-5 w-5 text-primary" />
                Critical Audit Events (24h)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(data?.recentAuditEvents.length || 0) === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShieldCheck className="h-12 w-12 mx-auto mb-3 text-success" />
                  <p>No critical audit events in the last 24 hours</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {data?.recentAuditEvents.map((event: any) => (
                    <div key={event.id} className="rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <StatusBadge
                            variant={event.severity === 'critical' ? 'destructive' : event.severity === 'error' ? 'destructive' : 'warning'}
                          >
                            {event.severity}
                          </StatusBadge>
                          <span className="text-sm font-medium">{event.event_type}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(event.created_at), 'MMM d, HH:mm')}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{event.event_category}</span>
                        {event.user_email && <span>· {event.user_email}</span>}
                        {event.resource_type && <span>· {event.resource_type}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
