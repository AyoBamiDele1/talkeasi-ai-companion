import { Check, Clock, HeartHandshake, Sparkles } from "lucide-react";
import novaScreen from "@/assets/voice-chat-interface.png.asset.json";
import GoogleSignInButton from "@/components/GoogleSignInButton";


interface HeroProps {
  onStartTrial: () => void;
  onSignIn: () => void;
}

const trustItems = [
  { icon: Clock, label: "Always available" },
  { icon: HeartHandshake, label: "Judgment-free" },
  { icon: Sparkles, label: "Remembers you" },
];

const Hero = ({ onStartTrial }: HeroProps) => {
  return (
    <header className="relative overflow-hidden bg-[hsl(var(--section-base))] px-6 pb-16 pt-12 md:pb-24 md:pt-20">
      <div className="mx-auto grid max-w-6xl items-center gap-14 md:grid-cols-[1.05fr_0.95fr]">
        {/* Copy */}
        <div>
          <div className="mb-5 flex items-center gap-2.5 font-mono text-[13px] uppercase tracking-[0.12em] text-accent">
            <span className="relative inline-block h-[7px] w-[7px] rounded-full bg-primary shadow-[0_0_0_4px_hsl(var(--primary)/0.2)]" />
            Nova is listening
          </div>
          <h1 className="font-serif text-[clamp(38px,5vw,62px)] font-medium leading-[1.06] tracking-[-0.015em] text-foreground">
            <span className="whitespace-nowrap">Someone to talk to,</span>
            <br />
            <span className="whitespace-nowrap text-primary">
              anytime you need
            </span>
          </h1>
          <p className="mt-6 max-w-md text-[17px] text-muted-foreground">
            Meet Nova, your AI friend. Stressed, lonely, or just need to talk —
            Nova's always listening, no judgment.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              onClick={onStartTrial}
              className="rounded-full bg-primary px-6 py-[15px] text-[15px] font-bold text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_28px_hsl(var(--primary)/0.35)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-accent"
            >
              Try 2-minute free talk
            </button>
            <GoogleSignInButton variant="hero" />
          </div>

          <div className="mt-5 flex items-center gap-2 font-mono text-[14px] text-muted-foreground/80 md:text-[15px] leading-relaxed">
            <Check className="h-4 w-4 text-accent" strokeWidth={2.5} />
            Free to try — 1 credit = 1 minute
          </div>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-5">
            {trustItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-1.5 text-[14px] text-muted-foreground/90 md:text-[15px] leading-relaxed"
              >
                <item.icon className="h-3.5 w-3.5 text-accent" strokeWidth={2} />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Real app screen */}
        <div className="relative flex justify-center">
          <div
            className="pointer-events-none absolute inset-0 -m-16"
            style={{ backgroundImage: "var(--gradient-hero-glow)" }}
          />
          <span className="pointer-events-none absolute left-2 top-16 h-2.5 w-2.5 rounded-full border border-primary/60 md:left-0" />
          <span className="pointer-events-none absolute bottom-20 right-2 h-3 w-3 rounded-full border border-accent/60 md:right-0" />
          <img
            src={novaScreen.url}
            alt="Nova voice chat interface in the TalkEasi app, showing credits, speaking time and the Nova Live button"
            loading="lazy"
            className="relative block w-[300px] max-w-full motion-safe:animate-[floatPhone_6s_ease-in-out_infinite]"
          />
        </div>
      </div>

      <style>{`
        @keyframes floatPhone {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </header>
  );
};

export default Hero;

