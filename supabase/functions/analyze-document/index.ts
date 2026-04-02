import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import JSZip from "https://esm.sh/jszip@3.10.1";
import { inflate } from "https://esm.sh/pako@2.1.0";

type TextQuality = "good" | "poor";
type SourceType = "internal" | "external";

type ExtractedDocument = {
  text: string;
  hash: string;
  quality: TextQuality;
  method: "pdf-native" | "docx-xml" | "plain-text";
};

type Passage = {
  original: string;
  normalized: string;
  shingles: Set<string>;
};

type ComparisonSource = {
  id?: string;
  title: string;
  type: SourceType;
  url?: string;
  text: string;
  hash?: string;
  author?: string;
};

type MatchedSource = {
  title: string;
  type: "internal" | "external" | "academic";
  url?: string;
  similarity: number;
  matched_text: string;
  original_text: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_ANALYSIS_CHARS = 120_000;
const MAX_PROMPT_MATCHES = 8;

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function createWordShingles(text: string, size = 4): Set<string> {
  const words = normalizeText(text).split(" ").filter(Boolean);
  if (words.length === 0) return new Set();
  if (words.length <= size) return new Set([words.join(" ")]);

  const shingles = new Set<string>();
  for (let i = 0; i <= words.length - size; i++) {
    shingles.add(words.slice(i, i + size).join(" "));
  }
  return shingles;
}

function extractCandidatePassages(text: string, limit = 18): Passage[] {
  const sanitized = text.replace(/\r/g, "").replace(/\t/g, " ");
  const rawCandidates = sanitized
    .split(/\n{2,}/)
    .flatMap((block) => {
      const cleanBlock = block.replace(/\s+/g, " ").trim();
      if (!cleanBlock) return [] as string[];
      if (cleanBlock.length > 650) {
        return cleanBlock
          .split(/(?<=[.!?])\s+/)
          .map((part) => part.trim())
          .filter(Boolean);
      }
      return [cleanBlock];
    })
    .map((candidate) => candidate.replace(/\s+/g, " ").trim())
    .filter((candidate) => candidate.length >= 80 && candidate.length <= 550)
    .filter((candidate) => {
      const compact = candidate.replace(/\s+/g, "");
      const letters = (candidate.match(/\p{L}/gu) || []).length;
      return letters >= 50 && letters / Math.max(compact.length, 1) >= 0.45;
    })
    .filter((candidate) => !/^(universidade|departamento|faculdade|cap[íi]tulo|índice|sum[áa]rio|bibliografia|refer[êe]ncias|anexo)/i.test(candidate));

  const unique = new Map<string, Passage>();
  for (const candidate of rawCandidates) {
    const normalized = normalizeText(candidate);
    if (!normalized || unique.has(normalized)) continue;
    unique.set(normalized, {
      original: candidate,
      normalized,
      shingles: createWordShingles(candidate),
    });
  }

  const passages = Array.from(unique.values());
  if (passages.length <= limit) return passages;

  const selected: Passage[] = [];
  const step = passages.length / limit;
  for (let i = 0; i < limit; i++) {
    selected.push(passages[Math.floor(i * step)]);
  }
  return selected;
}

function decodePdfLiteralString(value: string): string {
  return value
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\b/g, "\b")
    .replace(/\\f/g, "\f")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\\/g, "\\")
    .replace(/\\([0-7]{1,3})/g, (_, octal) => String.fromCharCode(parseInt(octal, 8)));
}

function decodeUtf16Be(bytes: Uint8Array): string {
  let result = "";
  for (let i = 0; i + 1 < bytes.length; i += 2) {
    const code = (bytes[i] << 8) | bytes[i + 1];
    if (code !== 0) result += String.fromCharCode(code);
  }
  return result;
}

function decodePdfHexString(hex: string): string {
  const clean = hex.replace(/\s+/g, "");
  if (!clean || clean.length < 2) return "";

  const bytes = new Uint8Array(Math.floor(clean.length / 2));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }

  const zeroBytes = bytes.filter((byte, index) => index % 2 === 0 && byte === 0).length;
  const decoded = zeroBytes > bytes.length / 6
    ? decodeUtf16Be(bytes)
    : Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");

  return decodePdfLiteralString(decoded);
}

