import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Download, MessageSquare, Printer } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SimilarityGauge } from "@/components/report/SimilarityGauge";
import { ReportSummary } from "@/components/report/ReportSummary";
import { MatchedSource } from "@/components/report/MatchedSource";

const mockReport = {
  id: "demo",
  title: "Análise Económica do Sector Petrolífero Angolano: Desafios e Perspectivas",
  author: "Pedro Nunes",
  submittedAt: "2025-01-28T10:30:00",
  analyzedAt: "2025-01-28T10:35:42",
  wordCount: 8542,
  pageCount: 24,
  similarity: 32,
  risk: "medium" as const,
  selfPlagiarism: false,
  matchCount: 5,
};

const mockSources = [
  {
    id: "1",
    title: "Relatório Anual do Sector Energético de Angola 2024",
    type: "academic" as const,
    url: "https://example.com/relatorio-energia",
    similarity: 12,
    matchedText:
      "O sector petrolífero angolano representa aproximadamente 35% do PIB nacional e mais de 90% das exportações do país, constituindo a principal fonte de receitas do Estado.",
    originalText:
      "O sector petrolífero de Angola representa cerca de 35% do Produto Interno Bruto e mais de 90% das exportações totais, sendo a principal fonte de receitas governamentais.",
  },
  {
    id: "2",
    title: "Diversificação Económica em Países Dependentes de Petróleo",
    type: "external" as const,
    url: "https://example.com/diversificacao",
    similarity: 8,
    matchedText:
      "A dependência excessiva do petróleo cria vulnerabilidades macroeconómicas significativas, especialmente em períodos de volatilidade dos preços internacionais.",
    originalText:
      "Countries with excessive oil dependency face significant macroeconomic vulnerabilities, particularly during periods of international price volatility.",
  },
  {
    id: "3",
    title: "Análise do Mercado Petrolífero Africano - Edição 2023",
    type: "internal" as const,
    similarity: 7,
    matchedText:
      "Os principais blocos petrolíferos em exploração localizam-se na bacia do Congo, com destaque para as operações offshore em águas profundas.",
    originalText:
      "Os principais blocos petrolíferos em Angola estão situados na bacia do Congo, destacando-se as operações em águas profundas.",
  },
  {
    id: "4",
    title: "Políticas de Conteúdo Local na Indústria do Petróleo",
    type: "academic" as const,
    url: "https://example.com/conteudo-local",
    similarity: 3,
    matchedText:
      "As políticas de conteúdo local visam aumentar a participação de empresas nacionais na cadeia de valor do sector petrolífero.",
    originalText:
      "Local content policies aim to increase the participation of national companies in the oil sector value chain.",
  },
  {
    id: "5",
    title: "Transição Energética em Economias Petrolíferas",
    type: "external" as const,
    url: "https://example.com/transicao",
    similarity: 2,
    matchedText:
      "A transição energética global representa simultaneamente um desafio e uma oportunidade para os países produtores de petróleo.",
    originalText:
      "The global energy transition represents both a challenge and an opportunity for oil-producing nations.",
  },
];

export default function Report() {
  const { id } = useParams();

  return (
    <MainLayout
      title="Relatório de Análise"
      subtitle={`Referência: ${id?.toUpperCase()}`}
    >
      <div className="space-y-6 animate-fade-in">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <Button variant="ghost" asChild>
            <Link to="/history">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao histórico
            </Link>
          </Button>

          <div className="flex gap-2">
            <Button variant="outline">
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
            <Button>
              <Download className="mr-2 h-4 w-4" />
              Exportar PDF
            </Button>
          </div>
        </div>

        {/* Similarity Overview */}
        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start p-6 academic-card">
          <SimilarityGauge percentage={mockReport.similarity} size="lg" />

          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-display font-bold mb-2">
              {mockReport.similarity}% de Similaridade Total
            </h2>
            <p className="text-muted-foreground mb-4">
              O documento apresenta correspondências com {mockReport.matchCount} fontes identificadas.
              Recomenda-se a revisão dos trechos destacados abaixo.
            </p>

            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              <div className="text-center px-4 py-2 rounded-lg bg-secondary">
                <p className="text-2xl font-bold text-risk-low">68%</p>
                <p className="text-xs text-muted-foreground">Original</p>
              </div>
              <div className="text-center px-4 py-2 rounded-lg bg-secondary">
                <p className="text-2xl font-bold text-risk-medium">27%</p>
                <p className="text-xs text-muted-foreground">Citações</p>
              </div>
              <div className="text-center px-4 py-2 rounded-lg bg-secondary">
                <p className="text-2xl font-bold text-risk-high">5%</p>
                <p className="text-xs text-muted-foreground">Suspeito</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="summary" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="summary">Resumo</TabsTrigger>
            <TabsTrigger value="sources">Fontes ({mockSources.length})</TabsTrigger>
            <TabsTrigger value="notes">Observações</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-6">
            <ReportSummary report={mockReport} />
          </TabsContent>

          <TabsContent value="sources" className="space-y-4">
            <div className="academic-card p-6">
              <h2 className="text-lg font-display font-semibold mb-4">
                Fontes com Correspondências
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                Clique em cada fonte para expandir e visualizar os trechos correspondentes.
              </p>

              <div className="space-y-3">
                {mockSources.map((source) => (
                  <MatchedSource key={source.id} source={source} />
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notes" className="space-y-4">
            <div className="academic-card p-6">
              <h2 className="text-lg font-display font-semibold mb-4">
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

              <div className="mt-8 pt-6 border-t border-border">
                <h3 className="font-medium mb-4">Histórico de Observações</h3>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">João Mendes</span>
                      <span className="text-xs text-muted-foreground">28/01/2025, 11:45</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      As correspondências identificadas parecem ser citações devidamente referenciadas.
                      Recomendo aprovação com nota para revisão das referências bibliográficas.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Disclaimer */}
        <div className="text-center py-4 px-6 rounded-lg bg-muted/50 border border-border">
          <p className="text-sm text-muted-foreground">
            <strong>Aviso:</strong> Este relatório é gerado automaticamente e serve como ferramenta de apoio.
            A avaliação final da originalidade do trabalho é da responsabilidade dos editores e avaliadores
            da Revista Académica da Universidade Mandume.
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
