import { FileText, MoreVertical, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface Analysis {
  id: string;
  title: string;
  author: string;
  date: string;
  similarity: number;
  risk: "low" | "medium" | "high";
  status: "completed" | "processing" | "pending";
}

const mockAnalyses: Analysis[] = [
  {
    id: "1",
    title: "Impacto da Agricultura Sustentável na Região Sul de Angola",
    author: "Maria Santos",
    date: "2025-01-28",
    similarity: 12,
    risk: "low",
    status: "completed",
  },
  {
    id: "2",
    title: "Análise Económica do Sector Petrolífero Angolano",
    author: "Pedro Nunes",
    date: "2025-01-28",
    similarity: 45,
    risk: "high",
    status: "completed",
  },
  {
    id: "3",
    title: "Desenvolvimento Urbano e Mobilidade em Luanda",
    author: "Ana Ferreira",
    date: "2025-01-27",
    similarity: 28,
    risk: "medium",
    status: "completed",
  },
  {
    id: "4",
    title: "A Influência da Cultura Tradicional na Educação Moderna",
    author: "Carlos Domingos",
    date: "2025-01-27",
    similarity: 8,
    risk: "low",
    status: "completed",
  },
  {
    id: "5",
    title: "Estudo sobre Biodiversidade no Parque Nacional da Kissama",
    author: "Teresa Lourenço",
    date: "2025-01-26",
    similarity: 0,
    risk: "low",
    status: "processing",
  },
];

const riskConfig = {
  low: { label: "Baixo", className: "risk-low" },
  medium: { label: "Médio", className: "risk-medium" },
  high: { label: "Alto", className: "risk-high" },
};

const statusConfig = {
  completed: { label: "Concluído", className: "bg-risk-low/10 text-risk-low border-risk-low/20" },
  processing: { label: "A processar", className: "bg-accent/10 text-accent border-accent/20 animate-pulse-soft" },
  pending: { label: "Pendente", className: "bg-muted text-muted-foreground border-border" },
};

export function RecentAnalyses() {
  return (
    <div className="academic-card">
      <div className="flex items-center justify-between p-6 border-b border-border">
        <div>
          <h2 className="text-lg font-display font-semibold">Análises Recentes</h2>
          <p className="text-sm text-muted-foreground">Últimas verificações de plágio</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/history">
            Ver todas
            <ExternalLink className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="divide-y divide-border">
        {mockAnalyses.map((analysis) => (
          <div
            key={analysis.id}
            className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-secondary">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>

            <div className="flex-1 min-w-0">
              <Link
                to={`/report/${analysis.id}`}
                className="font-medium text-foreground hover:text-primary transition-colors line-clamp-1"
              >
                {analysis.title}
              </Link>
              <p className="text-sm text-muted-foreground">
                {analysis.author} • {new Date(analysis.date).toLocaleDateString("pt-PT")}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {analysis.status === "completed" && (
                <>
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-semibold">{analysis.similarity}%</p>
                    <p className="text-xs text-muted-foreground">similaridade</p>
                  </div>
                  <Badge className={cn("font-medium", riskConfig[analysis.risk].className)}>
                    {riskConfig[analysis.risk].label}
                  </Badge>
                </>
              )}
              {analysis.status !== "completed" && (
                <Badge
                  variant="outline"
                  className={cn("font-medium", statusConfig[analysis.status].className)}
                >
                  {statusConfig[analysis.status].label}
                </Badge>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Ver relatório</DropdownMenuItem>
                  <DropdownMenuItem>Exportar PDF</DropdownMenuItem>
                  <DropdownMenuItem>Adicionar nota</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
