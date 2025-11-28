// Onboarding/Welcome Screen - will redirect to Home after onboarding

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useUserLocation } from "@/hooks/useUserLocation";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { isNigerian, loading: locationLoading } = useUserLocation();

  useEffect(() => {
    if (!loading && user) {
      navigate("/home");
    }
  }, [user, loading, navigate]);

  return (
    <div className="flex min-h-screen items-start md:items-center justify-center bg-gradient-to-b from-primary/10 to-background p-6 pt-16 md:pt-6">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <div className="text-center mb-6 md:mb-8">
            <div className="mb-4 md:mb-6">
              <div className="inline-block p-3 md:p-4 bg-primary/10 rounded-full mb-3 md:mb-4">
                <span className="text-3xl md:text-4xl -tracking-[0.15em]">💞🎓</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-2 md:mb-3">
                TalkEasi
              </h1>
              <p className="text-base md:text-xl text-muted-foreground">
                {(locationLoading || isNigerian) ? "Your AI Companion + English Lessons" : "Your AI Companion"}
              </p>
            </div>

            <p className="text-muted-foreground mb-4 md:mb-6">
              {(locationLoading || isNigerian) 
                ? "Talk when you're lonely, or practice English." 
                : "Talk when you're lonely. Your AI friend is always here."}
              <br className="hidden md:block" />
              Your AI friend is always available.
            </p>
          </div>

          <div className="space-y-3">
            <Button onClick={() => navigate("/trial")} className="w-full" size="lg">
              🎤 Start 2-Minute Free Talk
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate("/auth")} 
              className="w-full"
            >
              Sign In
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
