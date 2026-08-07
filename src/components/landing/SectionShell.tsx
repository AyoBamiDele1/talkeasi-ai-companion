import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionShellProps {
  id?: string;
  eyebrow: string;
  heading: string;
  children: ReactNode;
  className?: string;
  maxWidth?: string;
}

const SectionShell = ({
  id,
  eyebrow,
  heading,
  children,
  className,
  maxWidth = "max-w-5xl",
}: SectionShellProps) => {
  return (
    <section id={id} className="px-6 py-10 md:py-14">
      <div
        className={cn(
          "mx-auto rounded-[28px] border border-border px-6 py-14 md:px-12 md:py-16",
          maxWidth,
          className
        )}
        style={{
          backgroundImage: "var(--gradient-surface)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div className="mx-auto mb-14 max-w-xl text-center md:mb-16">
          <div className="mb-3.5 font-mono text-[14px] uppercase tracking-[0.1em] text-accent">
            {eyebrow}
          </div>
          <h2 className="font-serif text-[clamp(26px,3.2vw,36px)] font-medium leading-[1.15] tracking-[-0.01em] text-foreground">
            {heading}
          </h2>
        </div>
        {children}
      </div>
    </section>
  );
};

export default SectionShell;