function collectPdfTextSegments(input: string): string[] {
  const textParts: string[] = [];

  const literalTjRegex = /\(([^()]*(?:\\.[^()]*)*)\)\s*Tj/g;
  let literalMatch: RegExpExecArray | null;
  while ((literalMatch = literalTjRegex.exec(input)) !== null) {
    textParts.push(decodePdfLiteralString(literalMatch[1]));
  }

  const hexTjRegex = /<([0-9A-Fa-f\s]+)>\s*Tj/g;
  let hexMatch: RegExpExecArray | null;
  while ((hexMatch = hexTjRegex.exec(input)) !== null) {
    textParts.push(decodePdfHexString(hexMatch[1]));
  }

  const tjArrayRegex = /\[([^\]]*)\]\s*TJ/g;
  let tjArrayMatch: RegExpExecArray | null;
  while ((tjArrayMatch = tjArrayRegex.exec(input)) !== null) {
    const inner = tjArrayMatch[1];

    const innerLiteralRegex = /\(([^()]*(?:\\.[^()]*)*)\)/g;
    let innerLiteralMatch: RegExpExecArray | null;
    while ((innerLiteralMatch = innerLiteralRegex.exec(inner)) !== null) {
      textParts.push(decodePdfLiteralString(innerLiteralMatch[1]));
    }

    const innerHexRegex = /<([0-9A-Fa-f\s]+)>/g;
    let innerHexMatch: RegExpExecArray | null;
    while ((innerHexMatch = innerHexRegex.exec(inner)) !== null) {
      textParts.push(decodePdfHexString(innerHexMatch[1]));
    }
  }

  return textParts;
}

function cleanExtractedText(text: string): string {
  return text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

function getTextQuality(text: string): TextQuality {
  const compact = text.replace(/\s+/g, "");
  const letters = (text.match(/\p{L}/gu) || []).length;
  const words = text.split(/\s+/).filter(Boolean).length;
  const ratio = letters / Math.max(compact.length, 1);
  return text.length >= 500 && words >= 80 && ratio >= 0.45 ? "good" : "poor";
}

async function sha256Hex(arrayBuffer: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", arrayBuffer);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function extractPdfText(arrayBuffer: ArrayBuffer): Promise<string> {
  const bytes = new Uint8Array(arrayBuffer);
  const rawStr = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  const extractedParts = collectPdfTextSegments(rawStr);

  const streamRegex = /stream\r?\n([\s\S]*?)endstream/g;
  let match: RegExpExecArray | null;

  while ((match = streamRegex.exec(rawStr)) !== null) {
    const streamData = match[1];
    try {
      const streamBytes = new Uint8Array(streamData.length);
      for (let i = 0; i < streamData.length; i++) {
        streamBytes[i] = streamData.charCodeAt(i) & 0xff;
      }

      const inflated = inflate(streamBytes, { to: "string" });
      const inflatedText = typeof inflated === "string"
        ? inflated
        : new TextDecoder("utf-8", { fatal: false }).decode(inflated);

      extractedParts.push(...collectPdfTextSegments(inflatedText));
    } catch {
      continue;
    }
  }

  const result = cleanExtractedText(extractedParts.join(" "));
  console.log(`PDF extraction: found ${extractedParts.length} text segments, ${result.length} chars`);
  return result;
}

async function extractDocxText(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    const zip = await JSZip.loadAsync(arrayBuffer);
    const xmlFiles = ["word/document.xml", "word/footnotes.xml", "word/endnotes.xml"];
    const chunks: string[] = [];

    for (const xmlPath of xmlFiles) {
      const xml = await zip.file(xmlPath)?.async("string");
      if (!xml) continue;
      chunks.push(
        xml
          .replace(/<w:tab\/>/g, "\t")
          .replace(/<w:br[^>]*\/>/g, "\n")
          .replace(/<\/w:p>/g, "\n")
          .replace(/<\/w:tr>/g, "\n")
          .replace(/<\/w:tc>/g, " ")
          .replace(/<[^>]+>/g, "")
      );
    }

    const text = cleanExtractedText(
      chunks
        .join("\n")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
    );

    console.log(`DOCX extraction: ${text.length} chars extracted`);
    return text;
  } catch (error) {
    console.error("DOCX extraction failed:", error);
    return "";
  }
}

