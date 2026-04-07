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

function getSeverityLabel(severity: string, lang: string = 'es'): string {
  const labels: Record<string, Record<string, string>> = {
    es: { critical: "CRÍTICO", high: "ALTO", medium: "MEDIO", low: "BAJO" },
    en: { critical: "CRITICAL", high: "HIGH", medium: "MEDIUM", low: "LOW" },
  };
  return labels[lang]?.[severity] || severity.toUpperCase();
}

function getRiskLabel(risk: string | null, lang: string = 'es'): string {
  const labels: Record<string, Record<string, string>> = {
    es: { critical: "CRÍTICO", high: "ALTO", medium: "MEDIO", low: "BAJO" },
    en: { critical: "CRITICAL", high: "HIGH", medium: "MEDIUM", low: "LOW" },
  };
  return labels[lang]?.[risk || 'unknown'] || "N/A";
}

export async function generateAndStorePdfReport(
  scan: Scan,
  vulnerabilities: Vulnerability[],
  user: User | undefined,
  language: string = 'es'
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

  const pdfBuffer = await generatePdfBuffer(scan, vulnerabilities, user, executiveSummary, language || 'es');

  const fileKey = `reports/scan-${scan.id}-${Date.now()}.pdf`;
  const { url } = await storagePut(fileKey, pdfBuffer, "application/pdf");

  return url;
}

