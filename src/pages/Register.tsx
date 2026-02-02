import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { BookOpen, Loader2, Mail, Lock, Eye, EyeOff, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signUp, user, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setIsSubmitting(true);

    try {
      await signUp(email, password, fullName);
      navigate("/login");
    } catch {
      // Error handled in signUp
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 stat-gradient items-center justify-center p-12">
        <div className="max-w-md text-center text-primary-foreground">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20">
            <BookOpen className="h-10 w-10" />
          </div>
          <h1 className="mb-4 font-display text-4xl font-bold">
            Revista Académica
          </h1>
          <p className="mb-2 text-xl font-medium opacity-90">
            Universidade Mandume
          </p>
          <p className="text-primary-foreground/70">
            Sistema de Detecção de Plágio com Inteligência Artificial
          </p>
        </div>
      </div>

      {/* Right side - Register Form */}
      <div className="flex w-full items-center justify-center p-8 lg:w-1/2">
        <Card className="w-full max-w-md border-0 shadow-academic-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary lg:hidden">
              <BookOpen className="h-6 w-6 text-primary-foreground" />
            </div>
            <CardTitle className="font-display text-2xl">Criar Conta</CardTitle>
            <CardDescription>
              Registe-se para aceder à plataforma de detecção de plágio
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="fullName">Nome Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="O seu nome completo"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-9"
                    required
                    autoComplete="name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Institucional</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu.email@universidade.ao"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-10"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-9"
                    required
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Novos utilizadores são registados como <strong>Avaliador</strong>. 
                O administrador pode alterar o seu perfil posteriormente.
              </p>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    A criar conta...
                  </>
                ) : (
                  "Criar Conta"
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Já tem uma conta?{" "}
                <Link to="/login" className="font-medium text-primary hover:underline">
                  Iniciar sessão
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
