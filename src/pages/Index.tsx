// Onboarding/Welcome Screen - will redirect to Home after onboarding

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-primary/10 to-background p-6">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-primary mb-2">TalkEasi</h1>
            <p className="text-muted-foreground">Your AI English tutor</p>
          </div>
          
          <div className="mb-8">
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🗣️</span>
            </div>
            <h2 className="text-xl font-semibold mb-2">Welcome to TalkEasi!</h2>
            <p className="text-muted-foreground text-sm">
              Practice English conversation with AI and improve your fluency
            </p>
          </div>

          <div className="space-y-3">
            <Button onClick={() => navigate("/")} className="w-full">
              Get Started
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate("/")} 
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
