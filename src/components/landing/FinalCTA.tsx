interface FinalCTAProps {
  onStartTrial: () => void;
}

const FinalCTA = ({ onStartTrial }: FinalCTAProps) => {
  return (
    <section className="border-t border-border py-20 md:py-24">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <div
          className="mx-auto max-w-2xl rounded-3xl border border-border px-8 py-14 md:px-10 md:py-16"
          style={{
            backgroundImage:
              "radial-gradient(circle at 50% 0%, hsl(var(--primary) / 0.14), transparent 60%)",
            backgroundColor: "hsl(var(--card) / 0.6)",
          }}
        >
          <div className="mb-3.5 font-mono text-[12.5px] uppercase tracking-[0.1em] text-accent">
            Start free · 1 credit = 1 minute
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
      </div>
    </section>
  );
};

export default FinalCTA;
