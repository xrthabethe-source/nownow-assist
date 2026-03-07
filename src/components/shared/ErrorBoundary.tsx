import React, { Component, ErrorInfo, ReactNode } from "react";
import { ErrorFallback } from "./ErrorFallback";
import { supabase } from "@/integrations/supabase/client";
import { captureError } from "@/lib/sentry";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);

    // Report to Sentry
    captureError(error, { componentStack: errorInfo.componentStack });

    // Log to audit_logs table
    this.logErrorToAudit(error, errorInfo);
  }

  private async logErrorToAudit(error: Error, errorInfo: ErrorInfo) {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      await supabase.from("audit_logs").insert({
        event_category: "error",
        event_type: "runtime_crash",
        severity: "error",
        user_id: user?.id ?? null,
        user_email: user?.email ?? null,
        details: {
          message: error.message,
          name: error.name,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (logError) {
      // Silent fail - don't crash while logging crash
      console.error("Failed to log error to audit:", logError);
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <ErrorFallback
          error={this.state.error}
          resetError={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}
