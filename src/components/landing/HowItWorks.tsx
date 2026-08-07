import personaAsset from "@/assets/nova-persona.jpg.asset.json";
import SectionShell from "./SectionShell";

const steps = [
  {
    n: "1",
    title: "Tap to talk",
    description: "Press once and start speaking. No typing, no forms — just your voice.",
  },
  {
    n: "2",
    title: "Nova listens",
    description: "Nova hears you out, understands, and responds like a caring friend.",
  },
  {
    n: "3",
    title: "Feel lighter",
    description: "Vent, get advice, or just chat. Walk away feeling a little better.",
  },
];

const HowItWorks = () => {
  return (
    <SectionShell id="how-it-works" rule heading="How it works">
      <div className="mx-auto grid max-w-5xl items-center gap-14 md:grid-cols-2">
        {/* Timeline */}
        <ol className="relative mx-auto w-full max-w-md">
          <span className="absolute left-[15px] top-4 bottom-8 w-px bg-border" />
          {steps.map((s) => (
            <li key={s.n} className="relative flex gap-5 pb-10 last:pb-0">
              <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-[13px] font-bold text-primary-foreground">
                {s.n}
              </span>
              <div>
                <h3 className="mb-1.5 text-[16.5px] font-bold text-foreground">
                  {s.title}
                </h3>
                <p className="text-[13.5px] text-muted-foreground">
                  {s.description}
                </p>
              </div>
            </li>
          ))}
        </ol>

        {/* Orb aura visual */}
        <div className="relative flex min-h-[240px] items-center justify-center">
          <div
            className="pointer-events-none absolute inset-0"
            style={{ backgroundImage: "var(--gradient-hero-glow)" }}
          />
          <div className="pointer-events-none relative">
            <NovaOrb size="lg" isActive isConnected={false} className="cursor-default" />
          </div>
        </div>
      </div>
    </SectionShell>
  );
};

export default HowItWorks;
