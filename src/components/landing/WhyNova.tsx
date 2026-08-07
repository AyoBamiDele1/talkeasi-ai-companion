import { Mic, HeartHandshake, Sparkles } from "lucide-react";
import SectionShell from "./SectionShell";

const reasons = [
  {
    icon: Mic,
    title: "Always available",
    description: "No appointments, no waiting rooms. Nova is ready whenever you are.",
  },
  {
    icon: HeartHandshake,
    title: "Judgment-free",
    description: "Speak openly. Nova meets you with warmth and never judges.",
  },
  {
    icon: Sparkles,
    title: "Remembers you",
    description: "Nova recalls what matters to you, so every talk picks up naturally.",
  },
];

const WhyNova = () => {
  return (
    <SectionShell
      id="features"
      tinted
      eyebrow="Why people talk to Nova"
      heading={
        <>
          Built to feel less like software,
          <br />
          <span className="text-primary">more like a friend</span>
        </>
      }
    >
      <div className="mx-auto grid max-w-4xl grid-cols-1 md:grid-cols-3 md:divide-x md:divide-border">
        {reasons.map((r) => (
          <div key={r.title} className="px-6 py-8 text-center md:py-2">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary/15">
              <r.icon className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 text-[16.5px] font-bold text-foreground">
              {r.title}
            </h3>
            <p className="mx-auto max-w-[230px] text-[13.5px] text-muted-foreground">
              {r.description}
            </p>
          </div>
        ))}
      </div>
    </SectionShell>
  );
};

export default WhyNova;
