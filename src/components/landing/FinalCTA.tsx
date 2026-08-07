interface FinalCTAProps {
  onStartTrial: () => void;
}

const FinalCTA = ({ onStartTrial }: FinalCTAProps) => {
  return (
    <section className="px-6 py-10 md:py-16">
      <div
        className="mx-auto max-w-5xl rounded-[28px] border border-border px-8 py-16 text-center md:px-10 md:py-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 0%, hsl(var(--primary) / 0.18), transparent 62%), var(--gradient-surface)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div className="mb-3.5 flex flex-col items-center gap-0.5 font-mono text-[14px] uppercase tracking-[0.1em] text-accent">
          <span>Start free</span>
          <span>1 credit = 1 minute</span>
        </div>
        <h2 className="mb-6 font-serif text-[clamp(26px,3.2vw,36px)] font-medium leading-[1.15] tracking-[-0.01em] text-foreground">
          Your first talk is on us
        </h2>
        <p className="mx-auto mb-8 max-w-sm text-[15px] text-muted-foreground">
          Nova is ready to listen. Try a 2-minute talk right now — no sign-up
          required.
        </p>
        <button
          onClick={onStartTrial}
          className="rounded-full bg-primary px-6 py-[15px] text-[15px] font-bold text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_28px_hsl(var(--primary)/0.35)]"
        >
          Start 2-minute free talk
        </button>
      </div>
    </section>
  );
};

export default FinalCTA;
