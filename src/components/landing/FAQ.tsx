import SectionShell from "./SectionShell";

export const faqs = [
  {
    question: "Is it okay to talk to an AI like a friend?",
    answer:
      "Plenty of people do. Nova is here for everyday company and support — not a replacement for the people in your life, but a warm presence when you want to think out loud.",
  },
  {
    question: "Is it really free to start?",
    answer:
      "Yes. Your first talk is free, no sign-up required, so you can hear how Nova sounds before deciding anything.",
  },
  {
    question: "Are my conversations private?",
    answer:
      "Your talks with Nova are yours. They're kept private and are never shared or made public.",
  },
  {
    question: "What can I talk to Nova about?",
    answer:
      "Anything on your mind — a hard day, a decision you're stuck on, or just company while you go about your evening.",
  },
  {
    question: "Do I have to type anything?",
    answer:
      "No. TalkEasi is voice-first — you just speak, and Nova speaks back.",
  },
];

const FAQ = () => {
  return (
    <SectionShell
      id="faq"
      eyebrow="Questions"
      heading="Frequently asked questions"
      maxWidth="max-w-3xl"
    >
      <div className="mx-auto max-w-2xl">
        {faqs.map((faq, i) => (
          <details key={i} className="group border-b border-border px-1 py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15.5px] font-semibold text-foreground [&::-webkit-details-marker]:hidden">
              {faq.question}
              <span className="shrink-0 font-serif text-[22px] text-accent transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3.5 max-w-xl text-[14.5px] text-muted-foreground">
              {faq.answer}
            </p>
          </details>
        ))}
      </div>
    </SectionShell>
  );
};

export default FAQ;
