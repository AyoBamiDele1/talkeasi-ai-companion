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
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-primary mb-2">TalkEasi</h1>
            <p className="text-muted-foreground">English made Easi.</p>
          </div>
          
          <div className="mb-8">
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🗣️</span>
            </div>
            <h2 className="text-xl font-semibold mb-2">Speak English naturally — with your AI Coach!</h2>
            <p className="text-muted-foreground text-sm mb-2">
              Try it free for 1 minute. No signup needed.
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
