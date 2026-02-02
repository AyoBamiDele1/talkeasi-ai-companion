import { useLocation, useNavigate } from "react-router-dom";
import { Home, BookOpen, TrendingUp, User, Gift } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { FEATURES } from "@/config/features";

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Only show navigation for authenticated users
  if (!user) return null;

  const allNavItems = [
    { icon: Home, label: "Home", path: "/home" },
    { icon: BookOpen, label: "Lessons", path: "/lessons" },
    { icon: Gift, label: "Gift", path: "/gifts" },
    { icon: TrendingUp, label: "Progress", path: "/progress" },
    { icon: User, label: "Profile", path: "/profile" }
  ];

  // Filter out Lessons if feature is disabled
  const navItems = allNavItems.filter(item => 
    item.path !== '/lessons' || FEATURES.ENGLISH_LESSONS_ENABLED
  );

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-40">
      <div className={`grid ${navItems.length === 3 ? 'grid-cols-3' : navItems.length === 4 ? 'grid-cols-4' : 'grid-cols-5'} max-w-md mx-auto`}>
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