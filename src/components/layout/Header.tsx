import { ReactNode } from "react";
import { Bell, Search, LogOut, User, Settings, CheckCheck, Trash2, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/use-notifications";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  children?: ReactNode;
}

const roleLabels = {
  admin: "Administrador",
  editor: "Editor",
  avaliador: "Avaliador",
};

export function Header({ title, subtitle, children }: HeaderProps) {
  const { profile, role, signOut } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
  const navigate = useNavigate();

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between h-14 md:h-16 px-4 md:px-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
      <div className="flex items-center min-w-0">
        {children}
        <div className="flex flex-col min-w-0">
          {title && <h1 className="text-base md:text-xl font-display font-semibold text-foreground truncate">{title}</h1>}
          {subtitle && <p className="text-xs md:text-sm text-muted-foreground truncate hidden sm:block">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
        {/* Search - hidden on mobile */}
        <div className="relative hidden lg:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar análises..."
            className="w-64 pl-9 bg-secondary/50 border-0 focus-visible:ring-1"
          />
        </div>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-9 w-9">
              <Bell className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-4 w-4 md:h-5 md:w-5 flex items-center justify-center p-0 text-[10px] md:text-xs">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notificações</span>
              {notifications.length > 0 && (
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={markAllAsRead}>
                    <CheckCheck className="h-3 w-3 mr-1" />
                    Lidas
                  </Button>
                  <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={clearAll}>
                    <Trash2 className="h-3 w-3 mr-1" />
                    Limpar
                  </Button>
                </div>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <ScrollArea className="max-h-72">
              {notifications.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Sem notificações
                </div>
              ) : (
                notifications.map((notif) => (
                  <DropdownMenuItem
                    key={notif.id}
                    className={`flex items-start gap-3 p-3 cursor-pointer ${!notif.read ? "bg-accent/50" : ""}`}
                    onClick={() => {
                      markAsRead(notif.id);
                      navigate(`/report/${notif.analysisId}`);
                    }}
                  >
                    {notif.type === "success" ? (
                      <FileText className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-sm font-medium truncate">{notif.title}</span>
                      <span className="text-xs text-muted-foreground line-clamp-2">{notif.message}</span>
                      <span className="text-[10px] text-muted-foreground/70">
                        {formatDistanceToNow(notif.createdAt, { addSuffix: true, locale: pt })}
                      </span>
                    </div>
                    {!notif.read && (
                      <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                    )}
                  </DropdownMenuItem>
                ))
              )}
            </ScrollArea>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 pl-1 pr-2 md:pl-2 md:pr-3 h-9 md:h-10">
              <Avatar className="h-7 w-7 md:h-8 md:w-8">
                <AvatarImage src={profile?.avatar_url || undefined} alt="Avatar" />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs md:text-sm font-medium">
                  {getInitials(profile?.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-medium">
                  {profile?.full_name || "Utilizador"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {role ? roleLabels[role] : ""}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/profile")}>
              <User className="mr-2 h-4 w-4" />
              Perfil
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Configurações
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Terminar Sessão
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
