import { useState, useEffect } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';


export default function Auth() {
  const { user, signIn, signUp, loading } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'signin';
  const [isLoading, setIsLoading] = useState(false);
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  // Check for password recovery token on mount
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    if (type === 'recovery') {
      setIsRecoveryMode(true);
    }
  }, []);

  // Redirect if already authenticated (unless in recovery mode)
  if (user && !loading && !isRecoveryMode) {
    return <Navigate to="/home" replace />;
  }

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { error } = await signIn(email, password);
    
    if (error) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive"
      });
    }
    
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const displayName = formData.get('displayName') as string;

    const { error } = await signUp(email, password, displayName);
    
    if (error) {
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Account created!",
        description: "Please check your email to verify your account.",
      });
    }
    
    setIsLoading(false);
  };

  const handlePasswordReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setResetEmailSent(false);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('reset-email') as string;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?mode=reset`,
    });
    
    if (error) {
      toast({
        title: "Password reset failed",
        description: error.message,
        variant: "destructive"
      });
    } else {
      setResetEmailSent(true);
      toast({
        title: "Check your email",
        description: "We've sent you a password reset link.",
      });
    }
    
    setIsLoading(false);
  };

  const handlePasswordUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const newPassword = formData.get('new-password') as string;

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) {
      toast({
        title: "Password update failed",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Password updated!",
        description: "You can now sign in with your new password.",
      });
      setIsRecoveryMode(false);
      window.location.hash = '';
      window.history.replaceState(null, '', '/auth?mode=signin');
    }
    
    setIsLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-start sm:items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/10 p-3 sm:p-4 py-4 sm:py-6 overflow-y-auto">
      <div className="w-full max-w-md my-auto">
        <div className="text-center mb-3 sm:mb-8">
          <div className="inline-flex items-center gap-2 mb-2 sm:mb-4">
            <div className="inline-block p-1.5 sm:p-2 bg-primary/10 rounded-full">
              <span className="text-xl sm:text-2xl">💬</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">TalkEasi</h1>
          </div>
          <p className="text-xs sm:text-base text-muted-foreground px-2">Talk, share, and connect with Nova.</p>
        </div>

        <Card>
          <Tabs defaultValue={mode} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
              <TabsTrigger value="reset">Reset</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <Card>
                <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-6">
                  <CardTitle className="text-lg sm:text-2xl">Welcome back</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Sign in to continue talking with Nova</CardDescription>
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-2 sm:pt-6">
                  <form onSubmit={handleSignIn} className="space-y-2.5 sm:space-y-4">
                    <div className="space-y-1 sm:space-y-2">
                      <Label htmlFor="signin-email" className="text-xs sm:text-sm">Email</Label>
                      <Input
                        id="signin-email"
                        name="email"
                        type="email"
                        placeholder="your.email@example.com"
                        required
                        className="h-9 sm:h-10 text-sm"
                      />
                    </div>
                    <div className="space-y-1 sm:space-y-2">
                      <Label htmlFor="signin-password" className="text-xs sm:text-sm">Password</Label>
                      <div className="relative">
                        <Input
                          id="signin-password"
                          name="password"
                          type={showSignInPassword ? "text" : "password"}
                          required
                          className="pr-10 h-9 sm:h-10 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSignInPassword(!showSignInPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          aria-label={showSignInPassword ? "Hide password" : "Show password"}
                        >
                          {showSignInPassword ? <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                        </button>
                      </div>
                    </div>
                    <Button type="submit" className="w-full h-9 sm:h-10 text-sm sm:text-base mt-3 sm:mt-4" disabled={isLoading}>
                      {isLoading ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="signup">
              <Card>
                <CardHeader className="p-3 sm:p-6 pb-1.5 sm:pb-6">
                  <CardTitle className="text-base sm:text-2xl">Create account</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Start talking with Nova, your AI friend</CardDescription>
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-1.5 sm:pt-6">
                  <form onSubmit={handleSignUp} className="space-y-2 sm:space-y-4">
                    <div className="space-y-0.5 sm:space-y-2">
                      <Label htmlFor="signup-name" className="text-xs sm:text-sm">Display Name</Label>
                      <Input
                        id="signup-name"
                        name="displayName"
                        type="text"
                        placeholder="Your name"
                        required
                        className="h-8 sm:h-10 text-sm"
                      />
                    </div>
                    <div className="space-y-0.5 sm:space-y-2">
                      <Label htmlFor="signup-email" className="text-xs sm:text-sm">Email</Label>
                      <Input
                        id="signup-email"
                        name="email"
                        type="email"
                        placeholder="your.email@example.com"
                        required
                        className="h-8 sm:h-10 text-sm"
                      />
                    </div>
                    <div className="space-y-0.5 sm:space-y-2">
                      <Label htmlFor="signup-password" className="text-xs sm:text-sm">Password</Label>
                      <div className="relative">
                        <Input
                          id="signup-password"
                          name="password"
                          type={showSignUpPassword ? "text" : "password"}
                          minLength={6}
                          required
                          className="pr-9 h-8 sm:h-10 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          aria-label={showSignUpPassword ? "Hide password" : "Show password"}
                        >
                          {showSignUpPassword ? <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                        </button>
                      </div>
                    </div>
                    <Button type="submit" className="w-full h-8 sm:h-10 text-xs sm:text-base font-semibold mt-2 sm:mt-4" disabled={isLoading}>
                      {isLoading ? "Creating account..." : "Create Account"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reset">
              <Card>
                <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-6">
                  <CardTitle className="text-lg sm:text-2xl">
                    {isRecoveryMode ? "Set new password" : "Reset password"}
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    {isRecoveryMode 
                      ? "Enter your new password below"
                      : resetEmailSent 
                        ? "Check your email for the reset link" 
                        : "Enter your email to receive a reset link"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-2 sm:pt-6">
                  {isRecoveryMode ? (
                    <form onSubmit={handlePasswordUpdate} className="space-y-2.5 sm:space-y-4">
                      <div className="space-y-1 sm:space-y-2">
                        <Label htmlFor="new-password" className="text-xs sm:text-sm">New Password</Label>
                        <div className="relative">
                          <Input
                            id="new-password"
                            name="new-password"
                            type={showNewPassword ? "text" : "password"}
                            minLength={6}
                            required
                            className="pr-10 h-9 sm:h-10 text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            aria-label={showNewPassword ? "Hide password" : "Show password"}
                          >
                            {showNewPassword ? <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                          </button>
                        </div>
                      </div>
                      <Button type="submit" className="w-full h-9 sm:h-10 text-sm sm:text-base mt-3 sm:mt-4" disabled={isLoading}>
                        {isLoading ? "Updating..." : "Update Password"}
                      </Button>
                    </form>
                  ) : resetEmailSent ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground mb-4">
                        We've sent a password reset link to your email. Please check your inbox and follow the instructions.
                      </p>
                      <Button 
                        variant="outline" 
                        onClick={() => setResetEmailSent(false)}
                        className="w-full h-9 sm:h-10 text-sm"
                      >
                        Send another link
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handlePasswordReset} className="space-y-2.5 sm:space-y-4">
                      <div className="space-y-1 sm:space-y-2">
                        <Label htmlFor="reset-email" className="text-xs sm:text-sm">Email</Label>
                        <Input
                          id="reset-email"
                          name="reset-email"
                          type="email"
                          placeholder="your.email@example.com"
                          required
                          className="h-9 sm:h-10 text-sm"
                        />
                      </div>
                      <Button type="submit" className="w-full h-9 sm:h-10 text-sm sm:text-base mt-3 sm:mt-4" disabled={isLoading}>
                        {isLoading ? "Sending..." : "Send Reset Link"}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
