import NovaOrb from "@/components/NovaOrb";

interface LandingLogoProps {
  size?: "sm" | "md";
}

const LandingLogo = ({ size = "md" }: LandingLogoProps) => {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <div className="pointer-events-none">
        <NovaOrb size="xs" isConnected={false} className="cursor-default" />
      </div>
      <span
        className={
          size === "md"
            ? "font-serif text-[21px] font-medium tracking-[-0.01em]"
            : "font-serif text-base font-medium"
        }
      >
        talk<span className="text-primary">easi</span>
      </span>
    </div>
  );
};

export default LandingLogo;
