import { useState, useEffect } from "react";
import { FileText, MoreVertical, ExternalLink, Loader2 } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";

const riskConfig = {
  low: { label: "Baixo", className: "risk-low" },
  medium: { label: "Médio", className: "risk-medium" },
  high: { label: "Alto", className: "risk-high" },
};

const statusConfig = {
  completed: { label: "Concluído", className: "bg-risk-low/10 text-risk-low border-risk-low/20" },
  processing: { label: "A processar", className: "bg-accent/10 text-accent border-accent/20 animate-pulse-soft" },
  pending: { label: "Pendente", className: "bg-muted text-muted-foreground border-border" },
  error: { label: "Erro", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

export function RecentAnalyses() {
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecent = async () => {
      const { data } = await supabase
        .from("analyses")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      setAnalyses(data || []);
      setIsLoading(false);
    };
    fetchRecent();

    const channel = supabase
      .channel("recent-analyses")
      .on("postgres_changes", { event: "*", schema: "public", table: "analyses" }, () => fetchRecent())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="academic-card">
      <div className="flex items-center justify-between p-4 md:p-6 border-b border-border">
        <div>
          <h2 className="text-base md:text-lg font-display font-semibold">Análises Recentes</h2>
          <p className="text-xs md:text-sm text-muted-foreground">Últimas verificações de plágio</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/history">
            Ver todas
            <ExternalLink className="ml-2 h-4 w-4 hidden sm:inline" />
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : analyses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center px-4">
          <FileText className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">Nenhuma análise realizada ainda</p>
          <Button variant="outline" size="sm" className="mt-3" asChild>
            <Link to="/upload">Submeter documento</Link>
          </Button>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {analyses.map((analysis) => {
            const risk = riskConfig[analysis.risk_level as keyof typeof riskConfig] || riskConfig.low;
            const status = statusConfig[analysis.status as keyof typeof statusConfig] || statusConfig.pending;

            return (
              <div
                key={analysis.id}
                className="flex items-center gap-3 md:gap-4 p-3 md:p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-lg bg-secondary flex-shrink-0">
                  <FileText className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                </div>

                <div className="flex-1 min-w-0">
                  <Link
                    to={`/report/${analysis.id}`}
                    className="font-medium text-sm md:text-base text-foreground hover:text-primary transition-colors line-clamp-1"
                  >
                    {analysis.title}
                  </Link>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    {analysis.author || "Sem autor"} • {new Date(analysis.created_at).toLocaleDateString("pt-PT")}
                  </p>
                </div>

                <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                  {analysis.status === "completed" && (
                    <>
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold">{Number(analysis.similarity_percentage)}%</p>
                        <p className="text-xs text-muted-foreground">similaridade</p>
                      </div>
                      <Badge className={cn("font-medium text-xs", risk.className)}>
                        {risk.label}
                      </Badge>
                    </>
                  )}
                  {analysis.status !== "completed" && (
                    <Badge
                      variant="outline"
                      className={cn("font-medium text-xs", status.className)}
                    >
                      {status.label}
                    </Badge>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 md:h-8 md:w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to={`/report/${analysis.id}`}>Ver relatório</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>Exportar PDF</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
