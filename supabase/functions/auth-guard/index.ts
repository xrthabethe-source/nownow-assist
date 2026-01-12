import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RateLimitRequest {
  action: 'check' | 'record'
  email?: string
  success?: boolean
  failureReason?: string
}

interface RateLimitResponse {
  allowed: boolean
  locked: boolean
  attemptCount: number
  retryAfterSeconds?: number
  message?: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    // Get client IP from headers
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
      || req.headers.get('x-real-ip') 
      || '0.0.0.0'
    
    const userAgent = req.headers.get('user-agent') || 'unknown'

    const body: RateLimitRequest = await req.json()
    const { action, email, success, failureReason } = body

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    if (action === 'check') {
      // Check if account is locked
      const { data: isLocked } = await supabaseAdmin.rpc('is_account_locked', {
        check_email: normalizedEmail
      })

      // Get failed attempt count for progressive delay
      const { data: attemptCount } = await supabaseAdmin.rpc('get_failed_attempt_count', {
        check_email: normalizedEmail,
        check_ip: clientIP
      })

      const count = attemptCount || 0
      
      // Progressive delay calculation
      // 0-2 attempts: no delay
      // 3 attempts: 2 second delay
      // 4 attempts: 5 second delay
      // 5+ attempts: locked for 15 minutes
      let retryAfterSeconds = 0
      if (count >= 5) {
        retryAfterSeconds = 900 // 15 minutes
      } else if (count === 4) {
        retryAfterSeconds = 5
      } else if (count === 3) {
        retryAfterSeconds = 2
      }

      const response: RateLimitResponse = {
        allowed: !isLocked && count < 5,
        locked: isLocked || count >= 5,
        attemptCount: count,
        retryAfterSeconds: retryAfterSeconds > 0 ? retryAfterSeconds : undefined,
        message: isLocked 
          ? 'Account temporarily locked. Please try again in 15 minutes.'
          : count >= 3 
            ? `Please wait ${retryAfterSeconds} seconds before trying again.`
            : undefined
      }

      return new Response(
        JSON.stringify(response),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } else if (action === 'record') {
      // Record login attempt
      const { error: insertError } = await supabaseAdmin
        .from('login_attempts')
        .insert({
          email: normalizedEmail,
          ip_address: clientIP,
          success: success ?? false,
          user_agent: userAgent,
          failure_reason: failureReason
        })

      if (insertError) {
        console.error('Failed to record login attempt:', insertError)
      }

      // If successful login, also log to audit
      if (success) {
        // Get user ID for the email
        const { data: userData } = await supabaseAdmin.auth.admin.listUsers()
        const user = userData?.users?.find(u => u.email?.toLowerCase() === normalizedEmail)
        
        if (user) {
          await supabaseAdmin.rpc('log_audit_event', {
            p_user_id: user.id,
            p_event_type: 'login_success',
            p_event_category: 'auth',
            p_details: JSON.stringify({ ip: clientIP, userAgent })
          })
        }
      }

      return new Response(
        JSON.stringify({ recorded: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Auth guard error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
