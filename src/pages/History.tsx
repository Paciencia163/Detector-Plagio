import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Filter, FileText, Download, MoreVertical, Calendar, Loader2 } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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

interface AnalysisRecord {
  id: string;
  title: string;
  author: string | null;
  file_name: string;
  created_at: string;
  similarity_percentage: number;
  risk_level: string;
  status: string;
  user_id: string;
}

export default function History() {
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const { user } = useAuth();

  useEffect(() => {
    fetchAnalyses();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("analyses-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "analyses" },
        () => fetchAnalyses()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAnalyses = async () => {
    try {
      const { data, error } = await supabase
        .from("analyses")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAnalyses((data as any[]) || []);
    } catch (error) {
      console.error("Error fetching analyses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredHistory = analyses.filter((record) => {
    const matchesSearch =
      record.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (record.author || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRisk = riskFilter === "all" || record.risk_level === riskFilter;
    return matchesSearch && matchesRisk;
  });

  return (
    <MainLayout
      title="Histórico de Análises"
      subtitle="Consulte todas as verificações de plágio realizadas"
    >
      <div className="space-y-4 md:space-y-6 animate-fade-in">
        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 sm:justify-between">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por título ou autor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filtrar risco" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="low">Baixo risco</SelectItem>
                <SelectItem value="medium">Médio risco</SelectItem>
                <SelectItem value="high">Alto risco</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" className="hidden sm:flex">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Loading */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Mobile Cards */}
            <div className="block md:hidden space-y-3">
              {filteredHistory.map((record) => {
                const risk = riskConfig[record.risk_level as keyof typeof riskConfig] || riskConfig.low;
                const status = statusConfig[record.status as keyof typeof statusConfig] || statusConfig.pending;

                return (
                  <div key={record.id} className="academic-card p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-secondary flex-shrink-0">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/report/${record.id}`}
                          className="font-medium text-foreground hover:text-primary transition-colors line-clamp-2 text-sm"
                        >
                          {record.title}
                        </Link>
                        <p className="text-xs text-muted-foreground mt-1">
                          {record.author || "Autor não especificado"} • {new Date(record.created_at).toLocaleDateString("pt-PT")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {record.status === "completed" && (
                          <>
                            <span className="text-sm font-semibold">{Number(record.similarity_percentage)}%</span>
                            <Badge className={cn("font-medium text-xs", risk.className)}>
                              {risk.label}
                            </Badge>
                          </>
                        )}
                        <Badge variant="outline" className={cn("font-medium text-xs", status.className)}>
                          {status.label}
                        </Badge>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/report/${record.id}`}>Ver relatório</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>Exportar PDF</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table */}
            <div className="academic-card overflow-hidden hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[40%]">Documento</TableHead>
                    <TableHead>Autor</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-center">Similaridade</TableHead>
                    <TableHead className="text-center">Risco</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHistory.map((record) => {
                    const risk = riskConfig[record.risk_level as keyof typeof riskConfig] || riskConfig.low;
                    const status = statusConfig[record.status as keyof typeof statusConfig] || statusConfig.pending;

                    return (
                      <TableRow key={record.id} className="group hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-secondary group-hover:bg-primary/10 transition-colors">
                              <FileText className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                            </div>
                            <div className="min-w-0">
                              <Link
                                to={`/report/${record.id}`}
                                className="font-medium text-foreground hover:text-primary transition-colors line-clamp-1"
                              >
                                {record.title}
                              </Link>
                              <p className="text-xs text-muted-foreground">
                                {record.file_name}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{record.author || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(record.created_at).toLocaleDateString("pt-PT")}
                        </TableCell>
                        <TableCell className="text-center">
                          {record.status === "completed" ? (
                            <span className="font-semibold">{Number(record.similarity_percentage)}%</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {record.status === "completed" && (
                            <Badge className={cn("font-medium", risk.className)}>
                              {risk.label}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className={cn("font-medium", status.className)}
                          >
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link to={`/report/${record.id}`}>Ver relatório</Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem>Exportar PDF</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {filteredHistory.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">
                    Nenhuma análise encontrada
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {analyses.length === 0
                      ? "Submeta um documento para começar"
                      : "Tente ajustar os filtros de pesquisa"}
                  </p>
                </div>
              )}
            </div>

            {/* Mobile empty state */}
            {filteredHistory.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center md:hidden">
                <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-lg font-medium text-muted-foreground">
                  Nenhuma análise encontrada
                </p>
                <p className="text-sm text-muted-foreground">
                  {analyses.length === 0
                    ? "Submeta um documento para começar"
                    : "Tente ajustar os filtros de pesquisa"}
                </p>
              </div>
            )}
          </>
        )}

        {/* Pagination hint */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>A mostrar {filteredHistory.length} de {analyses.length} análises</p>
        </div>
      </div>
    </MainLayout>
  );
}
