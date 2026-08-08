import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionShellProps {
  id?: string;
  eyebrow?: string;
  heading: ReactNode;
  children: ReactNode;
  className?: string;
  maxWidth?: string;
  /** Subtle background tint band */
  tinted?: boolean;
  /** Short coral underline rule beneath the heading */
  rule?: boolean;
}

const SectionShell = ({
  id,
  eyebrow,
  heading,
  children,
  className,
  maxWidth = "max-w-6xl",
  tinted = false,
  rule = false,
}: SectionShellProps) => {
  return (
    <section
      id={id}
      className={cn(
        "border-t border-[hsl(var(--section-divider))] px-6 py-16 md:py-24",
        tinted ? "bg-[hsl(var(--section-alt))]" : "bg-[hsl(var(--section-base))]",
        className
      )}
    >
      <div className={cn("mx-auto", maxWidth)}>
        <div className="mx-auto mb-14 max-w-2xl text-center md:mb-16">
          {eyebrow && (
            <div className="mb-3.5 font-mono text-[13px] uppercase tracking-[0.12em] text-accent">
              {eyebrow}
            </div>
          )}
          <h2 className="font-serif text-[clamp(27px,3.4vw,38px)] font-medium leading-[1.15] tracking-[-0.01em] text-foreground">
            {heading}
          </h2>
          {rule && (
            <span className="mx-auto mt-5 block h-[2px] w-16 rounded-full bg-primary" />
          )}
        </div>
        {children}
      </div>
    </section>
  );
};

export default SectionShell;
