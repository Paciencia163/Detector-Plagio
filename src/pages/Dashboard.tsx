import { useEffect, useState } from "react";
import { FileSearch, FileText, TrendingUp, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentAnalyses } from "@/components/dashboard/RecentAnalyses";
import { RiskDistribution } from "@/components/dashboard/RiskDistribution";
import { MonthlyChart } from "@/components/dashboard/MonthlyChart";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface DashboardStats {
  totalAnalyses: number;
  thisMonthAnalyses: number;
  avgOriginality: number;
  highRiskCount: number;
  riskDistribution: { low: number; medium: number; high: number };
}

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [allAnalyses, setAllAnalyses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      // Fetch all analyses for the user (or all if admin)
      let query = supabase.from("analyses").select("*");
      if (!isAdmin) {
        query = query.eq("user_id", user.id);
      }
      const { data: analyses } = await query;

      if (!analyses) {
        setIsLoading(false);
        return;
      }
      setAllAnalyses(analyses);

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const thisMonth = analyses.filter((a) => a.created_at >= startOfMonth);
      const completed = analyses.filter((a) => a.status === "completed");

      const avgOrig = completed.length > 0
        ? Math.round(completed.reduce((sum, a) => sum + (Number(a.original_percentage) || 0), 0) / completed.length)
        : 0;

      const low = completed.filter((a) => a.risk_level === "low").length;
      const medium = completed.filter((a) => a.risk_level === "medium").length;
      const high = completed.filter((a) => a.risk_level === "high").length;
      const total = low + medium + high || 1;

      setStats({
        totalAnalyses: analyses.length,
        thisMonthAnalyses: thisMonth.length,
        avgOriginality: avgOrig,
        highRiskCount: high,
        riskDistribution: {
          low: Math.round((low / total) * 100),
          medium: Math.round((medium / total) * 100),
          high: Math.round((high / total) * 100),
        },
      });
      setIsLoading(false);
    };

    fetchStats();
  }, [user, isAdmin]);

  if (isLoading) {
    return (
      <MainLayout title="Dashboard">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Dashboard" subtitle="Visão geral do sistema de detecção de plágio">
      <div className="space-y-8 animate-fade-in">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-xl stat-gradient p-6 md:p-8 text-primary-foreground">
          <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-2">
              Bem-vindo à Plataforma de Integridade Académica
            </h2>
            <p className="text-primary-foreground/80 max-w-2xl mb-4">
              Sistema de detecção de plágio com Inteligência Artificial para a Revista Académica
              da Universidade Mandume. Garanta a originalidade e qualidade das publicações científicas.
            </p>
            <Button variant="secondary" size="lg" asChild>
              <Link to="/upload">
                <FileSearch className="mr-2 h-5 w-5" />
                Iniciar Nova Análise
              </Link>
            </Button>
          </div>
          <div className="absolute right-0 top-0 w-1/3 h-full opacity-10">
            <svg viewBox="0 0 200 200" className="w-full h-full">
              <circle cx="150" cy="100" r="80" fill="currentColor" />
              <circle cx="50" cy="150" r="60" fill="currentColor" />
            </svg>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Análises Este Mês"
            value={stats?.thisMonthAnalyses ?? 0}
            icon={FileSearch}
          />
          <StatCard
            title="Total de Análises"
            value={stats?.totalAnalyses ?? 0}
            icon={FileText}
            subtitle="Histórico completo"
          />
          <StatCard
            title="Taxa de Originalidade"
            value={`${stats?.avgOriginality ?? 0}%`}
            icon={TrendingUp}
            variant="primary"
          />
          <StatCard
            title="Alto Risco"
            value={stats?.highRiskCount ?? 0}
            icon={AlertTriangle}
            subtitle="Documentos com alto risco"
          />
        </div>

        {/* Monthly Chart */}
        <MonthlyChart analyses={allAnalyses} />

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RecentAnalyses />
          </div>
          <div>
            <RiskDistribution distribution={stats?.riskDistribution} />
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center py-4 text-sm text-muted-foreground">
          <p>
            Este sistema é uma <strong>ferramenta de apoio</strong> à avaliação de originalidade.
            A decisão final cabe aos editores e avaliadores da revista.
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
