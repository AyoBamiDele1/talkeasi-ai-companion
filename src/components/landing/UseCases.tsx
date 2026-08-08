import { CloudRain, Moon, Lightbulb, MessageCircleHeart } from "lucide-react";
import SectionShell from "./SectionShell";

const useCases = [
  { icon: CloudRain, title: "Feeling stressed", description: "Talk through a hard day and let some of the pressure out." },
  { icon: Moon, title: "Feeling lonely", description: "Company whenever you want it — day or night, no waiting." },
  { icon: Lightbulb, title: "Need advice", description: "Think out loud and get practical, down-to-earth suggestions." },
  { icon: MessageCircleHeart, title: "Just want to vent", description: "Say what's on your mind freely. Nova won't judge you." },
];

const UseCases = () => {
  return (
    <SectionShell
      eyebrow="When Nova helps"
      heading={
        <>
          Whatever's on your mind —{" "}
          <span className="text-primary">Nova is here for it</span>
        </>
      }
    >
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {useCases.map((item) => (
          <div
            key={item.title}
            className="rounded-2xl border border-border bg-card/40 px-6 py-7 text-center"
          >
            <item.icon className="mx-auto mb-4 h-6 w-6 text-primary" />
            <h3 className="mb-1.5 text-[15.5px] font-bold text-foreground">
              {item.title}
            </h3>
            <p className="text-[13.5px] text-muted-foreground">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </SectionShell>
  );
};

export default UseCases;
