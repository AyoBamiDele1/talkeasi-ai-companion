import { Clock, ShieldCheck, Brain, Sparkles } from "lucide-react";

const reasons = [
  {
    icon: Clock,
    title: "Always available",
    description: "No appointments, no waiting rooms. Nova is ready whenever you are.",
  },
  {
    icon: ShieldCheck,
    title: "Judgment-free",
    description: "Speak openly. Nova meets you with warmth and never judges.",
  },
  {
    icon: Brain,
    title: "Remembers you",
    description: "Nova recalls what matters to you, so every talk picks up naturally.",
  },
  {
    icon: Sparkles,
    title: "A warm friend",
    description: "Not a clinical bot — a caring companion who genuinely listens.",
  },
];

const WhyNova = () => {
  return (
    <section className="relative overflow-hidden py-16 md:py-24">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      <div className="relative mx-auto max-w-5xl px-6">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-foreground md:text-4xl">
            Why people talk to Nova
          </h2>
          <p className="mt-3 text-muted-foreground">
            Built to feel less like software and more like a friend.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {reasons.map((reason) => (
            <div key={reason.title} className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15">
                <reason.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="mb-1 text-lg font-semibold text-foreground">
                  {reason.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {reason.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyNova;
