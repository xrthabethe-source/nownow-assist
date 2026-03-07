import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Security Monitor Edge Function
 * 
 * Aggregates security signals across the platform:
 * - Suspicious login patterns (failed attempts, locked accounts)
 * - Driver verification fraud flags & risk scores
 * - Payment anomalies (failed payments, refunds, disputes)
 * - Rate-limited/blocked requests
 * - Recent audit trail
 * 
 * Risk levels: low (0-29), medium (30-59), high (60-79), critical (80-100)
 */

interface SecurityDashboardData {
  riskSummary: { low: number; medium: number; high: number; critical: number }
  suspiciousLogins: any[]
  fraudDrivers: any[]
  paymentAlerts: any[]
  recentAuditEvents: any[]
  blockedUsers: any[]
  systemHealth: {
    totalLoginAttempts24h: number
    failedLoginRate: number
    activeDisputes: number
    pendingVerifications: number
    highRiskDrivers: number
    flaggedPayments: number
  }
}

function getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score >= 80) return 'critical'
  if (score >= 60) return 'high'
  if (score >= 30) return 'medium'
  return 'low'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Authenticate admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Verify admin role
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single()

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const now = new Date()
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

    // Run all queries in parallel for performance
    const [
      loginAttemptsRes,
      failedLoginsRes,
      suspiciousEmailsRes,
      fraudDriversRes,
      failedPaymentsRes,
      disputesRes,
      auditLogsRes,
      blockedUsersRes,
      pendingVerificationsRes,
    ] = await Promise.all([
      // Total login attempts in 24h
      supabaseAdmin.from('login_attempts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', twentyFourHoursAgo),

      // Failed logins in 24h grouped by email (get raw data, aggregate in code)
      supabaseAdmin.from('login_attempts')
        .select('email, ip_address, created_at, failure_reason, user_agent')
        .eq('success', false)
        .gte('created_at', twentyFourHoursAgo)
        .order('created_at', { ascending: false })
        .limit(200),

      // Emails with 3+ failed attempts (suspicious)
      supabaseAdmin.from('login_attempts')
        .select('email, created_at, failure_reason, ip_address')
        .eq('success', false)
        .gte('created_at', twentyFourHoursAgo)
        .order('created_at', { ascending: false }),

      // Drivers with fraud risk score > 0
      supabaseAdmin.from('driver_verifications')
        .select('*, drivers!inner(user_id)')
        .gt('fraud_risk_score', 0)
        .order('fraud_risk_score', { ascending: false })
        .limit(50),

      // Failed or refunded payments in last week
      supabaseAdmin.from('payments')
        .select('*')
        .in('status', ['failed', 'refunded'])
        .gte('created_at', oneWeekAgo)
        .order('created_at', { ascending: false })
        .limit(50),

      // Open disputes
      supabaseAdmin.from('disputes')
        .select('*')
        .in('status', ['open', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(20),

      // Recent audit logs (critical/error/warn)
      supabaseAdmin.from('audit_logs')
        .select('*')
        .in('severity', ['critical', 'error', 'warn'])
        .gte('created_at', twentyFourHoursAgo)
        .order('created_at', { ascending: false })
        .limit(50),

      // Blocked users
      supabaseAdmin.from('message_blocks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20),

      // Pending verifications
      supabaseAdmin.from('driver_verifications')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'submitted'),
    ])

    // Aggregate suspicious login emails
    const failedLogins = failedLoginsRes.data || []
    const emailCounts: Record<string, { count: number; lastAttempt: string; ips: Set<string>; reasons: string[] }> = {}
    for (const attempt of failedLogins) {
      if (!emailCounts[attempt.email]) {
        emailCounts[attempt.email] = { count: 0, lastAttempt: attempt.created_at, ips: new Set(), reasons: [] }
      }
      emailCounts[attempt.email].count++
      emailCounts[attempt.email].ips.add(String(attempt.ip_address || 'unknown'))
      if (attempt.failure_reason && !emailCounts[attempt.email].reasons.includes(attempt.failure_reason)) {
        emailCounts[attempt.email].reasons.push(attempt.failure_reason)
      }
    }

    const suspiciousLogins = Object.entries(emailCounts)
      .filter(([_, data]) => data.count >= 3)
      .map(([email, data]) => ({
        email,
        failedAttempts: data.count,
        lastAttempt: data.lastAttempt,
        uniqueIPs: data.ips.size,
        reasons: data.reasons,
        riskLevel: data.count >= 5 ? 'critical' : data.count >= 4 ? 'high' : 'medium',
      }))
      .sort((a, b) => b.failedAttempts - a.failedAttempts)

    // Classify fraud drivers by risk level
    const fraudDrivers = (fraudDriversRes.data || []).map((d: any) => ({
      id: d.id,
      driverId: d.driver_id,
      userId: d.drivers?.user_id,
      fraudRiskScore: d.fraud_risk_score,
      fraudFlags: d.fraud_flags || [],
      status: d.status,
      riskLevel: getRiskLevel(d.fraud_risk_score),
      idDocStatus: d.id_doc_status,
      licenseStatus: d.license_status,
      profilePhotoStatus: d.profile_photo_status,
      backgroundCheckStatus: d.background_check_status,
      submittedAt: d.submitted_at,
    }))

    // Risk summary
    const riskSummary = { low: 0, medium: 0, high: 0, critical: 0 }
    for (const driver of fraudDrivers) {
      riskSummary[driver.riskLevel as keyof typeof riskSummary]++
    }
    for (const login of suspiciousLogins) {
      riskSummary[login.riskLevel as keyof typeof riskSummary]++
    }

    // Payment alerts
    const paymentAlerts = (failedPaymentsRes.data || []).map((p: any) => ({
      id: p.id,
      amount: p.amount,
      status: p.status,
      failureReason: p.failure_reason,
      createdAt: p.created_at,
      jobId: p.job_id,
      riskLevel: p.status === 'failed' ? 'high' : 'medium',
    }))

    const totalAttempts = loginAttemptsRes.count || 0
    const failedRate = totalAttempts > 0 ? (failedLogins.length / totalAttempts) * 100 : 0

    const dashboardData: SecurityDashboardData = {
      riskSummary,
      suspiciousLogins,
      fraudDrivers,
      paymentAlerts,
      recentAuditEvents: auditLogsRes.data || [],
      blockedUsers: blockedUsersRes.data || [],
      systemHealth: {
        totalLoginAttempts24h: totalAttempts,
        failedLoginRate: Math.round(failedRate * 10) / 10,
        activeDisputes: disputesRes.data?.length || 0,
        pendingVerifications: pendingVerificationsRes.count || 0,
        highRiskDrivers: fraudDrivers.filter((d: any) => d.riskLevel === 'high' || d.riskLevel === 'critical').length,
        flaggedPayments: paymentAlerts.length,
      },
    }

    return new Response(JSON.stringify(dashboardData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Security monitor error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
