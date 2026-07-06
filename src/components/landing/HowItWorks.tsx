import { Mic, Ear, Heart } from "lucide-react";

const steps = [
  {
    icon: Mic,
    title: "Tap to talk",
    description: "Press once and start speaking. No typing, no forms — just your voice.",
  },
  {
    icon: Ear,
    title: "Nova listens",
    description: "Nova hears you out, understands, and responds like a caring friend.",
  },
  {
    icon: Heart,
    title: "Feel lighter",
    description: "Vent, get advice, or just chat. Walk away feeling a little better.",
  },
];

const HowItWorks = () => {
  return (
    <section className="mx-auto max-w-5xl px-6 py-16 md:py-24">
      <div className="mb-12 text-center">
        <h2 className="text-3xl font-bold text-foreground md:text-4xl">
          How it works
        </h2>
        <p className="mt-3 text-muted-foreground">
          A real conversation, in three simple steps.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {steps.map((step, i) => (
          <div
            key={step.title}
            className="relative rounded-2xl border border-border bg-card/40 p-8 text-center backdrop-blur-sm"
          >
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary/15">
              <step.icon className="h-7 w-7 text-primary" />
            </div>
            <div className="mb-2 text-sm font-medium text-primary">
              Step {i + 1}
            </div>
            <h3 className="mb-2 text-xl font-semibold text-foreground">
              {step.title}
            </h3>
            <p className="text-sm text-muted-foreground">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HowItWorks;
