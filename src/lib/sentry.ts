/**
 * Sentry Configuration
 * 
 * Initializes Sentry for runtime error tracking in production.
 * Captures unhandled exceptions, performance metrics, and custom events.
 * 
 * To activate: set VITE_SENTRY_DSN in your environment.
 * Without a DSN, Sentry remains inactive (no-op).
 */

import * as Sentry from '@sentry/react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

export function initSentry() {
  if (!SENTRY_DSN) {
    console.info('[Sentry] No DSN configured — error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    // Performance: sample 10% of transactions in production
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    // Session Replay: capture 1% normally, 100% on error
    replaysSessionSampleRate: 0.01,
    replaysOnErrorSampleRate: 1.0,
    // Filter out noisy errors
    beforeSend(event) {
      // Don't send in development unless DSN is explicitly set
      if (import.meta.env.DEV && !SENTRY_DSN) return null;
      return event;
    },
  });
}

/**
 * Track a security event in Sentry for observability
 */
export function trackSecurityEvent(
  eventName: string,
  data?: Record<string, unknown>
) {
  Sentry.addBreadcrumb({
    category: 'security',
    message: eventName,
    data,
    level: 'warning',
  });
}

/**
 * Capture a handled error with context
 */
export function captureError(error: Error, context?: Record<string, unknown>) {
  Sentry.captureException(error, {
    extra: context,
  });
}

export { Sentry };
