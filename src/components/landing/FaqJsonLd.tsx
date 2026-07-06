import { useEffect } from "react";

interface FaqItem {
  question: string;
  answer: string;
}

/**
 * Injects FAQPage JSON-LD structured data into <head> for the landing page.
 * Client-side injected — fine for JS-executing crawlers like Googlebot.
 */
const FaqJsonLd = ({ faqs }: { faqs: FaqItem[] }) => {
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "faq-jsonld";
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: f.answer,
        },
      })),
    });

    document.getElementById("faq-jsonld")?.remove();
    document.head.appendChild(script);

    return () => {
      document.getElementById("faq-jsonld")?.remove();
    };
  }, [faqs]);

  return null;
};

export default FaqJsonLd;
