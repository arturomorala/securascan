import { invokeLLM } from "./_core/llm";
import type { Vulnerability } from "../drizzle/schema";

type ExplanationLevel = "basic" | "technical" | "expert";

const LEVEL_PROMPTS: Record<ExplanationLevel, string> = {
  basic: `Eres un experto en ciberseguridad que explica vulnerabilidades a personas sin conocimientos técnicos.
Explica la vulnerabilidad de forma clara y sencilla, como si hablaras con el dueño de un negocio.
Usa analogías del mundo real. Evita tecnicismos. Máximo 3 párrafos.
Estructura: 1) Qué es el problema en términos simples, 2) Por qué es peligroso para el negocio, 3) Qué se puede hacer para solucionarlo (sin tecnicismos).`,

  technical: `Eres un experto en ciberseguridad que explica vulnerabilidades a desarrolladores web.
Explica la vulnerabilidad con detalles técnicos apropiados para un desarrollador.
Incluye: vector de ataque, cómo funciona técnicamente, impacto en el sistema, y pasos concretos de remediación con código si aplica.
Máximo 4 párrafos.`,

  expert: `Eres un pentester senior explicando una vulnerabilidad a otro experto en seguridad.
Proporciona un análisis técnico profundo: vector de ataque completo, payload de ejemplo, impacto en la cadena de ataque, técnicas de explotación avanzadas, y remediación detallada con configuraciones específicas.
Incluye referencias a CVEs relacionados si aplica, y menciona herramientas de explotación conocidas.
Máximo 5 párrafos.`,
};

export async function generateVulnerabilityExplanation(
  vuln: Vulnerability,
  level: ExplanationLevel
): Promise<string> {
  const systemPrompt = LEVEL_PROMPTS[level];

  const userMessage = `Vulnerabilidad detectada:
Nombre: ${vuln.name}
Categoría: ${vuln.category}
Severidad: ${vuln.severity}
Descripción: ${vuln.description}
Evidencia: ${vuln.evidence || "N/A"}
Impacto: ${vuln.impact || "N/A"}
Detalles técnicos: ${vuln.technicalDetails || "N/A"}
Referencia OWASP: ${vuln.owaspReference || "N/A"}
CVSS Score: ${vuln.cvssScore || "N/A"}

Por favor, proporciona una explicación de nivel ${level === "basic" ? "básico (no técnico)" : level === "technical" ? "técnico (para desarrolladores)" : "experto (para pentesters)"}.`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content) throw new Error("No response from LLM");
    return typeof content === "string" ? content : JSON.stringify(content);
  } catch (error) {
    console.error("[AI Explainer] Error generating explanation:", error);
    return `No se pudo generar la explicación automática. Por favor, consulta la documentación de ${vuln.owaspReference || "OWASP"} para más información sobre esta vulnerabilidad.`;
  }
}

export async function generateExecutiveSummary(
  url: string,
  score: number,
  riskLevel: string,
  criticalCount: number,
  highCount: number,
  mediumCount: number,
  lowCount: number,
  totalCount: number
): Promise<string> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "Eres un experto en ciberseguridad redactando el resumen ejecutivo de un informe de pentesting profesional. Escribe en español, de forma clara y profesional. El resumen debe ser apropiado para presentar a directivos y no técnicos.",
        },
        {
          role: "user",
          content: `Redacta un resumen ejecutivo para el informe de pentesting del sitio web "${url}".
Datos del análisis:
- Security Score: ${score}/100
- Nivel de riesgo general: ${riskLevel}
- Vulnerabilidades críticas: ${criticalCount}
- Vulnerabilidades altas: ${highCount}
- Vulnerabilidades medias: ${mediumCount}
- Vulnerabilidades bajas: ${lowCount}
- Total de vulnerabilidades: ${totalCount}

El resumen debe incluir: evaluación general del estado de seguridad, principales hallazgos, impacto potencial para el negocio, y recomendaciones prioritarias. Máximo 3 párrafos.`,
        },
      ],
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content) throw new Error("No response from LLM");
    return typeof content === "string" ? content : JSON.stringify(content);
  } catch (error) {
    console.error("[AI Explainer] Error generating executive summary:", error);
    return `Este informe presenta los resultados del análisis de seguridad automatizado realizado sobre ${url}. Se han identificado ${totalCount} vulnerabilidades con un nivel de riesgo ${riskLevel}. El Security Score obtenido es de ${score}/100. Se recomienda abordar con carácter urgente las ${criticalCount} vulnerabilidades críticas y ${highCount} vulnerabilidades altas identificadas.`;
  }
}
