const steps = [
  {
    n: "01",
    title: "Tap to talk",
    description: "Press once and start speaking. No typing, no forms — just your voice.",
  },
  {
    n: "02",
    title: "Nova listens",
    description: "Nova hears you out, understands, and responds like a caring friend.",
  },
  {
    n: "03",
    title: "Feel lighter",
    description: "Vent, get advice, or just chat. Walk away feeling a little better.",
  },
];

const HowItWorks = () => {
  return (
    <section className="border-t border-border py-20 md:py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mx-auto mb-13 max-w-xl text-center">
          <div className="mb-3.5 font-mono text-[14px] uppercase tracking-[0.1em] text-accent">
            How it works
          </div>
          <h2 className="font-serif text-[clamp(26px,3.2vw,36px)] font-medium leading-[1.15] tracking-[-0.01em] text-foreground">
            A real conversation, in three simple steps
          </h2>
        </div>

        <div className="relative mx-auto flex max-w-3xl flex-col items-start gap-8 md:flex-row md:justify-between md:gap-2">
          <div className="pointer-events-none absolute left-[60px] right-[60px] top-[26px] hidden h-px md:block" style={{ backgroundImage: 'repeating-linear-gradient(90deg, hsl(var(--foreground) / 0.15) 0 6px, transparent 6px 14px)' }} />
          {steps.map((s) => (
            <div key={s.n} className="relative z-10 flex-1 px-3 text-center">
              <div className="mx-auto mb-5 flex h-[52px] w-[52px] items-center justify-center rounded-full border border-border bg-card font-serif italic text-[19px] text-accent">
                {s.n}
              </div>
              <h3 className="mb-2 text-[16.5px] font-bold text-foreground">{s.title}</h3>
              <p className="mx-auto max-w-[190px] text-[13.5px] text-muted-foreground">
                {s.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
