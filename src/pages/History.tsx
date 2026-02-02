import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Filter, FileText, Download, MoreVertical, Calendar } from "lucide-react";
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

interface AnalysisRecord {
  id: string;
  title: string;
  author: string;
  submittedBy: string;
  date: string;
  similarity: number;
  risk: "low" | "medium" | "high";
  status: "completed" | "processing" | "pending";
}

const mockHistory: AnalysisRecord[] = [
  {
    id: "1",
    title: "Impacto da Agricultura Sustentável na Região Sul de Angola",
    author: "Maria Santos",
    submittedBy: "João Mendes",
    date: "2025-01-28",
    similarity: 12,
    risk: "low",
    status: "completed",
  },
  {
    id: "2",
    title: "Análise Económica do Sector Petrolífero Angolano",
    author: "Pedro Nunes",
    submittedBy: "Ana Ferreira",
    date: "2025-01-28",
    similarity: 45,
    risk: "high",
    status: "completed",
  },
  {
    id: "3",
    title: "Desenvolvimento Urbano e Mobilidade em Luanda",
    author: "Ana Ferreira",
    submittedBy: "João Mendes",
    date: "2025-01-27",
    similarity: 28,
    risk: "medium",
    status: "completed",
  },
  {
    id: "4",
    title: "A Influência da Cultura Tradicional na Educação Moderna",
    author: "Carlos Domingos",
    submittedBy: "Maria Costa",
    date: "2025-01-27",
    similarity: 8,
    risk: "low",
    status: "completed",
  },
  {
    id: "5",
    title: "Estudo sobre Biodiversidade no Parque Nacional da Kissama",
    author: "Teresa Lourenço",
    submittedBy: "João Mendes",
    date: "2025-01-26",
    similarity: 0,
    risk: "low",
    status: "processing",
  },
  {
    id: "6",
    title: "Políticas Públicas de Saúde em Comunidades Rurais",
    author: "Miguel Fernandes",
    submittedBy: "Ana Ferreira",
    date: "2025-01-26",
    similarity: 18,
    risk: "low",
    status: "completed",
  },
  {
    id: "7",
    title: "Tecnologias de Informação no Ensino Superior Angolano",
    author: "Sofia Almeida",
    submittedBy: "João Mendes",
    date: "2025-01-25",
    similarity: 35,
    risk: "medium",
    status: "completed",
  },
  {
    id: "8",
    title: "Gestão de Recursos Hídricos na Província do Huambo",
    author: "António Silva",
    submittedBy: "Maria Costa",
    date: "2025-01-25",
    similarity: 5,
    risk: "low",
    status: "completed",
  },
];

const riskConfig = {
  low: { label: "Baixo", className: "risk-low" },
  medium: { label: "Médio", className: "risk-medium" },
  high: { label: "Alto", className: "risk-high" },
};

const statusConfig = {
  completed: { label: "Concluído", className: "bg-risk-low/10 text-risk-low border-risk-low/20" },
  processing: { label: "A processar", className: "bg-accent/10 text-accent border-accent/20" },
  pending: { label: "Pendente", className: "bg-muted text-muted-foreground border-border" },
};

export default function History() {
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("all");

  const filteredHistory = mockHistory.filter((record) => {
    const matchesSearch =
      record.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRisk = riskFilter === "all" || record.risk === riskFilter;
    return matchesSearch && matchesRisk;
  });

  return (
    <MainLayout
      title="Histórico de Análises"
      subtitle="Consulte todas as verificações de plágio realizadas"
    >
      <div className="space-y-6 animate-fade-in">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por título ou autor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex gap-2">
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="w-40">
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

            <Button variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              Período
            </Button>

            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="academic-card overflow-hidden">
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
              {filteredHistory.map((record) => (
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
                          Submetido por {record.submittedBy}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{record.author}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(record.date).toLocaleDateString("pt-PT")}
                  </TableCell>
                  <TableCell className="text-center">
                    {record.status === "completed" ? (
                      <span className="font-semibold">{record.similarity}%</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {record.status === "completed" && (
                      <Badge className={cn("font-medium", riskConfig[record.risk].className)}>
                        {riskConfig[record.risk].label}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="outline"
                      className={cn("font-medium", statusConfig[record.status].className)}
                    >
                      {statusConfig[record.status].label}
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
                        <DropdownMenuItem>Adicionar nota</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredHistory.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                Nenhuma análise encontrada
              </p>
              <p className="text-sm text-muted-foreground">
                Tente ajustar os filtros de pesquisa
              </p>
            </div>
          )}
        </div>

        {/* Pagination hint */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>A mostrar {filteredHistory.length} de {mockHistory.length} análises</p>
          <p>Página 1 de 1</p>
        </div>
      </div>
    </MainLayout>
  );
}
