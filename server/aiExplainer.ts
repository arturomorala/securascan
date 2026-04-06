import { invokeLLM } from "./_core/llm";
import type { Vulnerability } from "../drizzle/schema";

type ExplanationLevel = "basic" | "technical" | "expert";

function getSystemPrompt(level: ExplanationLevel, language: 'es' | 'en'): string {
  if (language === 'en') {
    const prompts: Record<ExplanationLevel, string> = {
      basic: `You are a cybersecurity expert explaining vulnerabilities to non-technical people.
Explain the vulnerability clearly and simply, as if talking to a business owner.
Use real-world analogies. Avoid technical jargon. Maximum 3 paragraphs.
Structure: 1) What the problem is in simple terms, 2) Why it's dangerous for the business, 3) What can be done to fix it (without technical jargon).`,
      technical: `You are a cybersecurity expert explaining vulnerabilities to web developers.
Explain the vulnerability with technical details appropriate for a developer.
Include: attack vector, how it works technically, impact on the system, and concrete remediation steps with code if applicable.
Maximum 4 paragraphs.`,
      expert: `You are a senior pentester explaining a vulnerability to another security expert.
Provide an in-depth technical analysis: complete attack vector, example payload, impact on the attack chain, advanced exploitation techniques, and detailed remediation with specific configurations.
Include references to related CVEs if applicable, and mention known exploitation tools.
Maximum 5 paragraphs.`,
    };
    return prompts[level];
  }
  
  const prompts: Record<ExplanationLevel, string> = {
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
  return prompts[level];
}

export async function generateVulnerabilityExplanation(
  vuln: Vulnerability,
  level: ExplanationLevel,
  language: 'es' | 'en' = 'es'
): Promise<string> {
  const systemPrompt = getSystemPrompt(level, language);

  const userMessage = language === 'en' ? `Detected Vulnerability:
Name: ${vuln.name}
Category: ${vuln.category}
Severity: ${vuln.severity}
Description: ${vuln.description}
Evidence: ${vuln.evidence || "N/A"}
Impact: ${vuln.impact || "N/A"}
Technical Details: ${vuln.technicalDetails || "N/A"}
OWASP Reference: ${vuln.owaspReference || "N/A"}
CVSS Score: ${vuln.cvssScore || "N/A"}

Please provide an explanation at ${level === "basic" ? "basic (non-technical)" : level === "technical" ? "technical (for developers)" : "expert (for pentesters)"} level.` : `Vulnerabilidad detectada:
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
    const fallback = language === 'en'
      ? `Could not generate automatic explanation. Please consult the documentation at ${vuln.owaspReference || "OWASP"} for more information about this vulnerability.`
      : `No se pudo generar la explicación automática. Por favor, consulta la documentación de ${vuln.owaspReference || "OWASP"} para más información sobre esta vulnerabilidad.`;
    return fallback;
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
  totalCount: number,
  language: 'es' | 'en' = 'es'
): Promise<string> {
  try {
    const systemContent = language === 'en' 
      ? "You are a cybersecurity expert writing the executive summary of a professional pentesting report. Write in English, clearly and professionally. The summary should be appropriate for presenting to executives and non-technical stakeholders."
      : "Eres un experto en ciberseguridad redactando el resumen ejecutivo de un informe de pentesting profesional. Escribe en español, de forma clara y profesional. El resumen debe ser apropiado para presentar a directivos y no técnicos.";
    
    const userContent = language === 'en'
      ? `Write an executive summary for the pentesting report of the website "${url}".
Analysis data:
- Security Score: ${score}/100
- Overall risk level: ${riskLevel}
- Critical vulnerabilities: ${criticalCount}
- High vulnerabilities: ${highCount}
- Medium vulnerabilities: ${mediumCount}
- Low vulnerabilities: ${lowCount}
- Total vulnerabilities: ${totalCount}

The summary should include: overall security status assessment, main findings, potential business impact, and priority recommendations. Maximum 3 paragraphs.`
      : `Redacta un resumen ejecutivo para el informe de pentesting del sitio web "${url}".
Datos del análisis:
- Security Score: ${score}/100
- Nivel de riesgo general: ${riskLevel}
- Vulnerabilidades críticas: ${criticalCount}
- Vulnerabilidades altas: ${highCount}
- Vulnerabilidades medias: ${mediumCount}
- Vulnerabilidades bajas: ${lowCount}
- Total de vulnerabilidades: ${totalCount}

El resumen debe incluir: evaluación general del estado de seguridad, principales hallazgos, impacto potencial para el negocio, y recomendaciones prioritarias. Máximo 3 párrafos.`;
    
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: systemContent,
        },
        {
          role: "user",
          content: userContent,
        },
      ],
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content) throw new Error("No response from LLM");
    return typeof content === "string" ? content : JSON.stringify(content);
  } catch (error) {
    console.error("[AI Explainer] Error generating executive summary:", error);
    const fallback = language === 'en'
      ? `This report presents the results of the automated security analysis performed on ${url}. ${totalCount} vulnerabilities have been identified with a ${riskLevel} risk level. The Security Score obtained is ${score}/100. It is recommended to urgently address the ${criticalCount} critical vulnerabilities and ${highCount} high vulnerabilities identified.`
      : `Este informe presenta los resultados del análisis de seguridad automatizado realizado sobre ${url}. Se han identificado ${totalCount} vulnerabilidades con un nivel de riesgo ${riskLevel}. El Security Score obtenido es de ${score}/100. Se recomienda abordar con carácter urgente las ${criticalCount} vulnerabilidades críticas y ${highCount} vulnerabilidades altas identificadas.`;
    return fallback;
  }
}
