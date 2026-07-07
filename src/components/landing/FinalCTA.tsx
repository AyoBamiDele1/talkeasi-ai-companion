import { Button } from "@/components/ui/button";
import { Mic } from "lucide-react";

interface FinalCTAProps {
  onStartTrial: () => void;
}

const FinalCTA = ({ onStartTrial }: FinalCTAProps) => {
  return (
    <section className="mx-auto max-w-4xl px-6 py-16 md:py-24">
      <div className="relative overflow-hidden rounded-3xl border border-border p-10 text-center md:p-16">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-background" />
        <div className="relative">
          <p className="mb-2 text-sm font-medium text-primary">
            Start free · 1 credit = 1 minute
          </p>
          <h2 className="text-3xl font-bold text-foreground md:text-4xl">
            Your first talk is on us
          </h2>
          <p className="mx-auto mt-4 max-w-md text-muted-foreground">
            Nova is ready to listen. Try a 2-minute talk right now — no sign-up
            required.
          </p>
          <div className="mt-8 flex justify-center">
            <Button
              onClick={onStartTrial}
              size="lg"
              className="text-base"
            >
              <Mic className="mr-2 h-5 w-5" />
              Start 2-Minute Free Talk
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
