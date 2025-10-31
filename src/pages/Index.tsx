// Onboarding/Welcome Screen - will redirect to Home after onboarding

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate("/home");
    }
  }, [user, loading, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-primary/10 to-background p-6">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <div className="text-center mb-6 md:mb-8">
            <div className="mb-4 md:mb-6">
              <div className="inline-block p-3 md:p-4 bg-primary/10 rounded-full mb-3 md:mb-4">
                <span className="text-3xl md:text-4xl">💞🎓</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-2 md:mb-3">
                TalkEasi
              </h1>
              <p className="text-base md:text-xl text-muted-foreground">
                Your AI Companion + English Practice
              </p>
            </div>

            <p className="text-muted-foreground mb-4 md:mb-6">
              Chat when you're lonely, or practice English.
              <br className="hidden md:block" />
              Your AI friend is always available, never judges.
            </p>
            
            <p className="text-sm text-muted-foreground/80 mb-4 md:mb-6">
              Powered by AI | Designed for users worldwide
            </p>
          </div>

          <div className="space-y-3">
            <Button onClick={() => navigate("/trial")} className="w-full" size="lg">
              🎤 Start 1-Minute Free Talk
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate("/auth")} 
              className="w-full"
            >
              Sign In
            </Button>
          </div>
          
          <p className="text-xs text-center text-muted-foreground mt-6">
            Powered by AI | Designed for learners worldwide 🌍
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