async function extractDocument(fileData: Blob, fileType: string): Promise<ExtractedDocument> {
  const arrayBuffer = await fileData.arrayBuffer();
  const hash = await sha256Hex(arrayBuffer);

  let text = "";
  let method: ExtractedDocument["method"] = "plain-text";

  if (fileType === "application/pdf" || fileType === "pdf") {
    text = await extractPdfText(arrayBuffer);
    method = "pdf-native";
  } else if (
    fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    fileType === "docx"
  ) {
    text = await extractDocxText(arrayBuffer);
    method = "docx-xml";
  } else {
    text = cleanExtractedText(await fileData.text());
  }

  const trimmedText = text.substring(0, MAX_ANALYSIS_CHARS);
  return {
    text: trimmedText,
    hash,
    quality: getTextQuality(trimmedText),
    method,
  };
}

async function fetchJsonWithTimeout(url: string, options: RequestInit, timeoutMs = 12_000): Promise<any> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const text = await response.text();
    const data = text ? JSON.parse(text) : null;
    if (!response.ok) {
      throw new Error(data?.error || data?.message || `HTTP ${response.status}`);
    }
    return data;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function searchWebForSimilarContent(text: string, quality: TextQuality): Promise<ComparisonSource[]> {
  const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");
  if (!firecrawlApiKey || quality === "poor") {
    console.log("Skipping web search because connector is unavailable or text quality is poor");
    return [];
  }

  const passages = extractCandidatePassages(text, 9);
  const searchQueries = passages.slice(0, 3).map((passage) => passage.original.substring(0, 220));
  if (searchQueries.length === 0) return [];

  const results = new Map<string, ComparisonSource>();

  for (const query of searchQueries) {
    try {
      console.log(`Firecrawl search: "${query.substring(0, 60)}..."`);
      const data = await fetchJsonWithTimeout(
        "https://api.firecrawl.dev/v1/search",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${firecrawlApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: `"${query}"`,
            limit: 4,
            lang: "pt",
            scrapeOptions: { formats: ["markdown"] },
          }),
        },
        15_000,
      );

      const entries = Array.isArray(data?.data) ? data.data : [];
      for (const entry of entries) {
        const sourceText = cleanExtractedText(
          (entry?.markdown || entry?.description || "").substring(0, 8_000),
        );
        if (!entry?.url || sourceText.length < 80 || results.has(entry.url)) continue;

        results.set(entry.url, {
          title: entry?.title || entry.url,
          type: "external",
          url: entry.url,
          text: sourceText,
        });
      }
    } catch (error) {
      console.error("Firecrawl search error:", error);
    }
  }

  console.log(`Web search found ${results.size} unique sources`);
  return Array.from(results.values()).slice(0, 10);
}

async function fetchRepositoryDocuments(
  supabase: any,
  currentAnalysisId: string,
  maxDocs = 12,
): Promise<ComparisonSource[]> {
  const { data: recentAnalyses, error } = await supabase
    .from("analyses")
    .select("id, title, author, file_path, file_type")
    .eq("status", "completed")
    .neq("id", currentAnalysisId)
    .order("created_at", { ascending: false })
    .limit(maxDocs);

  if (error || !recentAnalyses?.length) {
    console.error("Failed to fetch repository analyses:", error);
    return [];
  }

  const settled = await Promise.allSettled(
    recentAnalyses.map(async (analysis: any) => {
      const { data: fileData, error: downloadError } = await supabase.storage
        .from("documents")
        .download(analysis.file_path);

      if (downloadError || !fileData) {
        throw new Error(downloadError?.message || "Failed to download repository file");
      }

      const extracted = await extractDocument(fileData, analysis.file_type);
      return {
        id: analysis.id,
        title: analysis.title,
        author: analysis.author || "Desconhecido",
        type: "internal" as const,
        text: extracted.text.substring(0, 25_000),
        hash: extracted.hash,
      };
    }),
  );

  return settled
    .filter((result): result is PromiseFulfilledResult<ComparisonSource> => result.status === "fulfilled")
    .map((result) => result.value)
    .filter((doc) => doc.text.length >= 80 || !!doc.hash);
}

function comparePassages(submitted: Passage, source: Passage): number {
  if (!submitted.normalized || !source.normalized) return 0;
  if (submitted.normalized === source.normalized) return 1;

  const anchor = submitted.normalized.split(" ").slice(0, 10).join(" ");
  if (anchor.length > 40 && source.normalized.includes(anchor)) return 0.98;
  if (submitted.normalized.length > 120 && source.normalized.includes(submitted.normalized)) return 1;

  const sourceShingles = source.shingles;
  if (submitted.shingles.size === 0 || sourceShingles.size === 0) return 0;

  let overlap = 0;
  for (const shingle of submitted.shingles) {
    if (sourceShingles.has(shingle)) overlap += 1;
  }

  return overlap / submitted.shingles.size;
}

