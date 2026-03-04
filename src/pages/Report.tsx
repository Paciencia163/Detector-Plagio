import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, Download, MessageSquare, Printer, Loader2 } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SimilarityGauge } from "@/components/report/SimilarityGauge";
import { ReportSummary } from "@/components/report/ReportSummary";
import { MatchedSource } from "@/components/report/MatchedSource";
import { supabase } from "@/integrations/supabase/client";

interface AnalysisData {
  id: string;
  title: string;
  author: string | null;
  file_name: string;
  status: string;
  similarity_percentage: number;
  risk_level: string;
  original_percentage: number;
  citations_percentage: number;
  suspicious_percentage: number;
  word_count: number;
  matched_sources: any[];
  ai_report: any;
  created_at: string;
  updated_at: string;
}

export default function Report() {
  const { id } = useParams();
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchAnalysis = async () => {
      const { data, error } = await supabase
        .from("analyses")
        .select("*")
        .eq("id", id)
        .single();

      if (!error && data) {
        setAnalysis(data as any);
      }
      setIsLoading(false);
    };

    fetchAnalysis();

    // Subscribe to updates for this analysis
    const channel = supabase
      .channel(`analysis-${id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "analyses", filter: `id=eq.${id}` },
        (payload) => setAnalysis(payload.new as any)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  if (isLoading) {
    return (
      <MainLayout title="Relatório de Análise">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!analysis) {
    return (
      <MainLayout title="Relatório não encontrado">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-muted-foreground mb-4">A análise solicitada não foi encontrada.</p>
          <Button asChild>
            <Link to="/history">Voltar ao histórico</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  if (analysis.status === "processing" || analysis.status === "pending") {
    return (
      <MainLayout title="Análise em Curso" subtitle={analysis.title}>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg font-medium text-foreground mb-2">A analisar o documento...</p>
          <p className="text-muted-foreground">A inteligência artificial está a verificar a originalidade do texto.</p>
        </div>
      </MainLayout>
    );
  }

  const matchedSources = (analysis.matched_sources || []).map((s: any, i: number) => ({
    id: String(i + 1),
    title: s.title,
    type: s.type || "external",
    similarity: s.similarity,
    matchedText: s.matched_text,
    originalText: s.original_text,
  }));

  const reportData = {
    id: analysis.id,
    title: analysis.title,
    author: analysis.author || "Não especificado",
    submittedAt: analysis.created_at,
    analyzedAt: analysis.updated_at,
    wordCount: analysis.word_count,
    pageCount: Math.ceil(analysis.word_count / 300),
    similarity: Number(analysis.similarity_percentage),
    risk: analysis.risk_level as "low" | "medium" | "high",
    selfPlagiarism: false,
    matchCount: matchedSources.length,
  };

  return (
    <MainLayout
      title="Relatório de Análise"
      subtitle={analysis.title}
    >
      <div className="space-y-4 md:space-y-6 animate-fade-in">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between items-start sm:items-center">
          <Button variant="ghost" asChild>
            <Link to="/history">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao histórico
            </Link>
          </Button>

          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" className="flex-1 sm:flex-initial">
              <Printer className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Imprimir</span>
            </Button>
            <Button className="flex-1 sm:flex-initial">
              <Download className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Exportar PDF</span>
            </Button>
          </div>
        </div>

        {/* Similarity Overview */}
        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start p-4 md:p-6 academic-card">
          <SimilarityGauge percentage={Number(analysis.similarity_percentage)} size="lg" />

          <div className="flex-1 text-center md:text-left">
            <h2 className="text-xl md:text-2xl font-display font-bold mb-2">
              {Number(analysis.similarity_percentage)}% de Similaridade Total
            </h2>
            <p className="text-sm md:text-base text-muted-foreground mb-4">
              {analysis.ai_report?.summary || `O documento apresenta correspondências com ${matchedSources.length} fontes identificadas.`}
            </p>

            <div className="flex flex-wrap gap-3 md:gap-4 justify-center md:justify-start">
              <div className="text-center px-3 md:px-4 py-2 rounded-lg bg-secondary">
                <p className="text-xl md:text-2xl font-bold text-risk-low">{Number(analysis.original_percentage)}%</p>
                <p className="text-xs text-muted-foreground">Original</p>
              </div>
              <div className="text-center px-3 md:px-4 py-2 rounded-lg bg-secondary">
                <p className="text-xl md:text-2xl font-bold text-risk-medium">{Number(analysis.citations_percentage)}%</p>
                <p className="text-xs text-muted-foreground">Citações</p>
              </div>
              <div className="text-center px-3 md:px-4 py-2 rounded-lg bg-secondary">
                <p className="text-xl md:text-2xl font-bold text-risk-high">{Number(analysis.suspicious_percentage)}%</p>
                <p className="text-xs text-muted-foreground">Suspeito</p>
              </div>
            </div>
          </div>
        </div>

        {/* AI Recommendations */}
        {analysis.ai_report?.recommendations && analysis.ai_report.recommendations.length > 0 && (
          <div className="academic-card p-4 md:p-6">
            <h3 className="font-display font-semibold text-base md:text-lg mb-3">Recomendações da IA</h3>
            <ul className="space-y-2">
              {analysis.ai_report.recommendations.map((rec: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-primary font-bold mt-0.5">•</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="summary" className="space-y-4 md:space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="summary" className="text-xs sm:text-sm">Resumo</TabsTrigger>
            <TabsTrigger value="sources" className="text-xs sm:text-sm">Fontes ({matchedSources.length})</TabsTrigger>
            <TabsTrigger value="notes" className="text-xs sm:text-sm">Observações</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-6">
            <ReportSummary report={reportData} />
          </TabsContent>

          <TabsContent value="sources" className="space-y-4">
            <div className="academic-card p-4 md:p-6">
              <h2 className="text-base md:text-lg font-display font-semibold mb-4">
                Fontes com Correspondências
              </h2>

              {matchedSources.length > 0 ? (
                <div className="space-y-3">
                  {matchedSources.map((source: any) => (
                    <MatchedSource key={source.id} source={source} />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Nenhuma fonte identificada.</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="notes" className="space-y-4">
            <div className="academic-card p-4 md:p-6">
              <h2 className="text-base md:text-lg font-display font-semibold mb-4">
                Observações do Avaliador
              </h2>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="evaluator-notes">Adicionar observação</Label>
                  <Textarea
                    id="evaluator-notes"
                    placeholder="Insira as suas observações sobre esta análise..."
                    rows={5}
                  />
                </div>

                <Button>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Guardar Observação
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Disclaimer */}
        <div className="text-center py-3 md:py-4 px-4 md:px-6 rounded-lg bg-muted/50 border border-border">
          <p className="text-xs md:text-sm text-muted-foreground">
            <strong>Aviso:</strong> Este relatório é gerado por inteligência artificial e serve como ferramenta de apoio.
            A avaliação final da originalidade do trabalho é da responsabilidade dos editores e avaliadores
            da Revista Académica da Universidade Mandume.
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
