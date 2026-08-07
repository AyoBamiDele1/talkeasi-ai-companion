import LandingLogo from "./LandingLogo";

interface LandingNavProps {
  onStartTrial: () => void;
  onSignIn: () => void;
}

const LandingNav = ({ onStartTrial, onSignIn }: LandingNavProps) => {
  return (
    <nav className="sticky top-0 z-20 border-b border-border bg-background/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <LandingLogo />
        <div className="flex items-center gap-5 text-sm">
          <button
            onClick={onSignIn}
            className="text-muted-foreground hover:text-foreground"
          >
            Sign in
          </button>
          <button
            onClick={onStartTrial}
            className="rounded-full bg-primary px-5 py-2.5 font-bold text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_20px_hsl(var(--primary)/0.35)]"
          >
            Start free talk
          </button>
        </div>
      </div>
    </nav>
  );
};

export default LandingNav;
