import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { analysisId } = await req.json();
    if (!analysisId) {
      return new Response(JSON.stringify({ error: "analysisId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get the analysis record
    const { data: analysis, error: fetchError } = await supabase
      .from("analyses")
      .select("*")
      .eq("id", analysisId)
      .single();

    if (fetchError || !analysis) {
      throw new Error("Analysis not found");
    }

    // Update status to processing
    await supabase
      .from("analyses")
      .update({ status: "processing" })
      .eq("id", analysisId);

    // Download the file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("documents")
      .download(analysis.file_path);

    if (downloadError || !fileData) {
      await supabase
        .from("analyses")
        .update({ status: "error" })
        .eq("id", analysisId);
      throw new Error("Failed to download file");
    }

    // Extract text content from the file
    let textContent = "";
    if (analysis.file_type === "text/plain") {
      textContent = await fileData.text();
    } else {
      // For PDF/DOCX, read as text (basic extraction)
      textContent = await fileData.text();
    }

    // Limit text to avoid token limits
    const maxChars = 15000;
    const truncatedText = textContent.substring(0, maxChars);
    const wordCount = truncatedText.split(/\s+/).filter(Boolean).length;

    // Call Lovable AI for plagiarism analysis
    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: `Você é um sistema especializado em detecção de plágio académico para a Universidade Mandume Ya Ndemufayo. 
Analise o texto fornecido e forneça um relatório detalhado de originalidade.
Responda SEMPRE usando a tool "plagiarism_report".`,
            },
            {
              role: "user",
              content: `Analise o seguinte texto académico quanto a originalidade e possível plágio. Título: "${analysis.title}". Autor: "${analysis.author || 'Não especificado'}".

TEXTO:
${truncatedText}`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "plagiarism_report",
                description:
                  "Retorna o relatório de análise de plágio estruturado.",
                parameters: {
                  type: "object",
                  properties: {
                    similarity_percentage: {
                      type: "number",
                      description:
                        "Percentagem estimada de similaridade com outras fontes (0-100)",
                    },
                    risk_level: {
                      type: "string",
                      enum: ["low", "medium", "high"],
                      description: "Nível de risco de plágio",
                    },
                    original_percentage: {
                      type: "number",
                      description: "Percentagem de conteúdo original",
                    },
                    citations_percentage: {
                      type: "number",
                      description:
                        "Percentagem de conteúdo que parece ser citação",
                    },
                    suspicious_percentage: {
                      type: "number",
                      description:
                        "Percentagem de conteúdo suspeito de plágio",
                    },
                    summary: {
                      type: "string",
                      description:
                        "Resumo geral da análise em português",
                    },
                    matched_sources: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          title: { type: "string" },
                          type: {
                            type: "string",
                            enum: ["academic", "external", "internal"],
                          },
                          similarity: { type: "number" },
                          matched_text: { type: "string" },
                          original_text: { type: "string" },
                        },
                        required: [
                          "title",
                          "type",
                          "similarity",
                          "matched_text",
                          "original_text",
                        ],
                      },
                      description:
                        "Lista de fontes com correspondências encontradas",
                    },
                    recommendations: {
                      type: "array",
                      items: { type: "string" },
                      description:
                        "Lista de recomendações para melhorar a originalidade",
                    },
                  },
                  required: [
                    "similarity_percentage",
                    "risk_level",
                    "original_percentage",
                    "citations_percentage",
                    "suspicious_percentage",
                    "summary",
                    "matched_sources",
                    "recommendations",
                  ],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "plagiarism_report" },
          },
        }),
      }
    );

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        await supabase
          .from("analyses")
          .update({ status: "error" })
          .eq("id", analysisId);
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        await supabase
          .from("analyses")
          .update({ status: "error" })
          .eq("id", analysisId);
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", status, errText);
      await supabase
        .from("analyses")
        .update({ status: "error" })
        .eq("id", analysisId);
      throw new Error("AI analysis failed");
    }

    const aiResult = await aiResponse.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      await supabase
        .from("analyses")
        .update({ status: "error" })
        .eq("id", analysisId);
      throw new Error("AI did not return structured output");
    }

    const report = JSON.parse(toolCall.function.arguments);

    // Update the analysis with AI results
    const { error: updateError } = await supabase
      .from("analyses")
      .update({
        status: "completed",
        similarity_percentage: report.similarity_percentage,
        risk_level: report.risk_level,
        original_percentage: report.original_percentage,
        citations_percentage: report.citations_percentage,
        suspicious_percentage: report.suspicious_percentage,
        matched_sources: report.matched_sources,
        word_count: wordCount,
        ai_report: {
          summary: report.summary,
          recommendations: report.recommendations,
        },
      })
      .eq("id", analysisId);

    if (updateError) {
      console.error("Error updating analysis:", updateError);
      throw new Error("Failed to save analysis results");
    }

    return new Response(
      JSON.stringify({ success: true, analysisId, report }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("analyze-document error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
