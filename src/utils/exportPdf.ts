import jsPDF from "jspdf";

interface PdfReportData {
  title: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  wordCount: number;
  similarityPercentage: number;
  originalPercentage: number;
  citationsPercentage: number;
  suspiciousPercentage: number;
  riskLevel: string;
  matchedSources: { title: string; similarity: number; matched_text?: string }[];
  recommendations: string[];
  summary: string;
}

export function exportReportPdf(data: PdfReportData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  const checkPage = (needed: number) => {
    if (y + needed > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      y = 20;
    }
  };

  // Header
  doc.setFillColor(26, 54, 93); // primary navy
  doc.rect(0, 0, pageWidth, 40, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Relatório de Análise de Plágio", margin, 18);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Universidade Mandume Ya Ndemufayo — Revista Académica", margin, 28);
  doc.text(`Gerado em: ${new Date().toLocaleString("pt-PT")}`, margin, 35);

  y = 50;
  doc.setTextColor(30, 30, 30);

  // Document Info
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Informações do Documento", margin, y);
  y += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const info = [
    ["Título", data.title],
    ["Autor", data.author],
    ["Data de Submissão", new Date(data.createdAt).toLocaleDateString("pt-PT")],
    ["Análise Concluída", new Date(data.updatedAt).toLocaleString("pt-PT")],
    ["Palavras", data.wordCount.toLocaleString()],
  ];

  info.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(String(value), margin + 45, y);
    y += 6;
  });

  y += 6;

  // Similarity Results
  checkPage(40);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Resultados de Similaridade", margin, y);
  y += 10;

  // Similarity box
  doc.setFillColor(240, 244, 248);
  doc.roundedRect(margin, y - 4, contentWidth, 30, 3, 3, "F");

  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  const simColor = data.similarityPercentage > 30 ? [220, 50, 50] : data.similarityPercentage > 15 ? [200, 150, 30] : [40, 160, 80];
  doc.setTextColor(simColor[0], simColor[1], simColor[2]);
  doc.text(`${data.similarityPercentage}%`, margin + 8, y + 12);

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("Similaridade Total", margin + 35, y + 8);

  const riskLabels: Record<string, string> = { low: "Baixo Risco", medium: "Risco Médio", high: "Alto Risco" };
  doc.text(`Nível de Risco: ${riskLabels[data.riskLevel] || data.riskLevel}`, margin + 35, y + 16);

  y += 34;

  // Percentages breakdown
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(10);
  const breakdown = [
    ["Original", `${data.originalPercentage}%`],
    ["Citações", `${data.citationsPercentage}%`],
    ["Suspeito", `${data.suspiciousPercentage}%`],
  ];
  breakdown.forEach(([label, val]) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(val, margin + 30, y);
    y += 6;
  });

  y += 6;

  // Summary
  if (data.summary) {
    checkPage(20);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Resumo da Análise", margin, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(data.summary, contentWidth);
    checkPage(lines.length * 5);
    doc.text(lines, margin, y);
    y += lines.length * 5 + 6;
  }

  // Recommendations
  if (data.recommendations.length > 0) {
    checkPage(20);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Recomendações", margin, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    data.recommendations.forEach((rec, i) => {
      const lines = doc.splitTextToSize(`${i + 1}. ${rec}`, contentWidth - 5);
      checkPage(lines.length * 5 + 2);
      doc.text(lines, margin, y);
      y += lines.length * 5 + 2;
    });
    y += 4;
  }

  // Matched Sources
  if (data.matchedSources.length > 0) {
    checkPage(20);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`Fontes Identificadas (${data.matchedSources.length})`, margin, y);
    y += 8;
    doc.setFontSize(10);

    data.matchedSources.forEach((source, i) => {
      checkPage(18);
      doc.setFont("helvetica", "bold");
      doc.text(`${i + 1}. ${source.title}`, margin, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text(`— ${source.similarity}% de correspondência`, margin + doc.getTextWidth(`${i + 1}. ${source.title}`) + 3, y);
      doc.setTextColor(30, 30, 30);
      y += 6;

      if (source.matched_text) {
        const lines = doc.splitTextToSize(`"${source.matched_text}"`, contentWidth - 10);
        checkPage(lines.length * 5);
        doc.setTextColor(120, 120, 120);
        doc.text(lines, margin + 5, y);
        doc.setTextColor(30, 30, 30);
        y += lines.length * 5 + 4;
      }
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Página ${i} de ${pageCount} — Universidade Mandume Ya Ndemufayo`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  doc.save(`relatorio-${data.title.replace(/\s+/g, "-").toLowerCase()}.pdf`);
}
