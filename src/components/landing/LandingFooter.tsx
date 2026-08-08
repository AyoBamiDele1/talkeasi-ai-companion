import { Link } from "react-router-dom";
import LandingLogo from "./LandingLogo";

const LandingFooter = () => {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-6 px-6 py-9 md:grid-cols-3">
        <div className="flex justify-center md:justify-start">
          <LandingLogo size="sm" />
        </div>
        <nav className="flex flex-wrap justify-center gap-6 text-[13.5px] text-muted-foreground">
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#how-it-works" className="hover:text-foreground">How it works</a>
          <a href="#faq" className="hover:text-foreground">FAQ</a>
        </nav>
        <nav className="flex flex-wrap justify-center gap-6 text-[13.5px] text-muted-foreground md:justify-end">
          <Link to="/trial" className="hover:text-foreground">Try free</Link>
          <Link to="/auth" className="hover:text-foreground">Sign in</Link>
          <Link to="/auth?mode=signup" className="hover:text-foreground">Create account</Link>
        </nav>
      </div>
      <div className="px-6 pb-9 text-center font-mono text-[12.5px] text-muted-foreground">
        © {new Date().getFullYear()} TalkEasi. All rights reserved.
      </div>
    </footer>
  );
};

export default LandingFooter;
