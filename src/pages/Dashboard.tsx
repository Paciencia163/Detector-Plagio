import { FileSearch, FileText, TrendingUp, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentAnalyses } from "@/components/dashboard/RecentAnalyses";
import { RiskDistribution } from "@/components/dashboard/RiskDistribution";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  return (
    <MainLayout
      title="Dashboard"
      subtitle="Visão geral do sistema de detecção de plágio"
    >
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
            value={156}
            icon={FileSearch}
            trend={{ value: 12, label: "vs mês anterior" }}
          />
          <StatCard
            title="Documentos Processados"
            value="2.4K"
            icon={FileText}
            subtitle="Total histórico"
          />
          <StatCard
            title="Taxa de Originalidade"
            value="87%"
            icon={TrendingUp}
            variant="primary"
            trend={{ value: 3, label: "vs mês anterior" }}
          />
          <StatCard
            title="Utilizadores Activos"
            value={42}
            icon={Users}
            subtitle="Editores e avaliadores"
          />
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RecentAnalyses />
          </div>
          <div>
            <RiskDistribution />
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
