import { Link } from "react-router-dom";

const LandingFooter = () => {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-6 py-10 text-center md:flex-row md:justify-between md:text-left">
        <div>
          <div className="text-lg font-bold text-foreground">TalkEasi</div>
          <p className="text-sm text-muted-foreground">
            Meet Nova ✦ your AI friend
          </p>
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
          <Link to="/trial" className="text-muted-foreground hover:text-foreground">
            Try free
          </Link>
          <Link to="/auth" className="text-muted-foreground hover:text-foreground">
            Sign in
          </Link>
          <Link
            to="/auth?mode=signup"
            className="text-muted-foreground hover:text-foreground"
          >
            Create account
          </Link>
        </nav>
      </div>
      <div className="border-t border-border px-6 py-4 text-center text-xs text-muted-foreground/70">
        © {new Date().getFullYear()} TalkEasi. All rights reserved.
      </div>
    </footer>
  );
};

export default LandingFooter;
