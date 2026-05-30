import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function RedirectShort() {
  const { code } = useParams<{ code: string }>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!code) {
        setError("Missing link code.");
        return;
      }
      const { data, error } = await supabase
        .from("short_links")
        .select("target_url, expires_at")
        .eq("code", code)
        .maybeSingle();
      if (cancelled) return;
      if (error || !data) {
        setError("This link is invalid or has expired.");
        return;
      }
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setError("This link has expired. Please request a new one on WhatsApp.");
        return;
      }
      window.location.replace(data.target_url);
    })();
    return () => {
      cancelled = true;
    };
  }, [code]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6 text-center">
      <div className="max-w-md space-y-3">
        {error ? (
          <>
            <h1 className="text-xl font-semibold text-foreground">Link unavailable</h1>
            <p className="text-muted-foreground">{error}</p>
            <a href="https://wa.me/27656636685" className="inline-block mt-4 text-accent underline">
              Contact Now-Now Assist on WhatsApp
            </a>
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold text-foreground">Redirecting to secure payment…</h1>
            <p className="text-muted-foreground">Hang tight, opening PayFast now.</p>
          </>
        )}
      </div>
    </div>
  );
}