function analyzeSources(submittedText: string, submittedHash: string, sources: ComparisonSource[]) {
  const docPassages = extractCandidatePassages(submittedText, 18);
  const matchedSources: Array<MatchedSource & { _key: string; _length: number }> = [];
  const matchedPassages = new Map<string, number>();

  for (const source of sources) {
    if (source.hash && source.hash === submittedHash) {
      const exactPassage = docPassages[0]?.original || submittedText.substring(0, 400);
      const normalizedKey = normalizeText(exactPassage) || source.title;
      matchedPassages.set(normalizedKey, exactPassage.length);
      matchedSources.push({
        title: source.title,
        type: "internal",
        similarity: 100,
        matched_text: exactPassage || "Documento idêntico encontrado.",
        original_text: source.text.substring(0, 400) || "Documento idêntico encontrado no repositório interno através da assinatura digital do ficheiro.",
        _key: `${source.type}:${source.url || source.id || source.title}`,
        _length: exactPassage.length || 800,
      });
      continue;
    }

    const sourcePassages = extractCandidatePassages(source.text, 22);
    if (!docPassages.length || !sourcePassages.length) continue;

    let bestScore = 0;
    let bestDocPassage: Passage | null = null;
    let bestSourcePassage: Passage | null = null;

    for (const docPassage of docPassages) {
      for (const sourcePassage of sourcePassages) {
        const score = comparePassages(docPassage, sourcePassage);
        if (score > bestScore) {
          bestScore = score;
          bestDocPassage = docPassage;
          bestSourcePassage = sourcePassage;
        }
      }
    }

    if (!bestDocPassage || !bestSourcePassage || bestScore < 0.58) continue;

    matchedPassages.set(bestDocPassage.normalized, bestDocPassage.original.length);
    matchedSources.push({
      title: source.title,
      type: source.type,
      url: source.url,
      similarity: Math.round(bestScore * 100),
      matched_text: bestDocPassage.original,
      original_text: bestSourcePassage.original,
      _key: `${source.type}:${source.url || source.id || source.title}`,
      _length: bestDocPassage.original.length,
    });
  }

  const dedupedSources = Array.from(
    new Map(
      matchedSources
        .sort((a, b) => b.similarity - a.similarity || b._length - a._length)
        .map((source) => [source._key, source]),
    ).values(),
  );

  const exactInternalMatch = dedupedSources.some((source) => source.type === "internal" && source.similarity === 100);
  const matchedChars = Array.from(matchedPassages.values()).reduce((sum, length) => sum + length, 0);
  const baseSimilarity = exactInternalMatch
    ? 100
    : Math.round((matchedChars / Math.max(submittedText.length, 1)) * 100);
  const fallbackSimilarity = dedupedSources.length > 0
    ? Math.max(8, Math.round(Math.max(...dedupedSources.map((source) => source.similarity)) * 0.35))
    : 0;

  const similarity = clamp(
    exactInternalMatch ? 100 : Math.max(baseSimilarity, fallbackSimilarity),
    0,
    exactInternalMatch ? 100 : 95,
  );

  return {
    similarity,
    matchedSources: dedupedSources.slice(0, 12).map(({ _key, _length, ...source }) => source),
  };
}

function detectCitationPercentage(text: string): number {
  const citationMatches = text.match(/\([^)]*\d{4}[^)]*\)|\[[0-9,;\s-]+\]/g) || [];
  return clamp(Math.round((citationMatches.length / Math.max(text.split(/\s+/).filter(Boolean).length, 1)) * 2500), 0, 25);
}

function buildRiskLevel(similarity: number): "low" | "medium" | "high" {
  if (similarity <= 15) return "low";
  if (similarity <= 30) return "medium";
  return "high";
}

