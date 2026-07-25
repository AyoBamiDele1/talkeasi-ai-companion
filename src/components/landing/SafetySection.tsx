const SafetySection = () => {
  return (
    <section className="border-t border-border py-20 md:py-24">
      <div className="mx-auto max-w-4xl px-6">
        <div className="mx-auto max-w-3xl rounded-3xl border border-border bg-card/60 p-8 md:p-12">
          <div className="text-center">
            <div className="mb-3.5 font-mono text-[12.5px] uppercase tracking-[0.1em] text-accent">
              Private &amp; safe
            </div>
            <h2 className="font-serif text-[clamp(26px,3.2vw,36px)] font-medium leading-[1.15] tracking-[-0.01em] text-foreground">
              A space you can trust with what's on your mind
            </h2>
          </div>
          <div className="mt-9 grid grid-cols-1 gap-8 md:grid-cols-2">
            <div>
              <h3 className="mb-2 text-[15.5px] font-bold text-foreground">
                Your conversations stay private
              </h3>
              <p className="text-[13.5px] text-muted-foreground">
                Talk freely. Your chats with Nova are yours, kept private and family-friendly.
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-[15.5px] font-bold text-foreground">
                Caring, with clear limits
              </h3>
              <p className="text-[13.5px] text-muted-foreground">
                Nova offers everyday support and gently points you to professionals for medical, legal, or financial matters.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SafetySection;
