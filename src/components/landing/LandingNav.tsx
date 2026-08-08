import LandingLogo from "./LandingLogo";

interface LandingNavProps {
  onStartTrial: () => void;
  onSignIn: () => void;
}

const links = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "FAQ", href: "#faq" },
];

const LandingNav = ({ onStartTrial, onSignIn }: LandingNavProps) => {
  return (
    <nav className="z-20 bg-background/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-5">
        <LandingLogo />
        <div className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="hover:text-foreground">
              {l.label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-5 text-sm">
          <button
            onClick={onSignIn}
            className="hidden text-muted-foreground hover:text-foreground sm:block"
          >
            Sign in
          </button>
          <button
            onClick={onStartTrial}
            className="rounded-full bg-primary px-5 py-2.5 font-bold text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_20px_hsl(var(--primary)/0.35)]"
          >
            Start free talk
          </button>
        </div>
      </div>
    </nav>
  );
};

export default LandingNav;
