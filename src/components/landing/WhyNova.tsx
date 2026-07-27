const reasons = [
  { title: "Always available", description: "No appointments, no waiting rooms. Nova is ready whenever you are." },
  { title: "Judgment-free", description: "Speak openly. Nova meets you with warmth and never judges." },
  { title: "Remembers you", description: "Nova recalls what matters to you, so every talk picks up naturally." },
  { title: "A warm friend", description: "Not a clinical bot — a caring companion who genuinely listens." },
];

const WhyNova = () => {
  return (
    <section className="border-t border-border py-20 md:py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mx-auto mb-13 max-w-xl text-center">
          <div className="mb-3.5 font-mono text-[14px] uppercase tracking-[0.1em] text-accent">
            Why people talk to Nova
          </div>
          <h2 className="font-serif text-[clamp(26px,3.2vw,36px)] font-medium leading-[1.15] tracking-[-0.01em] text-foreground">
            Built to feel less like software, more like a friend
          </h2>
        </div>

        <div className="mx-auto grid max-w-3xl grid-cols-1 gap-x-14 gap-y-10 md:grid-cols-2">
          {reasons.map((r) => (
            <div key={r.title}>
              <h3 className="mb-2 flex items-center gap-2.5 text-base font-bold text-foreground">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {r.title}
              </h3>
              <p className="pl-4 text-sm text-muted-foreground">{r.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyNova;
