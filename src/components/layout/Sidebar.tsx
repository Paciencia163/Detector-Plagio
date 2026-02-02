import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Upload,
  FileSearch,
  History,
  Users,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Upload, label: "Nova Análise", path: "/upload" },
  { icon: FileSearch, label: "Relatórios", path: "/reports" },
  { icon: History, label: "Histórico", path: "/history" },
];

const adminItems = [
  { icon: Users, label: "Utilizadores", path: "/users" },
  { icon: Settings, label: "Configurações", path: "/settings" },
];

const bottomItems = [
  { icon: HelpCircle, label: "Ajuda", path: "/help" },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const NavItem = ({
    icon: Icon,
    label,
    path,
  }: {
    icon: typeof LayoutDashboard;
    label: string;
    path: string;
  }) => {
    const isActive = location.pathname === path;

    const content = (
      <Link
        to={path}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
          "hover:bg-sidebar-accent",
          isActive && "bg-sidebar-accent text-sidebar-primary"
        )}
      >
        <Icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-sidebar-primary")} />
        {!collapsed && (
          <span className={cn("font-medium transition-opacity", isActive && "text-sidebar-primary")}>
            {label}
          </span>
        )}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-sidebar-primary">
          <BookOpen className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="flex flex-col min-w-0">
            <span className="font-display font-semibold text-sm truncate">
              Revista Académica
            </span>
            <span className="text-xs text-sidebar-foreground/70 truncate">
              Universidade Mandume
            </span>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="space-y-1">
          {menuItems.map((item) => (
            <NavItem key={item.path} {...item} />
          ))}
        </div>

        {/* Admin Section - Only visible to admins */}
        {isAdmin && (
          <div className="pt-4 mt-4 border-t border-sidebar-border">
            {!collapsed && (
              <span className="px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
                Administração
              </span>
            )}
            <div className="mt-2 space-y-1">
              {adminItems.map((item) => (
                <NavItem key={item.path} {...item} />
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Bottom Section */}
      <div className="p-3 border-t border-sidebar-border space-y-1">
        {bottomItems.map((item) => (
          <NavItem key={item.path} {...item} />
        ))}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full justify-center text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              <span>Recolher</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
