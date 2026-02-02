import { ExternalLink, ChevronDown, ChevronUp, FileText, Globe, BookOpen } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface MatchedSourceProps {
  source: {
    id: string;
    title: string;
    type: "internal" | "external" | "academic";
    url?: string;
    similarity: number;
    matchedText: string;
    originalText: string;
  };
}

const sourceIcons = {
  internal: FileText,
  external: Globe,
  academic: BookOpen,
};

const sourceLabels = {
  internal: "Base Interna",
  external: "Web",
  academic: "Académico",
};

export function MatchedSource({ source }: MatchedSourceProps) {
  const [expanded, setExpanded] = useState(false);
  const Icon = sourceIcons[source.type];

  const getRiskClass = (pct: number) => {
    if (pct <= 15) return "risk-low";
    if (pct <= 30) return "risk-medium";
    return "risk-high";
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-4 text-left hover:bg-muted/50 transition-colors"
      >
        <div className="p-2 rounded-lg bg-secondary">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-foreground truncate">{source.title}</p>
            <Badge variant="outline" className="text-xs">
              {sourceLabels[source.type]}
            </Badge>
          </div>
          {source.url && (
            <p className="text-sm text-muted-foreground truncate mt-0.5">{source.url}</p>
          )}
        </div>

        <Badge className={cn("font-semibold", getRiskClass(source.similarity))}>
          {source.similarity}%
        </Badge>

        {expanded ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Texto do documento</p>
              <div className="p-3 rounded-lg bg-highlight-strong/30 border border-highlight-strong text-sm">
                {source.matchedText}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Texto da fonte</p>
              <div className="p-3 rounded-lg bg-muted text-sm">{source.originalText}</div>
            </div>
          </div>

          {source.url && (
            <Button variant="outline" size="sm" asChild>
              <a href={source.url} target="_blank" rel="noopener noreferrer">
                Ver fonte original
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
