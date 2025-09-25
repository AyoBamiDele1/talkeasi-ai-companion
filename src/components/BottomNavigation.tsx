import { useLocation, useNavigate } from "react-router-dom";
import { Home, BookOpen, TrendingUp, User } from "lucide-react";
import { cn } from "@/lib/utils";

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: BookOpen, label: "Lessons", path: "/lessons" },
    { icon: TrendingUp, label: "Progress", path: "/progress" },
    { icon: User, label: "Profile", path: "/profile" }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-40">
      <div className="grid grid-cols-4 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center py-3 px-2 transition-colors",
                "hover:bg-muted/50",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5 mb-1", isActive && "text-primary")} />
              <span className={cn("text-xs font-medium", isActive && "text-primary")}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;