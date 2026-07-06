import { Lock, HeartHandshake } from "lucide-react";

const SafetySection = () => {
  return (
    <section className="mx-auto max-w-4xl px-6 py-16 md:py-24">
      <div className="rounded-3xl border border-border bg-card/40 p-8 backdrop-blur-sm md:p-12">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-foreground md:text-4xl">
            Private & safe
          </h2>
          <p className="mt-3 text-muted-foreground">
            A space you can trust with what's on your mind.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="mb-1 text-lg font-semibold text-foreground">
                Your conversations stay private
              </h3>
              <p className="text-sm text-muted-foreground">
                Talk freely. Your chats with Nova are yours, kept private and
                family-friendly.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15">
              <HeartHandshake className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="mb-1 text-lg font-semibold text-foreground">
                Caring, with clear limits
              </h3>
              <p className="text-sm text-muted-foreground">
                Nova offers everyday support and gently points you to
                professionals for medical, legal, or financial matters.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SafetySection;
