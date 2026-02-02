import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type AppRole = "admin" | "editor" | "avaliador";

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  department: string | null;
  avatar_url: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isEditor: boolean;
  isAvaliador: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchProfile = async (userId: string) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (profileError && profileError.code !== "PGRST116") {
        console.error("Error fetching profile:", profileError);
      } else if (profileData) {
        setProfile(profileData);
      }

      // Fetch user role
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .order("role")
        .limit(1)
        .single();

      if (roleError && roleError.code !== "PGRST116") {
        console.error("Error fetching role:", roleError);
      } else if (roleData) {
        setRole(roleData.role as AppRole);
      }
    } catch (error) {
      console.error("Error in fetchProfile:", error);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          // Defer profile fetch to avoid blocking
          setTimeout(() => {
            fetchProfile(currentSession.user.id);
          }, 0);
        } else {
          setProfile(null);
          setRole(null);
        }

        if (event === "SIGNED_OUT") {
          setProfile(null);
          setRole(null);
        }
      }
    );

    // THEN check initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      
      if (initialSession?.user) {
        fetchProfile(initialSession.user.id);
      }
      
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: "Erro ao iniciar sessão",
        description: error.message === "Invalid login credentials" 
          ? "Credenciais inválidas. Verifique o email e a senha."
          : error.message,
        variant: "destructive",
      });
      throw error;
    }

    toast({
      title: "Sessão iniciada",
      description: "Bem-vindo de volta!",
    });
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      toast({
        title: "Erro ao criar conta",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }

    toast({
      title: "Conta criada com sucesso",
      description: "A sua conta foi criada. Pode agora iniciar sessão.",
    });
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast({
        title: "Erro ao terminar sessão",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }

    toast({
      title: "Sessão terminada",
      description: "Até breve!",
    });
  };

  const value: AuthContextType = {
    user,
    session,
    profile,
    role,
    isLoading,
    signIn,
    signUp,
    signOut,
    isAdmin: role === "admin",
    isEditor: role === "editor",
    isAvaliador: role === "avaliador",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
