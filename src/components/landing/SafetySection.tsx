import SectionShell from "./SectionShell";

const SafetySection = () => {
  return (
    <SectionShell
      tinted
      eyebrow="Private & safe"
      heading="A space you can trust with what's on your mind"
      maxWidth="max-w-4xl"
    >
      <div className="mx-auto grid max-w-3xl grid-cols-1 gap-5 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card/40 px-6 py-7">
          <h3 className="mb-2 text-[15.5px] font-bold text-foreground">
            Your conversations stay private
          </h3>
          <p className="text-[15px] leading-relaxed text-muted-foreground md:text-[16px]">
            Talk freely. Your chats with Nova are yours, kept private and family-friendly.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card/40 px-6 py-7">
          <h3 className="mb-2 text-[15.5px] font-bold text-foreground">
            Caring, with clear limits
          </h3>
          <p className="text-[15px] leading-relaxed text-muted-foreground md:text-[16px]">
            Nova offers everyday support and gently points you to professionals for medical, legal, or financial matters.
          </p>
        </div>
      </div>
    </SectionShell>
  );
};

export default SafetySection;
