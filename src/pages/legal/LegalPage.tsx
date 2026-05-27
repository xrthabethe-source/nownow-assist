import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/Logo";

interface LegalPageProps {
  title: string;
  updated?: string;
  children: ReactNode;
}

export default function LegalPage({ title, updated, children }: LegalPageProps) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-md">
        <div className="container flex items-center justify-between py-3">
          <button onClick={() => navigate("/")} className="flex items-center gap-2">
            <Logo size="md" />
          </button>
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Button>
        </div>
      </header>
      <main className="container max-w-3xl py-10">
        <h1 className="mb-2 text-3xl font-bold text-foreground md:text-4xl">{title}</h1>
        {updated && <p className="mb-8 text-sm text-muted-foreground">Last updated: {updated}</p>}
        <div className="prose prose-invert max-w-none space-y-4 text-foreground/90 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-6 [&_li]:my-1">
          {children}
        </div>
      </main>
    </div>
  );
}
