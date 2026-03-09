import PDFDocument from "pdfkit";
import { storagePut } from "./storage";
import { generateExecutiveSummary } from "./aiExplainer";
import type { Scan, Vulnerability, User } from "../drizzle/schema";

const COLORS = {
  primary: "#6366f1",
  background: "#0a0a0f",
  cardBg: "#111118",
  text: "#e2e8f0",
  muted: "#64748b",
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#3b82f6",
  success: "#22c55e",
  border: "#1e293b",
};

function getSeverityColor(severity: string): string {
  switch (severity) {
    case "critical": return COLORS.critical;
    case "high": return COLORS.high;
    case "medium": return COLORS.medium;
    case "low": return COLORS.low;
    default: return COLORS.muted;
  }
}

function getSeverityLabel(severity: string): string {
  switch (severity) {
    case "critical": return "CRÍTICO";
    case "high": return "ALTO";
    case "medium": return "MEDIO";
    case "low": return "BAJO";
    default: return severity.toUpperCase();
  }
}

function getRiskLabel(risk: string | null): string {
  switch (risk) {
    case "critical": return "CRÍTICO";
    case "high": return "ALTO";
    case "medium": return "MEDIO";
    case "low": return "BAJO";
    default: return "N/A";
  }
}

export async function generateAndStorePdfReport(
  scan: Scan,
  vulnerabilities: Vulnerability[],
  user: User | undefined
): Promise<string> {
  const executiveSummary = await generateExecutiveSummary(
    scan.url,
    scan.securityScore ?? 0,
    scan.riskLevel ?? "unknown",
    scan.criticalCount,
    scan.highCount,
    scan.mediumCount,
    scan.lowCount,
    scan.totalVulnerabilities
  );

  const pdfBuffer = await generatePdfBuffer(scan, vulnerabilities, user, executiveSummary);

  const fileKey = `reports/scan-${scan.id}-${Date.now()}.pdf`;
  const { url } = await storagePut(fileKey, pdfBuffer, "application/pdf");

  return url;
}

