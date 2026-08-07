import SectionShell from "./SectionShell";

const reasons = [
  { title: "Always available", description: "No appointments, no waiting rooms. Nova is ready whenever you are." },
  { title: "Judgment-free", description: "Speak openly. Nova meets you with warmth and never judges." },
  { title: "Remembers you", description: "Nova recalls what matters to you, so every talk picks up naturally." },
  { title: "A warm friend", description: "Not a clinical bot — a caring companion who genuinely listens." },
];

const WhyNova = () => {
  return (
    <SectionShell
      eyebrow="Why people talk to Nova"
      heading="Built to feel less like software, more like a friend"
    >
      <div className="mx-auto grid max-w-3xl grid-cols-1 gap-5 sm:grid-cols-2">
        {reasons.map((r) => (
          <div
            key={r.title}
            className="rounded-2xl border border-border bg-card/40 px-6 py-7"
          >
            <h3 className="mb-2 flex items-center gap-2.5 text-base font-bold text-foreground">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              {r.title}
            </h3>
            <p className="pl-4 text-sm text-muted-foreground">{r.description}</p>
          </div>
        ))}
      </div>
    </SectionShell>
  );
};

export default WhyNova;
