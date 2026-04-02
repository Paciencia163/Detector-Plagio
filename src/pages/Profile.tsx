import { useState, useEffect, useRef } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, User, Camera } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  editor: "Editor",
  avaliador: "Avaliador",
};

export default function Profile() {
  const { user, profile, role } = useAuth();
  const { toast } = useToast();
  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setDepartment(profile.department || "");
      setAvatarUrl(profile.avatar_url || null);
    }
  }, [profile]);

  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Formato inválido", description: "Seleccione uma imagem (JPG, PNG, etc.)", variant: "destructive" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Ficheiro muito grande", description: "O tamanho máximo é 2MB.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    const ext = file.name.split(".").pop();
    const filePath = `${user.id}/avatar.${ext}`;

    // Upload (upsert to replace existing)
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast({ title: "Erro no upload", description: uploadError.message, variant: "destructive" });
      setIsUploading(false);
      return;
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    // Save to profile
    await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("user_id", user.id);

    setAvatarUrl(publicUrl);
    setIsUploading(false);
    toast({ title: "Foto actualizada", description: "A sua foto de perfil foi alterada." });
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim(), department: department.trim() })
      .eq("user_id", user.id);

    setIsSaving(false);

    if (error) {
      toast({ title: "Erro ao guardar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Perfil actualizado", description: "As suas informações foram guardadas com sucesso." });
    }
  };

  return (
    <MainLayout title="Meu Perfil" subtitle="Gerir informações pessoais">
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        {/* Avatar & Role Card */}
        <Card>
          <CardContent className="flex flex-col sm:flex-row items-center gap-6 pt-6">
            <div className="relative group">
              <Avatar className="h-24 w-24">
                <AvatarImage src={avatarUrl || undefined} alt="Foto de perfil" />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                  {getInitials(fullName)}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                {isUploading ? (
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                ) : (
                  <Camera className="h-6 w-6 text-white" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>
            <div className="text-center sm:text-left space-y-1">
              <h2 className="text-xl font-display font-semibold">{fullName || "Utilizador"}</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              {role && (
                <Badge variant="secondary" className="mt-1">
                  {roleLabels[role] || role}
                </Badge>
              )}
              <p className="text-xs text-muted-foreground mt-2">Passe o rato sobre a foto para alterar</p>
            </div>
          </CardContent>
        </Card>

        {/* Edit Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações Pessoais
            </CardTitle>
            <CardDescription>Actualize o seu nome e departamento</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome Completo</Label>
              <Input
                id="fullName"
                placeholder="Insira o seu nome completo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Departamento</Label>
              <Input
                id="department"
                placeholder="Ex: Ciências da Educação"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email || ""} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">O email não pode ser alterado.</p>
            </div>
            <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Guardar Alterações
            </Button>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
