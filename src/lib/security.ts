import { supabase } from '@/integrations/supabase/client';

interface RateLimitResponse {
  allowed: boolean;
  locked: boolean;
  attemptCount: number;
  retryAfterSeconds?: number;
  message?: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

/**
 * Check if login is allowed for a given email (rate limiting)
 */
export async function checkLoginRateLimit(email: string): Promise<RateLimitResponse> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/auth-guard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({
        action: 'check',
        email,
      }),
    });

    if (!response.ok) {
      console.error('Rate limit check failed:', response.status);
      // Fail open - allow login attempt if rate limit service is down
      return { allowed: true, locked: false, attemptCount: 0 };
    }

    return await response.json();
  } catch (error) {
    console.error('Rate limit check error:', error);
    // Fail open - allow login attempt if rate limit service is down
    return { allowed: true, locked: false, attemptCount: 0 };
  }
}

/**
 * Record a login attempt (success or failure)
 */
export async function recordLoginAttempt(
  email: string, 
  success: boolean, 
  failureReason?: string
): Promise<void> {
  try {
    await fetch(`${SUPABASE_URL}/functions/v1/auth-guard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({
        action: 'record',
        email,
        success,
        failureReason,
      }),
    });
  } catch (error) {
    // Non-blocking - don't prevent login if recording fails
    console.error('Failed to record login attempt:', error);
  }
}

/**
 * Strong password validation
 * Requirements: 8+ chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
 */
export function validateStrongPassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('At least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('One uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('One lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('One number');
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('One special character (!@#$%^&*...)');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

/**
 * Generate a secure session fingerprint
 * Used to detect session hijacking
 */
export function generateSessionFingerprint(): string {
  const data = [
    navigator.userAgent,
    navigator.language,
    new Date().getTimezoneOffset().toString(),
    screen.width.toString(),
    screen.height.toString(),
  ].join('|');
  
  // Simple hash for fingerprinting (not cryptographic)
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}
