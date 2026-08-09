import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface GoogleSignInButtonProps {
  label?: string;
  variant?: "card" | "hero";
  className?: string;
}

const GoogleMark = () => (
  <svg viewBox="0 0 48 48" className="h-[18px] w-[18px]" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 3-2.26 5.54-4.78 7.25l7.73 6c4.51-4.18 7.09-10.36 7.09-17.72z" />
    <path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 0 1 9.77 24c0-1.6.28-3.14.76-4.59l-7.98-6.19A23.94 23.94 0 0 0 0 24c0 3.88.93 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);

const GoogleSignInButton = ({
  label = "Continue with Google",
  variant = "card",
  className = "",
}: GoogleSignInButtonProps) => {
  const { signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleClick = async () => {
    setIsRedirecting(true);
    const { error } = await signInWithGoogle();
    if (error) {
      setIsRedirecting(false);
      toast({
        title: "Google sign-in unavailable",
        description: error.message ?? "Please try again in a moment.",
        variant: "destructive",
      });
    }
  };

  const base =
    "inline-flex items-center justify-center gap-2.5 font-semibold transition-all disabled:opacity-60";
  const styles =
    variant === "hero"
      ? "rounded-full border border-border bg-background/40 px-6 py-[14px] text-[15px] text-foreground hover:-translate-y-0.5 hover:bg-background/70"
      : "w-full h-9 sm:h-10 rounded-md border border-border bg-background text-sm text-foreground hover:bg-muted";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isRedirecting}
      className={`${base} ${styles} ${className}`}
    >
      <GoogleMark />
      {isRedirecting ? "Redirecting…" : label}
    </button>
  );
};

export default GoogleSignInButton;
