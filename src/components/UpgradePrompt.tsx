import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, ArrowRight, Lock } from "lucide-react";

interface UpgradePromptProps {
  featureName: string;
  description?: string;
  className?: string;
}

export const UpgradePrompt = ({ featureName, description, className = "" }: UpgradePromptProps) => {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    navigate("/upgrade");
  };

  return (
    <Card className={`border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 ${className}`}>
      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-3 h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
          <Lock className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-lg">Pro-Feature erforderlich</CardTitle>
        <CardDescription>
          {description || `${featureName} ist nur im Pro-Paket verfügbar.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4 text-primary" />
          <span>Upgrade auf Pro für alle KI-Features</span>
        </div>
        <Button onClick={handleUpgrade} className="w-full">
          Auf Pro upgraden
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};

interface FeatureGateProps {
  feature: string;
  hasAccess: boolean;
  children: React.ReactNode;
  featureName?: string;
  description?: string;
}

export const FeatureGate = ({ 
  feature, 
  hasAccess, 
  children, 
  featureName,
  description 
}: FeatureGateProps) => {
  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      <div className="opacity-30 pointer-events-none blur-[2px]">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <UpgradePrompt 
          featureName={featureName || feature} 
          description={description}
          className="max-w-sm shadow-lg"
        />
      </div>
    </div>
  );
};