function buildFallbackSummary(params: {
  similarity: number;
  matchedSources: MatchedSource[];
  repositoryDocsCompared: number;
  webSourcesCompared: number;
  extractionMethod: string;
  quality: TextQuality;
}): { summary: string; recommendations: string[] } {
  const { similarity, matchedSources, repositoryDocsCompared, webSourcesCompared, extractionMethod, quality } = params;
  const sourceCount = matchedSources.length;

  let summary = `A análise comparou o documento com ${repositoryDocsCompared} documento(s) do repositório interno e ${webSourcesCompared} fonte(s) web relevantes, usando extração ${extractionMethod}.`;

  if (sourceCount === 0) {
    summary += similarity === 0
      ? " Não foram encontradas correspondências textuais significativas nas fontes analisadas."
      : " Foram detetadas correspondências limitadas, mas abaixo do limiar para listar fontes confiáveis.";
  } else {
    const topSource = matchedSources[0];
    summary += ` Foram encontradas ${sourceCount} fonte(s) com conteúdo semelhante, com destaque para \"${topSource.title}\" (${topSource.similarity}% de correspondência no melhor excerto).`;
  }

  if (quality === "poor") {
    summary += " A qualidade do texto extraído foi limitada, o que pode indicar PDF digitalizado, protegido ou com codificação inconsistente.";
  }

  const recommendations = [
    similarity >= 30
      ? "Revise cuidadosamente os trechos destacados e reescreva as passagens demasiado próximas das fontes identificadas."
      : "Verifique os trechos assinalados para confirmar se as semelhanças representam citação correta ou reutilização excessiva de texto.",
    "Confirme manualmente as fontes listadas antes da decisão editorial final.",
  ];

  if (quality === "poor") {
    recommendations.push("Se o ficheiro for um PDF digitalizado, exporte-o com OCR ou envie a versão DOCX para melhorar a análise.");
  }

  return { summary, recommendations };
}

async function enhanceSummaryWithAi(
  lovableApiKey: string | null,
  payload: {
    title: string;
    author: string | null;
    similarity: number;
    riskLevel: "low" | "medium" | "high";
    matchedSources: MatchedSource[];
    repositoryDocsCompared: number;
    webSourcesCompared: number;
  },
): Promise<{ summary: string; recommendations: string[] } | null> {
  if (!lovableApiKey) return null;

  const compactMatches = payload.matchedSources.slice(0, MAX_PROMPT_MATCHES).map((source) => ({
    title: source.title,
    type: source.type,
    url: source.url,
    similarity: source.similarity,
    matched_text: source.matched_text.substring(0, 240),
    original_text: source.original_text.substring(0, 240),
  }));

  try {
    const aiResponse = await fetchJsonWithTimeout(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            {
              role: "system",
              content:
                "És um assistente de análise de originalidade académica. Responde APENAS em JSON válido com as chaves summary (string) e recommendations (array com 2 ou 3 strings). Não inventes fontes.",
            },
            {
              role: "user",
              content: JSON.stringify({
                document: {
                  title: payload.title,
                  author: payload.author,
                  similarity: payload.similarity,
                  riskLevel: payload.riskLevel,
                },
                coverage: {
                  repositoryDocsCompared: payload.repositoryDocsCompared,
                  webSourcesCompared: payload.webSourcesCompared,
                },
                matchedSources: compactMatches,
              }),
            },
          ],
        }),
      },
      15_000,
    );

    const content = aiResponse?.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);
    if (!parsed?.summary || !Array.isArray(parsed?.recommendations)) return null;

    return {
      summary: String(parsed.summary),
      recommendations: parsed.recommendations.map((item: unknown) => String(item)).slice(0, 3),
    };
  } catch (error) {
    console.error("AI summary enhancement failed:", error);
    return null;
  }
}

