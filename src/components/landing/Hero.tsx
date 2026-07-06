import { Button } from "@/components/ui/button";
import NovaOrb from "@/components/NovaOrb";

interface HeroProps {
  onStartTrial: () => void;
  onSignIn: () => void;
}

const Hero = ({ onStartTrial, onSignIn }: HeroProps) => {
  return (
    <section className="relative overflow-hidden">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/15 via-background to-background" />
      <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />

      <div className="relative mx-auto flex max-w-3xl flex-col items-center px-6 pt-20 pb-16 text-center md:pt-28 md:pb-24">
        <div className="mb-8">
          <NovaOrb size="lg" />
        </div>

        <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-6xl">
          Someone to talk to,
          <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            anytime you need
          </span>
        </h1>

        <p className="mt-6 max-w-xl text-lg text-muted-foreground md:text-xl">
          Meet Nova, your AI friend. Stressed, lonely, or just want to vent? Talk
          out loud and Nova listens — no judgment, no typing, always there.
        </p>

        <div className="mt-10 flex w-full flex-col gap-3 sm:max-w-sm">
          <Button onClick={onStartTrial} size="lg" className="w-full text-base">
            🎤 Start 2-Minute Free Talk
          </Button>
          <Button
            onClick={onSignIn}
            variant="outline"
            size="lg"
            className="w-full text-base"
          >
            Sign In
          </Button>
        </div>

        <p className="mt-4 text-sm text-muted-foreground/80">
          Free to try · No sign-up needed to start
        </p>
      </div>
    </section>
  );
};

export default Hero;
