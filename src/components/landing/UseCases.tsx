const useCases = [
  { n: "01", title: "Feeling stressed", description: "Talk through a hard day and let some of the pressure out." },
  { n: "02", title: "Feeling lonely", description: "Company whenever you want it — day or night, no waiting." },
  { n: "03", title: "Need advice", description: "Think out loud and get practical, down-to-earth suggestions." },
  { n: "04", title: "Just want to vent", description: "Say what's on your mind freely. Nova won't judge you." },
];

const UseCases = () => {
  return (
    <section className="border-t border-border py-20 md:py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mx-auto mb-16 max-w-xl text-center md:mb-20">
          <div className="mb-3.5 font-mono text-[14px] uppercase tracking-[0.1em] text-accent">
            What you can talk about
          </div>
          <h2 className="font-serif text-[clamp(26px,3.2vw,36px)] font-medium leading-[1.15] tracking-[-0.01em] text-foreground">
            Whatever's on your mind — Nova is here for it
          </h2>
        </div>

        <div className="mx-auto max-w-3xl border-t border-border">
          {useCases.map((item) => (
            <div
              key={item.n}
              className="flex items-start gap-5 border-b border-border px-1 py-6"
            >
              <div className="w-11 shrink-0 pt-1 font-mono text-xs text-accent">
                {item.n}
              </div>
              <div>
                <h3 className="mb-1.5 text-[16.5px] font-bold text-foreground">
                  {item.title}
                </h3>
                <p className="max-w-md text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UseCases;