async function updateAnalysisError(supabase: any, analysisId: string, message: string) {
  await supabase
    .from("analyses")
    .update({
      status: "error",
      ai_report: {
        summary: message,
        recommendations: [
          "Verifique o formato e integridade do ficheiro submetido.",
          "Se o problema persistir, reenvie o documento em DOCX ou TXT para comparação alternativa.",
        ],
      },
    })
    .eq("id", analysisId);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let analysisId = "";
  let supabase: any = null;

  try {
    const body = await req.json();
    analysisId = String(body?.analysisId || "").trim();
    if (!analysisId) {
      return new Response(JSON.stringify({ error: "analysisId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY") ?? null;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Backend credentials are not configured");
    }

    supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: analysis, error: fetchError } = await supabase
      .from("analyses")
      .select("*")
      .eq("id", analysisId)
      .single();

    if (fetchError || !analysis) {
      throw new Error("Analysis not found");
    }

    await supabase.from("analyses").update({ status: "processing" }).eq("id", analysisId);

    const { data: fileData, error: downloadError } = await supabase.storage
      .from("documents")
      .download(analysis.file_path);

    if (downloadError || !fileData) {
      await updateAnalysisError(supabase, analysisId, "Não foi possível descarregar o ficheiro para análise.");
      throw new Error(downloadError?.message || "Failed to download file");
    }

    const extracted = await extractDocument(fileData, analysis.file_type);
    const wordCount = extracted.text.split(/\s+/).filter(Boolean).length;

    console.log(`Document extracted: ${wordCount} words, ${extracted.text.length} chars`);
    console.log(`First 200 chars: ${extracted.text.substring(0, 200)}`);

    const [repositoryDocs, webSources] = await Promise.all([
      fetchRepositoryDocuments(supabase, analysisId),
      searchWebForSimilarContent(extracted.text, extracted.quality),
    ]);

    if (extracted.text.length < 50 && repositoryDocs.every((doc) => doc.hash !== extracted.hash)) {
      const fallback = buildFallbackSummary({
        similarity: 0,
        matchedSources: [],
        repositoryDocsCompared: repositoryDocs.length,
        webSourcesCompared: webSources.length,
        extractionMethod: extracted.method,
        quality: extracted.quality,
      });

      await supabase
        .from("analyses")
        .update({
          status: "completed",
          similarity_percentage: 0,
          risk_level: "low",
          original_percentage: 100,
          citations_percentage: 0,
          suspicious_percentage: 0,
          matched_sources: [],
          word_count: wordCount,
          ai_report: fallback,
        })
        .eq("id", analysisId);

      return new Response(JSON.stringify({ success: true, analysisId, message: "Limited text extracted" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const repositoryAnalysis = analyzeSources(extracted.text, extracted.hash, repositoryDocs);
    const webAnalysis = analyzeSources(extracted.text, extracted.hash, webSources);

    const allMatchedSources = [...repositoryAnalysis.matchedSources, ...webAnalysis.matchedSources]
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 12);

    const similarity = clamp(
      Math.max(repositoryAnalysis.similarity, webAnalysis.similarity),
      0,
      repositoryAnalysis.matchedSources.some((source) => source.type === "internal" && source.similarity === 100) ? 100 : 95,
    );
    const citationsPercentage = detectCitationPercentage(extracted.text);
    const suspiciousPercentage = clamp(Math.max(similarity - Math.round(citationsPercentage * 0.35), similarity > 0 ? 5 : 0), 0, 100);
    const originalPercentage = clamp(100 - similarity, 0, 100);
    const riskLevel = buildRiskLevel(similarity);

    const fallbackNarrative = buildFallbackSummary({
      similarity,
      matchedSources: allMatchedSources,
      repositoryDocsCompared: repositoryDocs.length,
      webSourcesCompared: webSources.length,
      extractionMethod: extracted.method,
      quality: extracted.quality,
    });

    const aiNarrative = await enhanceSummaryWithAi(lovableApiKey, {
      title: analysis.title,
      author: analysis.author,
      similarity,
      riskLevel,
      matchedSources: allMatchedSources,
      repositoryDocsCompared: repositoryDocs.length,
      webSourcesCompared: webSources.length,
    });

    const finalNarrative = aiNarrative || fallbackNarrative;

    const { error: updateError } = await supabase
      .from("analyses")
      .update({
        status: "completed",
        similarity_percentage: similarity,
        risk_level: riskLevel,
        original_percentage: originalPercentage,
        citations_percentage: citationsPercentage,
        suspicious_percentage: suspiciousPercentage,
        matched_sources: allMatchedSources,
        word_count: wordCount,
        ai_report: {
          summary: finalNarrative.summary,
          recommendations: finalNarrative.recommendations,
          extraction_method: extracted.method,
          extraction_quality: extracted.quality,
          web_sources_searched: webSources.length,
          repository_docs_compared: repositoryDocs.length,
        },
      })
      .eq("id", analysisId);

    if (updateError) {
      console.error("Error updating analysis:", updateError);
      throw new Error("Failed to save analysis results");
    }

    return new Response(JSON.stringify({
      success: true,
      analysisId,
      report: {
        similarity_percentage: similarity,
        risk_level: riskLevel,
        matched_sources: allMatchedSources,
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("analyze-document error:", error);
    if (supabase && analysisId) {
      await updateAnalysisError(
        supabase,
        analysisId,
        error instanceof Error ? error.message : "Ocorreu um erro inesperado durante a análise.",
      );
    }

    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
