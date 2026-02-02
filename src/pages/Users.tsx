import { useState, useEffect } from "react";
import { Shield, ShieldCheck, User, MoreVertical, Search, UserPlus, Loader2 } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type AppRole = "admin" | "editor" | "avaliador";

interface UserWithRole {
  id: string;
  user_id: string;
  full_name: string | null;
  department: string | null;
  created_at: string;
  email?: string;
  role: AppRole;
}

const roleConfig = {
  admin: {
    label: "Administrador",
    icon: ShieldCheck,
    className: "bg-primary text-primary-foreground",
  },
  editor: {
    label: "Editor",
    icon: Shield,
    className: "bg-accent text-accent-foreground",
  },
  avaliador: {
    label: "Avaliador",
    icon: User,
    className: "bg-secondary text-secondary-foreground",
  },
};

export default function Users() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [newRole, setNewRole] = useState<AppRole | "">("");
  const [isUpdating, setIsUpdating] = useState(false);
  const { isAdmin, user: currentUser } = useAuth();
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      setIsLoading(true);

      // Fetch profiles with their roles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      // Combine profiles with roles
      const usersWithRoles: UserWithRole[] = (profiles || []).map((profile) => {
        const userRole = roles?.find((r) => r.user_id === profile.user_id);
        return {
          ...profile,
          role: (userRole?.role as AppRole) || "avaliador",
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Erro ao carregar utilizadores",
        description: "Não foi possível carregar a lista de utilizadores.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async () => {
    if (!selectedUser || !newRole) return;

    setIsUpdating(true);

    try {
      const { data, error } = await supabase.functions.invoke("update-user-role", {
        body: { userId: selectedUser.user_id, newRole },
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || "Failed to update role");
      }

      toast({
        title: "Perfil actualizado",
        description: `O perfil de ${selectedUser.full_name || "utilizador"} foi alterado para ${roleConfig[newRole].label}.`,
      });

      // Refresh users list
      await fetchUsers();
      setSelectedUser(null);
      setNewRole("");
    } catch (error: any) {
      console.error("Error updating role:", error);
      toast({
        title: "Erro ao actualizar perfil",
        description: error.message || "Não foi possível actualizar o perfil do utilizador.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredUsers = users.filter((user) =>
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.department?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (!isAdmin) {
    return (
      <MainLayout title="Gestão de Utilizadores">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Shield className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Acesso Restrito</h2>
          <p className="text-muted-foreground">
            Apenas administradores podem aceder a esta página.
          </p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      title="Gestão de Utilizadores"
      subtitle="Gerir utilizadores e atribuir perfis"
    >
      <div className="space-y-6 animate-fade-in">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por nome ou departamento..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Button disabled>
            <UserPlus className="mr-2 h-4 w-4" />
            Convidar Utilizador
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          {Object.entries(roleConfig).map(([role, config]) => {
            const count = users.filter((u) => u.role === role).length;
            const Icon = config.icon;
            return (
              <div key={role} className="academic-card p-4 flex items-center gap-4">
                <div className={cn("p-3 rounded-lg", config.className)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-display">{count}</p>
                  <p className="text-sm text-muted-foreground">{config.label}es</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Users Table */}
        <div className="academic-card overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Utilizador</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Data de Registo</TableHead>
                  <TableHead className="text-center">Perfil</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  const roleInfo = roleConfig[user.role];
                  const RoleIcon = roleInfo.icon;
                  const isCurrentUser = user.user_id === currentUser?.id;

                  return (
                    <TableRow key={user.id} className="group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary font-medium">
                              {getInitials(user.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-foreground">
                              {user.full_name || "Sem nome"}
                              {isCurrentUser && (
                                <span className="ml-2 text-xs text-muted-foreground">(você)</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.department || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString("pt-PT")}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={cn("font-medium", roleInfo.className)}>
                          <RoleIcon className="mr-1 h-3 w-3" />
                          {roleInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acções</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user);
                                setNewRole(user.role);
                              }}
                              disabled={isCurrentUser}
                            >
                              Alterar perfil
                            </DropdownMenuItem>
                            <DropdownMenuItem>Ver actividade</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <User className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                      <p className="text-lg font-medium text-muted-foreground">
                        Nenhum utilizador encontrado
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Change Role Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Perfil do Utilizador</DialogTitle>
            <DialogDescription>
              Selecione o novo perfil para{" "}
              <strong>{selectedUser?.full_name || "este utilizador"}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um perfil" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    Administrador
                  </div>
                </SelectItem>
                <SelectItem value="editor">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Editor
                  </div>
                </SelectItem>
                <SelectItem value="avaliador">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Avaliador
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedUser(null)}>
              Cancelar
            </Button>
            <Button onClick={handleRoleChange} disabled={isUpdating || !newRole}>
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  A actualizar...
                </>
              ) : (
                "Guardar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
