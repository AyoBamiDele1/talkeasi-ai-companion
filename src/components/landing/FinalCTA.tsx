import { Mic, Heart } from "lucide-react";
import novaScreen from "@/assets/voice-chat-interface.png.asset.json";

interface FinalCTAProps {
  onStartTrial: () => void;
}

const FinalCTA = ({ onStartTrial }: FinalCTAProps) => {
  return (
    <section className="border-t border-[hsl(var(--section-divider))] bg-background px-6 py-16 md:py-20">
      <div
        className="mx-auto grid max-w-5xl items-center gap-10 overflow-hidden rounded-[28px] border border-border px-8 py-12 md:grid-cols-[0.8fr_1.2fr] md:px-14"
        style={{
          backgroundImage: "var(--gradient-cta-panel)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        {/* Phone with floating badges */}
        <div className="relative flex justify-center">
          <img
            src={novaScreen.url}
            alt="TalkEasi voice conversation screen"
            loading="lazy"
            className="w-[170px] max-w-full"
          />
          <span className="absolute -left-2 top-1/3 flex h-12 w-12 items-center justify-center rounded-full bg-primary shadow-[0_8px_24px_hsl(var(--primary)/0.4)]">
            <Mic className="h-5 w-5 text-primary-foreground" />
          </span>
          <span className="absolute -right-1 bottom-10 flex h-11 w-11 items-center justify-center rounded-full bg-secondary shadow-[0_8px_24px_hsl(212_82%_6%/0.5)]">
            <Heart className="h-5 w-5 text-primary" />
          </span>
        </div>

        {/* Copy */}
        <div className="text-center md:text-left">
          <h2 className="mb-4 font-serif text-[clamp(26px,3.2vw,36px)] font-medium leading-[1.15] tracking-[-0.01em] text-foreground">
            Your first talk is on us
          </h2>
          <p className="mx-auto mb-7 max-w-sm text-[15px] text-muted-foreground md:mx-0">
            Nova is ready to listen. Try a 2-minute talk right now — no sign-up
            required.
          </p>
          <button
            onClick={onStartTrial}
            className="rounded-full bg-primary px-6 py-[15px] text-[15px] font-bold text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_28px_hsl(var(--primary)/0.35)]"
          >
            Start 2-minute free talk
          </button>
          <div className="mt-4 font-mono text-[13px] uppercase tracking-[0.1em] text-accent">
            Start free · 1 credit = 1 minute
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
