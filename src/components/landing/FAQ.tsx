import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const faqs = [
  {
    question: "Is it okay to talk to an AI like a friend?",
    answer:
      "Absolutely. Many people find it comforting to have someone to talk to who's always available and never judges. Nova is here to listen, keep you company, and help you feel heard.",
  },
  {
    question: "Is it really free to start?",
    answer:
      "Yes. You can start a 2-minute talk with Nova right away — no account or payment needed. After that, you can create a free account to keep talking, with more free minutes to begin.",
  },
  {
    question: "Are my conversations private?",
    answer:
      "Your conversations are private and family-friendly. Talk about whatever's on your mind, and Nova keeps it between the two of you.",
  },
  {
    question: "What can I talk to Nova about?",
    answer:
      "Anything on your mind — stress, loneliness, everyday decisions, or just venting. Nova gives practical, everyday support, and gently suggests a professional for medical, legal, or financial questions.",
  },
  {
    question: "Do I have to type anything?",
    answer:
      "No. TalkEasi is voice-first — you simply talk out loud and Nova responds. It feels like a real conversation, not texting a chatbot.",
  },
];

const FAQ = () => {
  return (
    <section className="mx-auto max-w-3xl px-6 py-16 md:py-24">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-bold text-foreground md:text-4xl">
          Frequently asked questions
        </h2>
      </div>

      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq, i) => (
          <AccordionItem key={i} value={`item-${i}`}>
            <AccordionTrigger className="text-left text-base font-medium">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
};

export default FAQ;
