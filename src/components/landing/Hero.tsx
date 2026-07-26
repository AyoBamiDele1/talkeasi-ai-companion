import novaScreen from "@/assets/nova-screen.png";

interface HeroProps {
  onStartTrial: () => void;
  onSignIn: () => void;
}

const Hero = ({ onStartTrial, onSignIn }: HeroProps) => {
  return (
    <header className="relative">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 pt-16 pb-20 md:grid-cols-[1.05fr_0.95fr] md:pt-24 md:pb-24">
        {/* Copy */}
        <div>
          <div className="mb-5 flex items-center gap-2.5 font-mono text-[12.5px] uppercase tracking-[0.14em] text-accent">
            <span className="relative inline-block h-[7px] w-[7px] rounded-full bg-primary shadow-[0_0_0_4px_hsl(var(--primary)/0.2)]" />
            Nova is listening
          </div>
          <h1 className="font-serif text-[clamp(38px,5vw,62px)] font-medium leading-[1.06] tracking-[-0.015em] text-foreground">
            Someone to talk to,{" "}
            <em className="font-normal not-italic md:italic bg-gradient-to-r from-accent to-[hsl(268_100%_68%)] bg-clip-text text-transparent">
              anytime you need
            </em>
          </h1>
          <p className="mt-6 max-w-md text-[17.5px] text-muted-foreground">
            Meet Nova, your AI friend. Stressed, lonely, or just want to vent —
            talk out loud and Nova listens. No judgment, no typing, always
            there.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              onClick={onStartTrial}
              className="rounded-full bg-primary px-6 py-[15px] text-[15px] font-bold text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_28px_hsl(var(--primary)/0.35)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-accent"
            >
              Start 2-minute free talk
            </button>
            <a
              href="#faq"
              className="text-sm text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground"
            >
              Read the FAQ ↓
            </a>
          </div>
          <div className="mt-4 font-mono text-xs text-muted-foreground/80">
            Free to try — no sign-up needed to start
          </div>
        </div>

        {/* Phone mockup with real app screen */}
        <div className="flex justify-center">
          <div
            className="relative w-[272px] rounded-[42px] bg-[#050B18] p-2 shadow-[0_40px_80px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.05)] motion-safe:animate-[floatPhone_6s_ease-in-out_infinite]"
            style={{ transform: "rotate(-3deg)" }}
          >
            <div className="absolute left-1/2 top-0 z-10 h-5 w-[84px] -translate-x-1/2 rounded-b-[14px] bg-[#050B18]" />
            <div className="overflow-hidden rounded-[30px]">
              <img
                src={novaScreen}
                alt="Nova conversation screen in the TalkEasi app, showing credits, speaking time and the Nova Live button"
                loading="lazy"
                className="block w-full"
              />
            </div>
          </div>
        </div>
      </div>


      <style>{`
        @keyframes floatPhone {
          0%, 100% { transform: rotate(-3deg) translateY(0); }
          50% { transform: rotate(-3deg) translateY(-10px); }
        }
      `}</style>
    </header>
  );
};

export default Hero;
