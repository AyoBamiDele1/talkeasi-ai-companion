import SectionShell from "./SectionShell";

const useCases = [
  { n: "01", title: "Feeling stressed", description: "Talk through a hard day and let some of the pressure out." },
  { n: "02", title: "Feeling lonely", description: "Company whenever you want it — day or night, no waiting." },
  { n: "03", title: "Need advice", description: "Think out loud and get practical, down-to-earth suggestions." },
  { n: "04", title: "Just want to vent", description: "Say what's on your mind freely. Nova won't judge you." },
];

const UseCases = () => {
  return (
    <SectionShell
      eyebrow="What you can talk about"
      heading="Whatever's on your mind — Nova is here for it"
    >
      <div className="mx-auto grid max-w-3xl grid-cols-1 gap-5 sm:grid-cols-2">
        {useCases.map((item) => (
          <div
            key={item.n}
            className="rounded-2xl border border-border bg-card/40 px-6 py-7"
          >
            <div className="mb-3 font-mono text-xs text-accent">{item.n}</div>
            <h3 className="mb-1.5 text-[16.5px] font-bold text-foreground">
              {item.title}
            </h3>
            <p className="text-sm text-muted-foreground">{item.description}</p>
          </div>
        ))}
      </div>
    </SectionShell>
  );
};

export default UseCases;
