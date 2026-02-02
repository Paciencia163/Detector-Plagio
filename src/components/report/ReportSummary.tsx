import { FileText, User, Calendar, Clock, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ReportSummaryProps {
  report: {
    title: string;
    author: string;
    submittedAt: string;
    analyzedAt: string;
    wordCount: number;
    pageCount: number;
    similarity: number;
    risk: "low" | "medium" | "high";
    selfPlagiarism: boolean;
    matchCount: number;
  };
}

const riskConfig = {
  low: {
    label: "Baixo Risco",
    icon: CheckCircle,
    className: "risk-low",
    description: "O documento apresenta níveis aceitáveis de similaridade.",
  },
  medium: {
    label: "Risco Médio",
    icon: Info,
    className: "risk-medium",
    description: "Recomenda-se revisão manual dos trechos identificados.",
  },
  high: {
    label: "Alto Risco",
    icon: AlertTriangle,
    className: "risk-high",
    description: "Identificados trechos que requerem investigação aprofundada.",
  },
};

export function ReportSummary({ report }: ReportSummaryProps) {
  const risk = riskConfig[report.risk];
  const RiskIcon = risk.icon;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Document Info */}
      <div className="lg:col-span-2 academic-card p-6">
        <h2 className="text-lg font-display font-semibold mb-4">Informações do Documento</h2>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">Título</p>
              <p className="font-medium">{report.title}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Autor</p>
                <p className="font-medium">{report.author}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Data de Submissão</p>
                <p className="font-medium">
                  {new Date(report.submittedAt).toLocaleDateString("pt-PT")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Análise Concluída</p>
                <p className="font-medium">
                  {new Date(report.analyzedAt).toLocaleString("pt-PT")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Extensão</p>
                <p className="font-medium">
                  {report.wordCount.toLocaleString()} palavras • {report.pageCount} páginas
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Assessment */}
      <div className="academic-card p-6">
        <h2 className="text-lg font-display font-semibold mb-4">Avaliação de Risco</h2>

        <div className="flex flex-col items-center text-center space-y-4">
          <div className={cn("p-4 rounded-full", risk.className)}>
            <RiskIcon className="h-8 w-8" />
          </div>

          <div>
            <Badge className={cn("text-base px-4 py-1", risk.className)}>{risk.label}</Badge>
            <p className="text-sm text-muted-foreground mt-3">{risk.description}</p>
          </div>

          <div className="w-full pt-4 border-t border-border space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Correspondências</span>
              <span className="font-medium">{report.matchCount} fontes</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Auto-plágio</span>
              <span className="font-medium">
                {report.selfPlagiarism ? "Detectado" : "Não detectado"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
