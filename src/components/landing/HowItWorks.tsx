import SectionShell from "./SectionShell";

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
    <SectionShell
      eyebrow="How it works"
      heading="A real conversation, in three simple steps"
    >
      <div className="mx-auto grid max-w-3xl grid-cols-1 gap-5 md:grid-cols-3">
        {steps.map((s) => (
          <div
            key={s.n}
            className="rounded-2xl border border-border bg-card/40 px-6 py-8 text-center"
          >
            <div className="mx-auto mb-5 flex h-[52px] w-[52px] items-center justify-center rounded-full border border-border bg-card font-serif italic text-[19px] text-accent">
              {s.n}
            </div>
            <h3 className="mb-2 text-[16.5px] font-bold text-foreground">{s.title}</h3>
            <p className="mx-auto max-w-[210px] text-[13.5px] text-muted-foreground">
              {s.description}
            </p>
          </div>
        ))}
      </div>
    </SectionShell>
  );
};

export default HowItWorks;