async function generatePdfBuffer(
  scan: Scan,
  vulnerabilities: Vulnerability[],
  user: User | undefined,
  executiveSummary: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
      info: {
        Title: `Informe de Seguridad - ${scan.url}`,
        Author: "SecuraScan",
        Subject: "Informe de Pentesting Automatizado",
        Keywords: "seguridad, vulnerabilidades, pentesting, OWASP",
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", chunk => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width - 100;
    const scanDate = new Date(scan.createdAt).toLocaleDateString("es-ES", {
      year: "numeric", month: "long", day: "numeric",
    });

    // ─── Cover Page ──────────────────────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, doc.page.height).fill("#0a0a0f");

    // Header bar
    doc.rect(0, 0, doc.page.width, 8).fill("#6366f1");

    // Logo area
    doc.fontSize(32).fillColor("#6366f1").font("Helvetica-Bold").text("SecuraScan", 50, 80);
    doc.fontSize(11).fillColor("#64748b").font("Helvetica").text("Plataforma de Pentesting Automatizado", 50, 120);

    // Title
    doc.moveDown(4);
    doc.fontSize(28).fillColor("#e2e8f0").font("Helvetica-Bold").text("INFORME DE SEGURIDAD", 50, 200);
    doc.fontSize(14).fillColor("#94a3b8").font("Helvetica").text("Análisis de Vulnerabilidades Web", 50, 240);

    // Target info box
    doc.rect(50, 280, pageWidth, 80).fill("#111118").stroke("#1e293b");
    doc.fontSize(10).fillColor("#64748b").font("Helvetica").text("SITIO ANALIZADO", 70, 295);
    doc.fontSize(14).fillColor("#e2e8f0").font("Helvetica-Bold").text(scan.url, 70, 312, { width: pageWidth - 40 });
    doc.fontSize(10).fillColor("#64748b").font("Helvetica").text(`Fecha de análisis: ${scanDate}`, 70, 340);

    // Security Score
    const score = scan.securityScore ?? 0;
    const scoreColor = score >= 80 ? "#22c55e" : score >= 60 ? "#eab308" : score >= 40 ? "#f97316" : "#ef4444";
    doc.rect(50, 380, pageWidth, 100).fill("#111118").stroke("#1e293b");
    doc.fontSize(12).fillColor("#64748b").font("Helvetica").text("SECURITY SCORE", 70, 395);
    doc.fontSize(48).fillColor(scoreColor).font("Helvetica-Bold").text(`${score}`, 70, 410);
    const scoreWidth = String(score).length * 28;
    doc.fontSize(20).fillColor("#64748b").font("Helvetica").text("/100", 70 + scoreWidth + 5, 430);

    // Risk level
    const riskColor = getSeverityColor(scan.riskLevel ?? "low");
    doc.fontSize(12).fillColor("#64748b").font("Helvetica").text("NIVEL DE RIESGO", 250, 395);
    doc.fontSize(24).fillColor(riskColor).font("Helvetica-Bold").text(getRiskLabel(scan.riskLevel), 250, 415);

    // Vulnerability counts
    doc.rect(50, 500, pageWidth, 70).fill("#111118").stroke("#1e293b");
    const countBoxWidth = pageWidth / 4;
    const counts = [
      { label: "CRÍTICO", count: scan.criticalCount, color: "#ef4444" },
      { label: "ALTO", count: scan.highCount, color: "#f97316" },
      { label: "MEDIO", count: scan.mediumCount, color: "#eab308" },
      { label: "BAJO", count: scan.lowCount, color: "#3b82f6" },
    ];
    counts.forEach((c, i) => {
      const x = 50 + i * countBoxWidth + 20;
      doc.fontSize(9).fillColor("#64748b").font("Helvetica").text(c.label, x, 515);
      doc.fontSize(28).fillColor(c.color).font("Helvetica-Bold").text(String(c.count), x, 530);
    });

    // Footer
    doc.fontSize(9).fillColor("#334155").font("Helvetica")
      .text("Este informe es confidencial y está destinado únicamente al propietario del sitio analizado.", 50, 750, { align: "center", width: pageWidth });
    doc.fontSize(9).fillColor("#334155").text("SecuraScan © 2025 - Todos los derechos reservados", 50, 765, { align: "center", width: pageWidth });

    // ─── Executive Summary Page ───────────────────────────────────────────────────
    doc.addPage();
    doc.rect(0, 0, doc.page.width, doc.page.height).fill("#0a0a0f");
    doc.rect(0, 0, doc.page.width, 8).fill("#6366f1");

    doc.fontSize(20).fillColor("#e2e8f0").font("Helvetica-Bold").text("RESUMEN EJECUTIVO", 50, 40);
    doc.rect(50, 70, 60, 3).fill("#6366f1");

    doc.moveDown(2);
    doc.fontSize(11).fillColor("#94a3b8").font("Helvetica")
      .text(executiveSummary, 50, 90, { width: pageWidth, lineGap: 6 });

    // Vulnerability distribution table
    const tableY = doc.y + 30;
    doc.fontSize(14).fillColor("#e2e8f0").font("Helvetica-Bold").text("Distribución de Vulnerabilidades", 50, tableY);
    doc.rect(50, tableY + 25, pageWidth, 30).fill("#1e293b");
    doc.fontSize(10).fillColor("#94a3b8").font("Helvetica-Bold")
      .text("Severidad", 60, tableY + 35)
      .text("Cantidad", 200, tableY + 35)
      .text("Porcentaje", 300, tableY + 35)
      .text("Impacto", 420, tableY + 35);

    const rows = [
      { label: "Crítico", count: scan.criticalCount, color: "#ef4444" },
      { label: "Alto", count: scan.highCount, color: "#f97316" },
      { label: "Medio", count: scan.mediumCount, color: "#eab308" },
      { label: "Bajo", count: scan.lowCount, color: "#3b82f6" },
    ];

    rows.forEach((row, i) => {
      const rowY = tableY + 55 + i * 28;
      if (i % 2 === 0) doc.rect(50, rowY - 8, pageWidth, 28).fill("#0d0d14");
      const pct = scan.totalVulnerabilities > 0 ? ((row.count / scan.totalVulnerabilities) * 100).toFixed(1) : "0.0";
      const impact = row.label === "Crítico" ? "Acción inmediata" : row.label === "Alto" ? "Urgente" : row.label === "Medio" ? "Planificar" : "Monitorear";
      doc.fontSize(10).fillColor(row.color).font("Helvetica-Bold").text(row.label, 60, rowY);
      doc.fillColor("#e2e8f0").font("Helvetica");
      doc.text(String(row.count), 200, rowY);
      doc.text(`${pct}%`, 300, rowY);
      doc.text(impact, 420, rowY);
    });

    // ─── Vulnerabilities Detail Pages ─────────────────────────────────────────────
    vulnerabilities.forEach((vuln, index) => {
      doc.addPage();
      doc.rect(0, 0, doc.page.width, doc.page.height).fill("#0a0a0f");
      doc.rect(0, 0, doc.page.width, 8).fill(getSeverityColor(vuln.severity));

      // Header
      const severityColor = getSeverityColor(vuln.severity);
      doc.rect(50, 20, pageWidth, 60).fill("#111118").stroke("#1e293b");
      doc.fontSize(8).fillColor("#64748b").font("Helvetica").text(`VULNERABILIDAD ${index + 1} DE ${vulnerabilities.length}`, 65, 28);
      doc.fontSize(16).fillColor("#e2e8f0").font("Helvetica-Bold").text(vuln.name, 65, 42, { width: pageWidth - 120 });
      doc.rect(pageWidth - 50, 28, 90, 24).fill(severityColor);
      doc.fontSize(10).fillColor("#ffffff").font("Helvetica-Bold").text(getSeverityLabel(vuln.severity), pageWidth - 45, 34);

      let yPos = 100;

      const addSection = (title: string, content: string | null | undefined) => {
        if (!content) return;
        doc.fontSize(10).fillColor("#6366f1").font("Helvetica-Bold").text(title.toUpperCase(), 50, yPos);
        yPos += 18;
        doc.fontSize(10).fillColor("#94a3b8").font("Helvetica").text(content, 50, yPos, { width: pageWidth, lineGap: 4 });
        yPos = doc.y + 15;
        if (yPos > 720) {
          doc.addPage();
          doc.rect(0, 0, doc.page.width, doc.page.height).fill("#0a0a0f");
          yPos = 50;
        }
      };

      addSection("Descripción", vuln.description);
      addSection("Método de detección", vuln.detectionMethod);
      addSection("Impacto potencial", vuln.impact);
      addSection("Detalles técnicos", vuln.technicalDetails);
      addSection("Cómo solucionarlo", vuln.remediation);
      addSection("Referencia OWASP", vuln.owaspReference);
      if (vuln.cvssScore) addSection("CVSS Score", `${vuln.cvssScore}/10`);
      addSection("Evidencia", vuln.evidence);

      if (vuln.aiExplanationBasic) {
        addSection("Explicación para no técnicos (IA)", vuln.aiExplanationBasic);
      }
    });

    // ─── Final Page ───────────────────────────────────────────────────────────────
    doc.addPage();
    doc.rect(0, 0, doc.page.width, doc.page.height).fill("#0a0a0f");
    doc.rect(0, 0, doc.page.width, 8).fill("#6366f1");

    doc.fontSize(20).fillColor("#e2e8f0").font("Helvetica-Bold").text("RECOMENDACIONES GENERALES", 50, 40);
    doc.rect(50, 70, 60, 3).fill("#6366f1");

    const recommendations = [
      "Abordar inmediatamente todas las vulnerabilidades críticas y altas antes de continuar con el desarrollo.",
      "Implementar un ciclo de desarrollo seguro (SSDLC) que incluya revisiones de seguridad en cada sprint.",
      "Configurar todos los headers de seguridad HTTP recomendados por OWASP.",
      "Establecer una política de actualizaciones regulares para todos los componentes y dependencias.",
      "Implementar monitorización continua de seguridad y alertas ante incidentes.",
      "Realizar pruebas de penetración periódicas (al menos trimestrales) para detectar nuevas vulnerabilidades.",
      "Formar al equipo de desarrollo en buenas prácticas de seguridad (OWASP Top 10).",
      "Implementar un programa de gestión de vulnerabilidades con SLAs definidos por severidad.",
    ];

    let recY = 90;
    recommendations.forEach((rec, i) => {
      doc.rect(50, recY, 6, 6).fill("#6366f1");
      doc.fontSize(10).fillColor("#94a3b8").font("Helvetica").text(rec, 65, recY - 2, { width: pageWidth - 20 });
      recY = doc.y + 10;
    });

    doc.fontSize(10).fillColor("#334155").font("Helvetica")
      .text("─".repeat(80), 50, 720)
      .text(`Informe generado por SecuraScan el ${scanDate} | scan.securascan.com`, 50, 735, { align: "center", width: pageWidth })
      .text("Este documento es confidencial. No distribuir sin autorización del propietario.", 50, 750, { align: "center", width: pageWidth });

    doc.end();
  });
}
