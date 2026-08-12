import { CloudRain, Moon, Lightbulb, Mic } from "lucide-react";
import SectionShell from "./SectionShell";

const useCases = [
  { icon: CloudRain, title: "Just want to vent", description: "Talk through any situation and say what's on your mind freely. Nova won't judge you." },
  { icon: Lightbulb, title: "Need advice", description: "Think out loud and get practical, down-to-earth suggestions." },
  { icon: Moon, title: "Someone to talk to", description: "Company whenever you want it — day or night, no waiting." },
  { icon: Mic, title: "Building confidence", description: "Practice real conversations — big talks or hard topics. Nova helps you get comfortable speaking up." },
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
            <p className="text-[14px] leading-relaxed text-muted-foreground md:text-[15px]">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </SectionShell>
  );
};

export default UseCases;