async function generatePdfBuffer(
  scan: Scan,
  vulnerabilities: Vulnerability[],
  user: User | undefined,
  executiveSummary: string,
  language: string = 'es'
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
      info: {
        Title: language === 'en' ? `Security Report - ${scan.url}` : `Informe de Seguridad - ${scan.url}`,
        Author: "SecuraScan",
        Subject: language === 'en' ? "Automated Pentesting Report" : "Informe de Pentesting Automatizado",
        Keywords: language === 'en' ? "security, vulnerabilities, pentesting, OWASP" : "seguridad, vulnerabilidades, pentesting, OWASP",
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", chunk => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width - 100;
    const locale = language === 'en' ? 'en-US' : 'es-ES';
    const scanDate = new Date(scan.createdAt).toLocaleDateString(locale, {
      year: "numeric", month: "long", day: "numeric",
    });
    
    // Translation strings
    const t: Record<string, Record<string, string>> = {
      es: {
        title: "INFORME DE SEGURIDAD",
        subtitle: "Análisis de Vulnerabilidades Web",
        site_analyzed: "SITIO ANALIZADO",
        analysis_date: "Fecha de análisis:",
        security_score: "SECURITY SCORE",
        risk_level: "NIVEL DE RIESGO",
        vulnerabilities: "VULNERABILIDADES",
        executive_summary: "RESUMEN EJECUTIVO",
        details: "DETALLES TÉCNICOS",
        critical: "CRÍTICO",
        high: "ALTO",
        medium: "MEDIO",
        low: "BAJO",
        vulnerability_distribution: "Distribución de Vulnerabilidades",
        severity: "Severidad",
        quantity: "Cantidad",
        percentage: "Porcentaje",
        impact: "Impacto",
        immediate_action: "Acción inmediata",
        urgent: "Urgente",
        plan: "Planificar",
        monitor: "Monitorear",
        description: "Descripción",
        detection_method: "Método de detección",
        potential_impact: "Impacto potencial",
        technical_details: "Detalles técnicos",
        how_to_fix: "Cómo solucionarlo",
        owasp_reference: "Referencia OWASP",
        cvss_score: "CVSS Score",
        evidence: "Evidencia",
        ai_explanation: "Explicación para no técnicos (IA)",
        general_recommendations: "RECOMENDACIONES GENERALES",
        confidential_footer: "Este informe es confidencial y está destinado únicamente al propietario del sitio analizado.",
        rights_reserved: "SecuraScan © 2025 - Todos los derechos reservados",
        generated_by: "Informe generado por SecuraScan el",
        confidential_notice: "Este documento es confidencial. No distribuir sin autorización del propietario.",
        vulnerability: "VULNERABILIDAD",
        of: "DE",
      },
      en: {
        title: "SECURITY REPORT",
        subtitle: "Web Vulnerability Analysis",
        site_analyzed: "ANALYZED SITE",
        analysis_date: "Analysis date:",
        security_score: "SECURITY SCORE",
        risk_level: "RISK LEVEL",
        vulnerabilities: "VULNERABILITIES",
        executive_summary: "EXECUTIVE SUMMARY",
        details: "TECHNICAL DETAILS",
        critical: "CRITICAL",
        high: "HIGH",
        medium: "MEDIUM",
        low: "LOW",
        vulnerability_distribution: "Vulnerability Distribution",
        severity: "Severity",
        quantity: "Quantity",
        percentage: "Percentage",
        impact: "Impact",
        immediate_action: "Immediate action",
        urgent: "Urgent",
        plan: "Plan",
        monitor: "Monitor",
        description: "Description",
        detection_method: "Detection Method",
        potential_impact: "Potential Impact",
        technical_details: "Technical Details",
        how_to_fix: "How to Fix",
        owasp_reference: "OWASP Reference",
        cvss_score: "CVSS Score",
        evidence: "Evidence",
        ai_explanation: "Non-Technical Explanation (AI)",
        general_recommendations: "GENERAL RECOMMENDATIONS",
        confidential_footer: "This report is confidential and intended solely for the owner of the analyzed site.",
        rights_reserved: "SecuraScan © 2025 - All rights reserved",
        generated_by: "Report generated by SecuraScan on",
        confidential_notice: "This document is confidential. Do not distribute without authorization from the owner.",
        vulnerability: "VULNERABILITY",
        of: "OF",
      },
    };
    const texts = t[language] || t.es;

    // ─── Cover Page ──────────────────────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, doc.page.height).fill("#0a0a0f");

    // Header bar
    doc.rect(0, 0, doc.page.width, 8).fill("#6366f1");

    // Logo area
    doc.fontSize(32).fillColor("#6366f1").font("Helvetica-Bold").text("SecuraScan", 50, 80);
    doc.fontSize(11).fillColor("#64748b").font("Helvetica").text(language === 'en' ? "Automated Pentesting Platform" : "Plataforma de Pentesting Automatizado", 50, 120);

    // Title
    doc.moveDown(4);
    doc.fontSize(28).fillColor("#e2e8f0").font("Helvetica-Bold").text(texts.title, 50, 200);
    doc.fontSize(14).fillColor("#94a3b8").font("Helvetica").text(texts.subtitle, 50, 240);

    // Target info box
    doc.rect(50, 280, pageWidth, 80).fill("#111118").stroke("#1e293b");
    doc.fontSize(10).fillColor("#64748b").font("Helvetica").text(texts.site_analyzed, 70, 295);
    doc.fontSize(14).fillColor("#e2e8f0").font("Helvetica-Bold").text(scan.url, 70, 312, { width: pageWidth - 40 });
    doc.fontSize(10).fillColor("#64748b").font("Helvetica").text(`${texts.analysis_date} ${scanDate}`, 70, 340);

    // Security Score
    const score = scan.securityScore ?? 0;
    const scoreColor = score >= 80 ? "#22c55e" : score >= 60 ? "#eab308" : score >= 40 ? "#f97316" : "#ef4444";
    doc.rect(50, 380, pageWidth, 100).fill("#111118").stroke("#1e293b");
    doc.fontSize(12).fillColor("#64748b").font("Helvetica").text(texts.security_score, 70, 395);
    doc.fontSize(48).fillColor(scoreColor).font("Helvetica-Bold").text(`${score}`, 70, 410);
    const scoreWidth = String(score).length * 28;
    doc.fontSize(20).fillColor("#64748b").font("Helvetica").text("/100", 70 + scoreWidth + 5, 430);

    // Risk level
    const riskColor = getSeverityColor(scan.riskLevel ?? "low");
    doc.fontSize(12).fillColor("#64748b").font("Helvetica").text(texts.risk_level, 250, 395);
    doc.fontSize(24).fillColor(riskColor).font("Helvetica-Bold").text(getRiskLabel(scan.riskLevel, language), 250, 415);

    // Vulnerability counts
    doc.rect(50, 500, pageWidth, 70).fill("#111118").stroke("#1e293b");
    const countBoxWidth = pageWidth / 4;
    const counts = [
      { label: texts.critical, count: scan.criticalCount, color: "#ef4444" },
      { label: texts.high, count: scan.highCount, color: "#f97316" },
      { label: texts.medium, count: scan.mediumCount, color: "#eab308" },
      { label: texts.low, count: scan.lowCount, color: "#3b82f6" },
    ];
    counts.forEach((c, i) => {
      const x = 50 + i * countBoxWidth + 20;
      doc.fontSize(9).fillColor("#64748b").font("Helvetica").text(c.label, x, 515);
      doc.fontSize(28).fillColor(c.color).font("Helvetica-Bold").text(String(c.count), x, 530);
    });

    // Footer
    doc.fontSize(9).fillColor("#334155").font("Helvetica")
      .text(texts.confidential_footer, 50, 750, { align: "center", width: pageWidth });
    doc.fontSize(9).fillColor("#334155").text(texts.rights_reserved, 50, 765, { align: "center", width: pageWidth });

    // ─── Executive Summary Page ───────────────────────────────────────────────────
    doc.addPage();
    doc.rect(0, 0, doc.page.width, doc.page.height).fill("#0a0a0f");
    doc.rect(0, 0, doc.page.width, 8).fill("#6366f1");

    doc.fontSize(20).fillColor("#e2e8f0").font("Helvetica-Bold").text(texts.executive_summary, 50, 40);
    doc.rect(50, 70, 60, 3).fill("#6366f1");

    doc.fontSize(11).fillColor("#94a3b8").font("Helvetica")
      .text(executiveSummary, 50, 90, { width: pageWidth, lineGap: 6 });

    // Vulnerability distribution table
    let tableY = doc.y + 40;
    if (tableY > 650) {
      doc.addPage();
      doc.rect(0, 0, doc.page.width, doc.page.height).fill("#0a0a0f");
      doc.rect(0, 0, doc.page.width, 8).fill("#6366f1");
      tableY = 50;
    }

    doc.fontSize(14).fillColor("#e2e8f0").font("Helvetica-Bold").text(texts.vulnerability_distribution, 50, tableY);
    doc.rect(50, tableY + 25, pageWidth, 30).fill("#1e293b");
    doc.fontSize(10).fillColor("#94a3b8").font("Helvetica-Bold")
      .text(texts.severity, 60, tableY + 35)
      .text(texts.quantity, 200, tableY + 35)
      .text(texts.percentage, 300, tableY + 35)
      .text(texts.impact, 420, tableY + 35);

    const severityLabels = language === 'en' ? 
      [{ label: "Critical", count: scan.criticalCount, color: "#ef4444" },
       { label: "High", count: scan.highCount, color: "#f97316" },
       { label: "Medium", count: scan.mediumCount, color: "#eab308" },
       { label: "Low", count: scan.lowCount, color: "#3b82f6" }] :
      [{ label: "Crítico", count: scan.criticalCount, color: "#ef4444" },
       { label: "Alto", count: scan.highCount, color: "#f97316" },
       { label: "Medio", count: scan.mediumCount, color: "#eab308" },
       { label: "Bajo", count: scan.lowCount, color: "#3b82f6" }];

    const impactLabels = language === 'en' ?
      { critical: "Immediate action", high: "Urgent", medium: "Plan", low: "Monitor" } :
      { critical: "Acción inmediata", high: "Urgente", medium: "Planificar", low: "Monitorear" };

    severityLabels.forEach((row, i) => {
      const rowY = tableY + 55 + i * 28;
      if (i % 2 === 0) doc.rect(50, rowY - 8, pageWidth, 28).fill("#0d0d14");
      const pct = scan.totalVulnerabilities > 0 ? ((row.count / scan.totalVulnerabilities) * 100).toFixed(1) : "0.0";
      const severityKey = ['critical', 'high', 'medium', 'low'][i];
      const impact = impactLabels[severityKey as keyof typeof impactLabels];
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
      doc.fontSize(8).fillColor("#64748b").font("Helvetica").text(`${texts.vulnerability} ${index + 1} ${texts.of} ${vulnerabilities.length}`, 65, 28);
      doc.fontSize(16).fillColor("#e2e8f0").font("Helvetica-Bold").text(vuln.name, 65, 42, { width: pageWidth - 120 });
      doc.rect(pageWidth - 50, 28, 90, 24).fill(severityColor);
      doc.fontSize(10).fillColor("#ffffff").font("Helvetica-Bold").text(getSeverityLabel(vuln.severity, language), pageWidth - 45, 34);

      let yPos = 100;

      const addSection = (title: string, content: string | null | undefined) => {
        if (!content) return;
        
        // Check if we need a new page
        if (yPos > 700) {
          doc.addPage();
          doc.rect(0, 0, doc.page.width, doc.page.height).fill("#0a0a0f");
          doc.rect(0, 0, doc.page.width, 8).fill(getSeverityColor(vuln.severity));
          yPos = 50;
        }
        
        doc.fontSize(10).fillColor("#6366f1").font("Helvetica-Bold").text(title.toUpperCase(), 50, yPos);
        yPos += 18;
        doc.fontSize(10).fillColor("#94a3b8").font("Helvetica").text(content, 50, yPos, { width: pageWidth, lineGap: 4 });
        yPos = doc.y + 15;
      };

      addSection(texts.description, vuln.description);
      addSection(texts.detection_method, vuln.detectionMethod);
      addSection(texts.potential_impact, vuln.impact);
      addSection(texts.technical_details, vuln.technicalDetails);
      addSection(texts.how_to_fix, vuln.remediation);
      addSection(texts.owasp_reference, vuln.owaspReference);
      if (vuln.cvssScore) addSection(texts.cvss_score, `${vuln.cvssScore}/10`);
      addSection(texts.evidence, vuln.evidence);

      if (vuln.aiExplanationBasic) {
        addSection(texts.ai_explanation, vuln.aiExplanationBasic);
      }
    });

    // ─── Final Page ───────────────────────────────────────────────────────────────
    doc.addPage();
    doc.rect(0, 0, doc.page.width, doc.page.height).fill("#0a0a0f");
    doc.rect(0, 0, doc.page.width, 8).fill("#6366f1");

    doc.fontSize(20).fillColor("#e2e8f0").font("Helvetica-Bold").text(texts.general_recommendations, 50, 40);
    doc.rect(50, 70, 60, 3).fill("#6366f1");

    const recommendations = language === 'en' ? [
      "Address all critical and high-severity vulnerabilities immediately before continuing development.",
      "Implement a secure software development lifecycle (SSDLC) that includes security reviews in each sprint.",
      "Configure all HTTP security headers recommended by OWASP.",
      "Establish a policy for regular updates to all components and dependencies.",
      "Implement continuous security monitoring and incident alerts.",
      "Conduct periodic penetration testing (at least quarterly) to detect new vulnerabilities.",
      "Train the development team on security best practices (OWASP Top 10).",
      "Implement a vulnerability management program with SLAs defined by severity.",
    ] : [
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
      if (recY > 700) {
        doc.addPage();
        doc.rect(0, 0, doc.page.width, doc.page.height).fill("#0a0a0f");
        doc.rect(0, 0, doc.page.width, 8).fill("#6366f1");
        recY = 50;
      }
      doc.rect(50, recY, 6, 6).fill("#6366f1");
      doc.fontSize(10).fillColor("#94a3b8").font("Helvetica").text(rec, 65, recY - 2, { width: pageWidth - 20 });
      recY = doc.y + 10;
    });

    doc.fontSize(10).fillColor("#334155").font("Helvetica")
      .text("─".repeat(80), 50, 720)
      .text(`${texts.generated_by} ${scanDate} | scan.securascan.com`, 50, 735, { align: "center", width: pageWidth })
      .text(texts.confidential_notice, 50, 750, { align: "center", width: pageWidth });

    doc.end();
  });
}
