import { Card, CardContent } from "@/components/ui/card";
import { Wind, Moon, MessageCircle, Megaphone } from "lucide-react";

const useCases = [
  {
    icon: Wind,
    title: "Feeling stressed",
    description: "Talk through a hard day and let some of the pressure out.",
  },
  {
    icon: Moon,
    title: "Feeling lonely",
    description: "Company whenever you want it — day or night, no waiting.",
  },
  {
    icon: MessageCircle,
    title: "Need advice",
    description: "Think out loud and get practical, down-to-earth suggestions.",
  },
  {
    icon: Megaphone,
    title: "Just want to vent",
    description: "Say what's on your mind freely. Nova won't judge you.",
  },
];

const UseCases = () => {
  return (
    <section className="mx-auto max-w-5xl px-6 py-16 md:py-24">
      <div className="mb-12 text-center">
        <h2 className="text-3xl font-bold text-foreground md:text-4xl">
          What you can talk about
        </h2>
        <p className="mt-3 text-muted-foreground">
          Whatever's on your mind — Nova is here for it.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {useCases.map((item) => (
          <Card
            key={item.title}
            className="border-border bg-card/40 backdrop-blur-sm transition-all hover:scale-[1.01]"
          >
            <CardContent className="flex items-start gap-4 p-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15">
                <item.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="mb-1 text-lg font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default UseCases;
