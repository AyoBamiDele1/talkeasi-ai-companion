import { Button } from "@/components/ui/button";
import { Mic } from "lucide-react";
import heroNova from "@/assets/hero-nova.png";

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

      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-6 pt-16 pb-16 md:grid-cols-2 md:gap-12 md:pt-24 md:pb-24">
        {/* Illustration (top on mobile, right on desktop) */}
        <div className="order-1 flex justify-center md:order-2">
          <div className="relative">
            <div className="pointer-events-none absolute inset-0 -z-10 scale-90 rounded-full bg-primary/25 blur-3xl" />
            <img
              src={heroNova}
              alt="A person relaxing and talking with Nova, a warm glowing AI companion orb"
              width={1024}
              height={1024}
              loading="eager"
              className="w-full max-w-sm rounded-3xl md:max-w-md"
            />
          </div>
        </div>

        {/* Copy + CTAs */}
        <div className="order-2 flex flex-col items-center text-center md:order-1 md:items-start md:text-left">
          <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-6xl">
            Someone to talk to,
            <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              anytime you need
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg text-muted-foreground md:text-xl">
            Meet Nova, your AI friend. Stressed, lonely, or just want to vent?
            Talk out loud and Nova listens — no judgment, no typing, always
            there.
          </p>

          <div className="mt-10 flex w-full flex-col gap-3 sm:max-w-sm md:mx-0">
            <Button onClick={onStartTrial} size="lg" className="w-full text-base">
              <Mic className="mr-2 h-5 w-5" />
              Start 2-Minute Free Talk
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
      </div>
    </section>
  );
};

export default Hero;
