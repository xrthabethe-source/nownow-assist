/**
 * useSecurityMonitoring Hook
 * 
 * Fetches aggregated security data from the security-monitor edge function.
 * Used by the admin Security Monitoring dashboard.
 * 
 * Data includes:
 * - Risk summary (low/medium/high/critical counts)
 * - Suspicious login attempts
 * - Driver fraud flags
 * - Payment anomalies
 * - Recent audit events
 * - System health metrics
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface RiskSummary {
  low: number;
  medium: number;
  high: number;
  critical: number;
}

export interface SuspiciousLogin {
  email: string;
  failedAttempts: number;
  lastAttempt: string;
  uniqueIPs: number;
  reasons: string[];
  riskLevel: 'medium' | 'high' | 'critical';
}

export interface FraudDriver {
  id: string;
  driverId: string;
  userId: string;
  fraudRiskScore: number;
  fraudFlags: string[];
  status: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  idDocStatus: string;
  licenseStatus: string;
  profilePhotoStatus: string;
  backgroundCheckStatus: string;
  submittedAt: string | null;
}

export interface PaymentAlert {
  id: string;
  amount: number;
  status: string;
  failureReason: string | null;
  createdAt: string;
  jobId: string | null;
  riskLevel: 'medium' | 'high';
}

export interface SystemHealth {
  totalLoginAttempts24h: number;
  failedLoginRate: number;
  activeDisputes: number;
  pendingVerifications: number;
  highRiskDrivers: number;
  flaggedPayments: number;
}

export interface SecurityDashboardData {
  riskSummary: RiskSummary;
  suspiciousLogins: SuspiciousLogin[];
  fraudDrivers: FraudDriver[];
  paymentAlerts: PaymentAlert[];
  recentAuditEvents: any[];
  blockedUsers: any[];
  systemHealth: SystemHealth;
}

export function useSecurityMonitoring() {
  const { session, role } = useAuth();

  return useQuery<SecurityDashboardData>({
    queryKey: ['security-monitoring'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('security-monitor', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;
      return data as SecurityDashboardData;
    },
    enabled: !!session && role === 'admin',
    refetchInterval: 60000, // Refresh every 60 seconds
    staleTime: 30000,
  });
}
