import { ChevronRight } from "lucide-react";
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
    <SectionShell id="faq" rule tinted eyebrow="Questions" heading="Frequently asked questions">
      <div className="mx-auto max-w-2xl space-y-3">
        {faqs.map((faq, i) => (
          <details
            key={i}
            className="group rounded-xl border border-border bg-card/40 px-5 py-4"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-semibold text-foreground [&::-webkit-details-marker]:hidden">
              {faq.question}
              <ChevronRight className="h-4 w-4 shrink-0 text-accent transition-transform group-open:rotate-90" />
            </summary>
            <p className="mt-3 text-[14px] text-muted-foreground">
              {faq.answer}
            </p>
          </details>
        ))}
      </div>
    </SectionShell>
  );
};

export default FAQ;
