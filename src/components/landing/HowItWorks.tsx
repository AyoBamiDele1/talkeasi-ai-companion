import personaAsset from "@/assets/nova-persona.png.asset.json";
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
    <SectionShell id="how-it-works" rule tinted eyebrow="How it works" heading="Three taps to feeling heard">
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
                <p className="text-[15px] leading-relaxed text-muted-foreground md:text-[16px]">
                  {s.description}
                </p>
              </div>
            </li>
          ))}
        </ol>

        {/* Persona visual */}
        <div className="relative flex min-h-[240px] items-center justify-center">
          <div
            className="pointer-events-none absolute inset-0"
            style={{ backgroundImage: "var(--gradient-hero-glow)" }}
          />
          <div className="pointer-events-none relative h-48 w-48 md:h-56 md:w-56 animate-float">
            <img
              src={personaAsset.url}
              alt="Friendly Nova companion"
              className="h-full w-full rounded-full object-cover object-[center_25%] shadow-[0_0_40px_hsl(var(--primary)/0.35),0_0_80px_hsl(var(--accent)/0.25)] ring-4 ring-primary/20"
              loading="lazy"
              width={448}
              height={448}
            />
            {/* Soft vignette to fade the hard circular edge into the background */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, transparent 55%, hsl(var(--background)/0.75) 78%, hsl(var(--background)/0.98) 95%)",
              }}
            />
            {/* Subtle inner rim light to keep the circular shape elegant */}
            <div
              className="absolute inset-0 rounded-full ring-1 ring-inset ring-primary/10"
            />
          </div>
        </div>
      </div>
    </SectionShell>
  );
};

export default HowItWorks;
