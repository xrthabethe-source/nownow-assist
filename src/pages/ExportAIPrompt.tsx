import { useEffect, useState } from "react";
import { exportAIPromptPDF } from "@/utils/exportAIPromptPDF";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/shared/Logo";
import { FileDown, Check, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ExportAIPrompt = () => {
  const navigate = useNavigate();
  const [exported, setExported] = useState(false);

  const handleExport = () => {
    exportAIPromptPDF();
    setExported(true);
  };

  useEffect(() => {
    // Auto-export on page load
    handleExport();
  }, []);

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-6 text-center space-y-6">
          <Logo size="lg" className="mx-auto" />
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">AI Prompt Export</h1>
            <p className="text-muted-foreground">
              {exported 
                ? "Your PDF has been downloaded!" 
                : "Generating your comprehensive AI prompt document..."}
            </p>
          </div>

          {exported ? (
            <div className="flex items-center justify-center gap-2 text-green-600">
              <Check className="h-5 w-5" />
              <span className="font-medium">Download complete</span>
            </div>
          ) : (
            <div className="animate-pulse flex items-center justify-center gap-2 text-primary">
              <FileDown className="h-5 w-5" />
              <span>Generating PDF...</span>
            </div>
          )}

          <div className="flex flex-col gap-3 pt-4">
            <Button onClick={handleExport} variant="default" className="w-full">
              <FileDown className="h-4 w-4 mr-2" />
              Download Again
            </Button>
            <Button onClick={() => navigate("/")} variant="outline" className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExportAIPrompt;
