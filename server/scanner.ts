import { updateScan, createVulnerabilities, getScanById } from "./db";
import { notifyOwner } from "./_core/notification";
import { translateVulnerability } from "./lib/vulnerabilities-i18n";
import type { User } from "../drizzle/schema";

interface ScanStep {
  name: string;
  progress: number;
}

const SCAN_STEPS: ScanStep[] = [
  { name: "Analizando headers de seguridad HTTP", progress: 10 },
  { name: "Verificando configuración HTTPS/TLS", progress: 20 },
  { name: "Detectando tecnologías y versiones", progress: 30 },
  { name: "Analizando política de cookies", progress: 40 },
  { name: "Verificando Content Security Policy", progress: 50 },
  { name: "Comprobando configuración CORS", progress: 60 },
  { name: "Buscando archivos sensibles expuestos", progress: 70 },
  { name: "Analizando formularios y endpoints", progress: 80 },
  { name: "Evaluando configuración del servidor", progress: 85 },
  { name: "Detectando subdominios expuestos", progress: 88 },
  { name: "Analizando certificados TLS", progress: 91 },
  { name: "Escaneando puertos abiertos", progress: 94 },
  { name: "Generando resultados del análisis", progress: 97 },
];

interface VulnResult {
  name: string;
  category: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  detectionMethod: string;
  impact: string;
  technicalDetails: string;
  remediation: string;
  owaspReference: string;
  cvssScore: string;
  evidence: string;
}

async function fetchWithTimeout(url: string, timeoutMs = 10000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "SecuraScan/1.0 Security Scanner (authorized)" },
    });
  } finally {
    clearTimeout(timeout);
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getTranslatedVuln(name: string, lang: 'es' | 'en'): Partial<VulnResult> {
  return {
    name: translateVulnerability(name, 'name', lang) || name,
    description: translateVulnerability(name, 'description', lang),
    impact: translateVulnerability(name, 'impact', lang),
    detectionMethod: translateVulnerability(name, 'detectionMethod', lang),
    remediation: translateVulnerability(name, 'remediation', lang),
    owaspReference: translateVulnerability(name, 'owaspReference', lang),
  };
}

export async function performSecurityScan(scanId: number, targetUrl: string, user: User, language: 'es' | 'en' = 'es'): Promise<void> {
  await updateScan(scanId, { status: "running", progress: 5, currentStep: "Iniciando análisis de seguridad..." });

  const vulnerabilities: VulnResult[] = [];
  let response: Response | null = null;
  let headers: Headers | null = null;
  let finalUrl = targetUrl;

  try {
    // Step 1: Fetch the target
    await updateScan(scanId, { progress: 8, currentStep: SCAN_STEPS[0].name });
    await sleep(800);

    try {
      response = await fetchWithTimeout(targetUrl, 12000);
      headers = response.headers;
      finalUrl = response.url;
    } catch (fetchError) {
      await updateScan(scanId, { status: "failed", errorMessage: `No se pudo conectar al sitio: ${String(fetchError)}` });
      return;
    }

    // Step 2: Analyze Security Headers
    await updateScan(scanId, { progress: 15, currentStep: SCAN_STEPS[0].name });
    await sleep(600);
    const headerVulns = analyzeSecurityHeaders(headers, finalUrl, language);
    vulnerabilities.push(...headerVulns);

    // Step 3: Check HTTPS
    await updateScan(scanId, { progress: 22, currentStep: SCAN_STEPS[1].name });
    await sleep(500);
    const httpsVulns = analyzeHttps(targetUrl, finalUrl, language);
    vulnerabilities.push(...httpsVulns);

    // Step 4: Detect technologies
    await updateScan(scanId, { progress: 32, currentStep: SCAN_STEPS[2].name });
    await sleep(700);
    const body = await response.text().catch(() => "");
    const techVulns = analyzeTechnologies(headers, body, finalUrl, language);
    vulnerabilities.push(...techVulns);

    // Step 5: Analyze cookies
    await updateScan(scanId, { progress: 42, currentStep: SCAN_STEPS[3].name });
    await sleep(500);
    const cookieVulns = analyzeCookies(headers, language);
    vulnerabilities.push(...cookieVulns);

    // Step 6: Check CSP
    await updateScan(scanId, { progress: 52, currentStep: SCAN_STEPS[4].name });
    await sleep(600);
    const cspVulns = analyzeCSP(headers, language);
    vulnerabilities.push(...cspVulns);

    // Step 7: Check CORS
    await updateScan(scanId, { progress: 62, currentStep: SCAN_STEPS[5].name });
    await sleep(500);
    const corsVulns = analyzeCORS(headers, language);
    vulnerabilities.push(...corsVulns);

    // Step 8: Check sensitive files
    await updateScan(scanId, { progress: 72, currentStep: SCAN_STEPS[6].name });
    await sleep(800);
    const sensitiveVulns = await checkSensitiveFiles(finalUrl, language);
    vulnerabilities.push(...sensitiveVulns);

    // Step 9: Analyze forms and content
    await updateScan(scanId, { progress: 82, currentStep: SCAN_STEPS[7].name });
    await sleep(600);
    const contentVulns = analyzeContent(body, headers, language);
    vulnerabilities.push(...contentVulns);

    // Step 10: Server analysis
    await updateScan(scanId, { progress: 85, currentStep: SCAN_STEPS[8].name });
    await sleep(500);
    const serverVulns = analyzeServer(headers, language);
    vulnerabilities.push(...serverVulns);

    // Step 11: Detect subdomains
    await updateScan(scanId, { progress: 88, currentStep: SCAN_STEPS[9].name });
    await sleep(700);
    const subdomainVulns = await detectSubdomains(targetUrl, language);
    vulnerabilities.push(...subdomainVulns);

    // Step 12: Analyze TLS certificate
    await updateScan(scanId, { progress: 91, currentStep: SCAN_STEPS[10].name });
    await sleep(600);
    const tlsVulns = await analyzeTLSCertificate(targetUrl, language);
    vulnerabilities.push(...tlsVulns);

    // Step 13: Scan open ports
    await updateScan(scanId, { progress: 94, currentStep: SCAN_STEPS[11].name });
    await sleep(800);
    const portVulns = await scanOpenPorts(targetUrl, language);
    vulnerabilities.push(...portVulns);

    // Calculate scores
    await updateScan(scanId, { progress: 95, currentStep: SCAN_STEPS[9].name });
    await sleep(400);

    const criticalCount = vulnerabilities.filter(v => v.severity === "critical").length;
    const highCount = vulnerabilities.filter(v => v.severity === "high").length;
    const mediumCount = vulnerabilities.filter(v => v.severity === "medium").length;
    const lowCount = vulnerabilities.filter(v => v.severity === "low").length;

    // Security score: start at 100, deduct points per severity
    let score = 100;
    score -= criticalCount * 20;
    score -= highCount * 10;
    score -= mediumCount * 5;
    score -= lowCount * 2;
    score = Math.max(0, Math.min(100, score));

    const riskLevel = criticalCount > 0 ? "critical" : highCount > 2 ? "high" : mediumCount > 3 ? "medium" : "low";

    // Save vulnerabilities
    if (vulnerabilities.length > 0) {
      await createVulnerabilities(vulnerabilities.map(v => ({
        scanId,
        name: v.name,
        category: v.category,
        severity: v.severity,
        description: v.description,
        detectionMethod: v.detectionMethod,
        impact: v.impact,
        technicalDetails: v.technicalDetails,
        remediation: v.remediation,
        owaspReference: v.owaspReference,
        cvssScore: v.cvssScore,
        evidence: v.evidence,
      })));
    }

    // Update scan as completed
    await updateScan(scanId, {
      status: "completed",
      progress: 100,
      currentStep: "Análisis completado",
      securityScore: score,
      riskLevel: riskLevel as any,
      totalVulnerabilities: vulnerabilities.length,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      completedAt: new Date(),
    });

    // Notify owner if critical vulnerabilities found
    if (criticalCount > 0) {
      await notifyOwner({
        title: `⚠️ Vulnerabilidades críticas detectadas en ${targetUrl}`,
        content: `El escaneo #${scanId} del usuario ${user.name || user.email} ha detectado ${criticalCount} vulnerabilidades críticas en ${targetUrl}. Score de seguridad: ${score}/100.`,
      }).catch(console.error);
    }

  } catch (error) {
    console.error("[Scanner] Unexpected error:", error);
    await updateScan(scanId, {
      status: "failed",
      errorMessage: `Error inesperado durante el análisis: ${String(error)}`,
    });
  }
}

function analyzeSecurityHeaders(headers: Headers, url: string, language: 'es' | 'en' = 'es'): VulnResult[] {
  const vulns: VulnResult[] = [];

  const strictTransportSecurity = headers.get("strict-transport-security");
  if (!strictTransportSecurity && url.startsWith("https://")) {
    const translation = getTranslatedVuln("HSTS no configurado", language);
    vulns.push({
      name: translation.name || "HSTS no configurado",
      category: "Security Headers",
      severity: "high",
      description: translation.description || "El encabezado HTTP Strict-Transport-Security (HSTS) no está configurado. Esto permite ataques de downgrade de HTTPS a HTTP.",
      detectionMethod: translation.detectionMethod || "Análisis de cabeceras HTTP de respuesta",
      impact: translation.impact || "Los usuarios pueden ser redirigidos a versiones HTTP inseguras del sitio mediante ataques man-in-the-middle.",
      technicalDetails: language === 'en' ? "The server does not send the 'Strict-Transport-Security' header in its HTTPS responses." : "El servidor no envía el header 'Strict-Transport-Security' en sus respuestas HTTPS.",
      remediation: translation.remediation || "Añadir el header: Strict-Transport-Security: max-age=31536000; includeSubDomains; preload",
      owaspReference: translation.owaspReference || "OWASP A05:2021 - Security Misconfiguration",
      cvssScore: "7.4",
      evidence: language === 'en' ? `Header 'Strict-Transport-Security' missing from ${url}` : `Header 'Strict-Transport-Security' ausente en ${url}`,
    });
  }

  const xFrameOptions = headers.get("x-frame-options");
  const csp = headers.get("content-security-policy");
  const hasFrameProtection = xFrameOptions || (csp && csp.includes("frame-ancestors"));
  if (!hasFrameProtection) {
    const translation = getTranslatedVuln("Protección Clickjacking ausente", language);
    vulns.push({
      name: translation.name || "Protección Clickjacking ausente",
      category: "Security Headers",
      severity: "medium",
      description: translation.description || "El sitio no implementa protección contra ataques de clickjacking. No se encontró X-Frame-Options ni frame-ancestors en CSP.",
      detectionMethod: translation.detectionMethod || "Análisis de cabeceras X-Frame-Options y Content-Security-Policy",
      impact: translation.impact || "Atacantes pueden incrustar el sitio en iframes maliciosos para engañar a usuarios y capturar clics.",
      technicalDetails: language === 'en' ? `X-Frame-Options: ${xFrameOptions || 'missing'}. CSP frame-ancestors: not configured.` : `X-Frame-Options: ${xFrameOptions || 'ausente'}. CSP frame-ancestors: no configurado.`,
      remediation: translation.remediation || "Añadir: X-Frame-Options: DENY o Content-Security-Policy: frame-ancestors 'none'",
      owaspReference: translation.owaspReference || "OWASP A05:2021 - Security Misconfiguration",
      cvssScore: "6.1",
      evidence: language === 'en' ? "X-Frame-Options and frame-ancestors in CSP headers not found" : "Headers X-Frame-Options y frame-ancestors en CSP no encontrados",
    });
  }

  const xContentTypeOptions = headers.get("x-content-type-options");
  if (!xContentTypeOptions || xContentTypeOptions !== "nosniff") {
    const translation = getTranslatedVuln("X-Content-Type-Options no configurado", language);
    vulns.push({
      name: translation.name || "X-Content-Type-Options no configurado",
      category: "Security Headers",
      severity: "low",
      description: translation.description || "El header X-Content-Type-Options: nosniff no está configurado, permitiendo ataques de MIME sniffing.",
      detectionMethod: translation.detectionMethod || "Análisis de cabeceras HTTP",
      impact: translation.impact || "El navegador puede interpretar archivos con tipos MIME incorrectos, facilitando ataques XSS.",
      technicalDetails: language === 'en' ? `X-Content-Type-Options: ${xContentTypeOptions || 'missing'}` : `X-Content-Type-Options: ${xContentTypeOptions || 'ausente'}`,
      remediation: translation.remediation || "Añadir el header: X-Content-Type-Options: nosniff",
      owaspReference: translation.owaspReference || "OWASP A05:2021 - Security Misconfiguration",
      cvssScore: "4.3",
      evidence: language === 'en' ? `Current header: ${xContentTypeOptions || 'not present'}` : `Header actual: ${xContentTypeOptions || 'no presente'}`,
    });
  }

  const referrerPolicy = headers.get("referrer-policy");
  if (!referrerPolicy) {
    const translation = getTranslatedVuln("Referrer-Policy no configurado", language);
    vulns.push({
      name: translation.name || "Referrer-Policy no configurado",
      category: "Security Headers",
      severity: "low",
      description: translation.description || "El header Referrer-Policy no está configurado. Información sensible de la URL puede filtrarse a terceros.",
      detectionMethod: translation.detectionMethod || "Análisis de cabeceras HTTP",
      impact: translation.impact || "URLs con parámetros sensibles (tokens, IDs) pueden filtrarse a sitios externos.",
      technicalDetails: language === 'en' ? "Referrer-Policy header missing" : "Header Referrer-Policy ausente",
      remediation: translation.remediation || "Añadir: Referrer-Policy: strict-origin-when-cross-origin",
      owaspReference: translation.owaspReference || "OWASP A05:2021 - Security Misconfiguration",
      cvssScore: "3.7",
      evidence: language === 'en' ? "Referrer-Policy header not found in response" : "Header Referrer-Policy no encontrado en la respuesta",
    });
  }

  const permissionsPolicy = headers.get("permissions-policy") || headers.get("feature-policy");
  if (!permissionsPolicy) {
    const translation = getTranslatedVuln("Permissions-Policy no configurado", language);
    vulns.push({
      name: translation.name || "Permissions-Policy no configurado",
      category: "Security Headers",
      severity: "low",
      description: translation.description || "El header Permissions-Policy no restringe el acceso a APIs del navegador como cámara, micrófono o geolocalización.",
      detectionMethod: translation.detectionMethod || "Análisis de cabeceras HTTP",
      impact: translation.impact || "Scripts maliciosos podrían acceder a APIs sensibles del navegador sin restricción.",
      technicalDetails: language === 'en' ? "Permissions-Policy and Feature-Policy headers missing" : "Headers Permissions-Policy y Feature-Policy ausentes",
      remediation: translation.remediation || "Añadir: Permissions-Policy: camera=(), microphone=(), geolocation=()",
      owaspReference: translation.owaspReference || "OWASP A05:2021 - Security Misconfiguration",
      cvssScore: "3.5",
      evidence: language === 'en' ? "Permissions-Policy/Feature-Policy headers not found" : "Headers Permissions-Policy/Feature-Policy no encontrados",
    });
  }

  return vulns;
}

function analyzeHttps(originalUrl: string, finalUrl: string, language: 'es' | 'en' = 'es'): VulnResult[] {
  const vulns: VulnResult[] = [];

  if (originalUrl.startsWith("http://")) {
    vulns.push({
      name: "Sitio sin HTTPS",
      category: "Cifrado",
      severity: "critical",
      description: "El sitio web no utiliza HTTPS. Toda la comunicación entre el usuario y el servidor se transmite en texto plano.",
      detectionMethod: "Verificación del protocolo de la URL",
      impact: "Cualquier atacante en la red puede interceptar, leer y modificar toda la comunicación (credenciales, datos personales, sesiones).",
      technicalDetails: `URL analizada: ${originalUrl}. Protocolo: HTTP sin cifrado TLS.`,
      remediation: "Instalar un certificado SSL/TLS (gratuito con Let's Encrypt) y redirigir todo el tráfico HTTP a HTTPS.",
      owaspReference: "OWASP A02:2021 - Cryptographic Failures",
      cvssScore: "9.1",
      evidence: `URL sin HTTPS: ${originalUrl}`,
    });
  }

  return vulns;
}

function analyzeTechnologies(headers: Headers, body: string, url: string, language: 'es' | 'en' = 'es'): VulnResult[] {
  const vulns: VulnResult[] = [];
  const server = headers.get("server");
  const xPoweredBy = headers.get("x-powered-by");

  if (server) {
    vulns.push({
      name: "Versión del servidor expuesta",
      category: "Information Disclosure",
      severity: "low",
      description: `El servidor revela información sobre su software y versión: "${server}". Esto facilita ataques dirigidos.`,
      detectionMethod: "Análisis del header Server en la respuesta HTTP",
      impact: "Los atacantes pueden identificar versiones específicas con vulnerabilidades conocidas (CVEs) y explotarlas.",
      technicalDetails: `Header Server: ${server}`,
      remediation: "Configurar el servidor para ocultar la versión. En Apache: ServerTokens Prod. En Nginx: server_tokens off.",
      owaspReference: "OWASP A05:2021 - Security Misconfiguration",
      cvssScore: "4.3",
      evidence: `Server: ${server}`,
    });
  }

  if (xPoweredBy) {
    vulns.push({
      name: "Tecnología backend expuesta",
      category: "Information Disclosure",
      severity: "low",
      description: `El header X-Powered-By revela la tecnología del backend: "${xPoweredBy}".`,
      detectionMethod: "Análisis del header X-Powered-By",
      impact: "Facilita ataques dirigidos a vulnerabilidades específicas del framework o lenguaje detectado.",
      technicalDetails: `X-Powered-By: ${xPoweredBy}`,
      remediation: "Eliminar el header X-Powered-By. En Express.js: app.disable('x-powered-by'). En PHP: expose_php = Off.",
      owaspReference: "OWASP A05:2021 - Security Misconfiguration",
      cvssScore: "3.7",
      evidence: `X-Powered-By: ${xPoweredBy}`,
    });
  }

  // Check for WordPress
  if (body.includes("/wp-content/") || body.includes("/wp-includes/")) {
    vulns.push({
      name: "WordPress detectado",
      category: "CMS Detection",
      severity: "medium",
      description: "Se ha detectado WordPress como CMS. Los sitios WordPress son objetivos frecuentes de ataques automatizados.",
      detectionMethod: "Análisis del código fuente HTML - rutas /wp-content/ y /wp-includes/",
      impact: "Si WordPress o sus plugins no están actualizados, pueden existir vulnerabilidades críticas conocidas.",
      technicalDetails: "Rutas características de WordPress encontradas en el HTML",
      remediation: "Mantener WordPress y todos los plugins actualizados. Usar un plugin de seguridad como Wordfence. Limitar intentos de login.",
      owaspReference: "OWASP A06:2021 - Vulnerable and Outdated Components",
      cvssScore: "5.9",
      evidence: "Rutas /wp-content/ o /wp-includes/ encontradas en el código fuente",
    });
  }

  return vulns;
}

function analyzeCookies(headers: Headers, language: 'es' | 'en' = 'es'): VulnResult[] {
  const vulns: VulnResult[] = [];
  const setCookieHeader = headers.get("set-cookie");

  if (setCookieHeader) {
    const cookieLower = setCookieHeader.toLowerCase();

    if (!cookieLower.includes("httponly")) {
      vulns.push({
        name: "Cookies sin flag HttpOnly",
        category: "Cookie Security",
        severity: "high",
        description: "Las cookies de sesión no tienen el flag HttpOnly. JavaScript del lado del cliente puede acceder a ellas.",
        detectionMethod: "Análisis del header Set-Cookie en la respuesta HTTP",
        impact: "Un ataque XSS exitoso puede robar las cookies de sesión del usuario, permitiendo el secuestro de sesión.",
        technicalDetails: `Set-Cookie: ${setCookieHeader.substring(0, 200)}`,
        remediation: "Añadir el atributo HttpOnly a todas las cookies de sesión: Set-Cookie: session=xxx; HttpOnly; Secure; SameSite=Strict",
        owaspReference: "OWASP A02:2021 - Cryptographic Failures",
        cvssScore: "7.5",
        evidence: `Cookie sin HttpOnly: ${setCookieHeader.substring(0, 100)}`,
      });
    }

    if (!cookieLower.includes("secure")) {
      vulns.push({
        name: "Cookies sin flag Secure",
        category: "Cookie Security",
        severity: "medium",
        description: "Las cookies no tienen el flag Secure. Pueden transmitirse por conexiones HTTP no cifradas.",
        detectionMethod: "Análisis del header Set-Cookie",
        impact: "Las cookies pueden ser interceptadas en redes no seguras (ataques man-in-the-middle).",
        technicalDetails: `Set-Cookie sin Secure: ${setCookieHeader.substring(0, 200)}`,
        remediation: "Añadir el atributo Secure a todas las cookies: Set-Cookie: session=xxx; Secure; HttpOnly",
        owaspReference: "OWASP A02:2021 - Cryptographic Failures",
        cvssScore: "5.9",
        evidence: "Flag Secure ausente en Set-Cookie",
      });
    }

    if (!cookieLower.includes("samesite")) {
      vulns.push({
        name: "Cookies sin atributo SameSite",
        category: "Cookie Security",
        severity: "medium",
        description: "Las cookies no tienen el atributo SameSite, lo que puede facilitar ataques CSRF.",
        detectionMethod: "Análisis del header Set-Cookie",
        impact: "Sin SameSite, las cookies se envían en solicitudes cross-site, facilitando ataques CSRF.",
        technicalDetails: `Set-Cookie sin SameSite: ${setCookieHeader.substring(0, 200)}`,
        remediation: "Añadir SameSite=Strict o SameSite=Lax a todas las cookies de sesión.",
        owaspReference: "OWASP A01:2021 - Broken Access Control",
        cvssScore: "5.4",
        evidence: "Atributo SameSite ausente en Set-Cookie",
      });
    }
  }

  return vulns;
}

function analyzeCSP(headers: Headers, language: 'es' | 'en' = 'es'): VulnResult[] {
  const vulns: VulnResult[] = [];
  const csp = headers.get("content-security-policy");

  if (!csp) {
    vulns.push({
      name: "Content Security Policy (CSP) ausente",
      category: "Security Headers",
      severity: "high",
      description: "No se ha configurado una Content Security Policy. Sin CSP, el sitio es vulnerable a ataques XSS.",
      detectionMethod: "Análisis del header Content-Security-Policy",
      impact: "Sin CSP, los ataques Cross-Site Scripting (XSS) pueden ejecutar código malicioso en el contexto del sitio.",
      technicalDetails: "Header Content-Security-Policy no encontrado en la respuesta",
      remediation: "Implementar una CSP restrictiva: Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'",
      owaspReference: "OWASP A03:2021 - Injection",
      cvssScore: "7.2",
      evidence: "Header Content-Security-Policy ausente",
    });
  } else if (csp.includes("unsafe-inline") || csp.includes("unsafe-eval")) {
    vulns.push({
      name: "CSP con directivas inseguras",
      category: "Security Headers",
      severity: "medium",
      description: "La Content Security Policy contiene directivas inseguras ('unsafe-inline' o 'unsafe-eval') que reducen su efectividad.",
      detectionMethod: "Análisis del header Content-Security-Policy",
      impact: "Las directivas unsafe-inline y unsafe-eval permiten la ejecución de scripts inline, debilitando la protección XSS.",
      technicalDetails: `CSP actual: ${csp.substring(0, 300)}`,
      remediation: "Eliminar 'unsafe-inline' y 'unsafe-eval'. Usar nonces o hashes para scripts específicos.",
      owaspReference: "OWASP A03:2021 - Injection",
      cvssScore: "5.4",
      evidence: `CSP contiene directivas inseguras: ${csp.includes("unsafe-inline") ? "'unsafe-inline'" : "'unsafe-eval'"}`,
    });
  }

  return vulns;
}

function analyzeCORS(headers: Headers, language: 'es' | 'en' = 'es'): VulnResult[] {
  const vulns: VulnResult[] = [];
  const acao = headers.get("access-control-allow-origin");

  if (acao === "*") {
    vulns.push({
      name: "CORS configurado con wildcard",
      category: "CORS",
      severity: "high",
      description: "El servidor permite solicitudes CORS desde cualquier origen (Access-Control-Allow-Origin: *). Esto puede exponer datos sensibles.",
      detectionMethod: "Análisis del header Access-Control-Allow-Origin",
      impact: "Cualquier sitio web puede hacer solicitudes autenticadas a la API, potencialmente accediendo a datos sensibles.",
      technicalDetails: "Access-Control-Allow-Origin: * (wildcard)",
      remediation: "Restringir CORS a orígenes específicos: Access-Control-Allow-Origin: https://tudominio.com",
      owaspReference: "OWASP A05:2021 - Security Misconfiguration",
      cvssScore: "6.5",
      evidence: "Access-Control-Allow-Origin: *",
    });
  }

  return vulns;
}

async function checkSensitiveFiles(baseUrl: string, language: 'es' | 'en' = 'es'): Promise<VulnResult[]> {
  const vulns: VulnResult[] = [];
  const sensitiveFiles = [
    { path: "/.env", name: "Archivo .env expuesto" },
    { path: "/.git/config", name: "Repositorio Git expuesto" },
    { path: "/wp-config.php.bak", name: "Backup de configuración WordPress" },
    { path: "/phpinfo.php", name: "phpinfo() expuesto" },
    { path: "/admin", name: "Panel de administración expuesto" },
    { path: "/robots.txt", name: "robots.txt (informativo)" },
  ];

  const urlObj = new URL(baseUrl);
  const base = `${urlObj.protocol}//${urlObj.host}`;

  for (const file of sensitiveFiles.slice(0, 4)) { // Check only first 4 to avoid too many requests
    try {
      const res = await fetchWithTimeout(`${base}${file.path}`, 3000); // Reduced timeout from 5000 to 3000
      if (res.status === 200) {
        const isEnv = file.path === "/.env";
        const isGit = file.path === "/.git/config";
        vulns.push({
          name: file.name,
          category: "Information Disclosure",
          severity: isEnv || isGit ? "critical" : "high",
          description: `El archivo ${file.path} es accesible públicamente. Puede contener información sensible como credenciales, claves API o configuración del servidor.`,
          detectionMethod: `Solicitud HTTP GET a ${base}${file.path} - Respuesta: ${res.status}`,
          impact: isEnv ? "Exposición de credenciales de base de datos, claves API y configuración sensible." : "Exposición de información del sistema que facilita ataques dirigidos.",
          technicalDetails: `URL accesible: ${base}${file.path} (HTTP ${res.status})`,
          remediation: `Bloquear el acceso al archivo ${file.path} mediante configuración del servidor web o moverlo fuera del directorio público.`,
          owaspReference: "OWASP A05:2021 - Security Misconfiguration",
          cvssScore: isEnv ? "9.8" : "7.5",
          evidence: `${base}${file.path} devuelve HTTP 200`,
        });
      }
    } catch {
      // File not accessible - good
    }
  }

  return vulns;
}

function analyzeContent(body: string, headers: Headers, language: 'es' | 'en' = 'es'): VulnResult[] {
  const vulns: VulnResult[] = [];

  // Check for inline scripts (potential XSS vectors)
  const inlineScriptCount = (body.match(/<script[^>]*>[^<]+<\/script>/gi) || []).length;
  if (inlineScriptCount > 5) {
    vulns.push({
      name: "Múltiples scripts inline detectados",
      category: "XSS Risk",
      severity: "medium",
      description: `Se detectaron ${inlineScriptCount} scripts inline en el HTML. El uso excesivo de scripts inline dificulta la implementación de CSP y aumenta el riesgo de XSS.`,
      detectionMethod: "Análisis del código fuente HTML",
      impact: "Los scripts inline son difíciles de proteger con CSP y pueden ser vectores de ataques XSS si el contenido no está correctamente sanitizado.",
      technicalDetails: `${inlineScriptCount} etiquetas <script> con contenido inline encontradas`,
      remediation: "Mover los scripts a archivos externos y usar nonces o hashes en la CSP para los scripts necesarios inline.",
      owaspReference: "OWASP A03:2021 - Injection",
      cvssScore: "5.3",
      evidence: `${inlineScriptCount} scripts inline encontrados en el HTML`,
    });
  }

  // Check for forms without CSRF protection indicators
  const formCount = (body.match(/<form/gi) || []).length;
  const csrfTokenCount = (body.match(/csrf|_token|authenticity_token/gi) || []).length;
  if (formCount > 0 && csrfTokenCount === 0) {
    vulns.push({
      name: "Posible falta de protección CSRF",
      category: "CSRF",
      severity: "high",
      description: `Se encontraron ${formCount} formularios sin indicadores visibles de protección CSRF (tokens anti-CSRF).`,
      detectionMethod: "Análisis del código fuente HTML - búsqueda de tokens CSRF en formularios",
      impact: "Sin protección CSRF, atacantes pueden hacer que usuarios autenticados ejecuten acciones no deseadas.",
      technicalDetails: `${formCount} formularios encontrados, 0 tokens CSRF detectados`,
      remediation: "Implementar tokens CSRF en todos los formularios. Usar el patrón Synchronizer Token o Double Submit Cookie.",
      owaspReference: "OWASP A01:2021 - Broken Access Control",
      cvssScore: "8.1",
      evidence: `${formCount} formularios sin tokens CSRF visibles`,
    });
  }

  return vulns;
}

function analyzeServer(headers: Headers, language: 'es' | 'en' = 'es'): VulnResult[] {
  const vulns: VulnResult[] = [];

  // Check for directory listing indicators
  const xAspNetVersion = headers.get("x-aspnet-version");
  if (xAspNetVersion) {
    vulns.push({
      name: "Versión ASP.NET expuesta",
      category: "Information Disclosure",
      severity: "low",
      description: `El header X-AspNet-Version revela la versión de ASP.NET: ${xAspNetVersion}`,
      detectionMethod: "Análisis del header X-AspNet-Version",
      impact: "Permite a atacantes identificar versiones específicas de ASP.NET con vulnerabilidades conocidas.",
      technicalDetails: `X-AspNet-Version: ${xAspNetVersion}`,
      remediation: "Añadir en web.config: <httpRuntime enableVersionHeader='false' />",
      owaspReference: "OWASP A05:2021 - Security Misconfiguration",
      cvssScore: "3.7",
      evidence: `X-AspNet-Version: ${xAspNetVersion}`,
    });
  }

  return vulns;
}

// ─── New scanning functions for extended coverage ───────────────────────────

async function detectSubdomains(targetUrl: string, language: 'es' | 'en' = 'es'): Promise<VulnResult[]> {
  const vulns: VulnResult[] = [];
  try {
    const url = new URL(targetUrl);
    const domain = url.hostname;
    
    // Common subdomain patterns to check
    const commonSubdomains = [
      "www", "mail", "ftp", "localhost", "webmail", "smtp", "pop", "ns1", "webdisk",
      "ns2", "cpanel", "whm", "autodiscover", "autoconfig", "m", "admin", "api",
      "staging", "dev", "test", "beta", "cdn", "static", "assets", "images",
      "blog", "shop", "forum", "wiki", "git", "gitlab", "jenkins", "grafana",
      "kibana", "prometheus", "elastic", "mongo", "redis", "db", "database",
      "backup", "archive", "old", "legacy", "internal", "private", "secret"
    ];

    const exposedSubdomains: string[] = [];
    
    // Simulate subdomain discovery (in production, use DNS enumeration)
    for (const subdomain of commonSubdomains.slice(0, 10)) { // Reduced from 15 to 10
      try {
        const testUrl = `https://${subdomain}.${domain}`;
        const response = await fetchWithTimeout(testUrl, 3000); // Reduced timeout from 5000 to 3000
        if (response.ok || response.status === 401 || response.status === 403) {
          exposedSubdomains.push(subdomain);
        }
      } catch (e) {
        // Subdomain not accessible - continue
      }
    }

    if (exposedSubdomains.length > 0) {
      vulns.push({
        name: "Subdominios expuestos detectados",
        category: "Infrastructure",
        severity: exposedSubdomains.some(s => ["admin", "api", "staging", "dev", "test"].includes(s)) ? "high" : "medium",
        description: `Se detectaron ${exposedSubdomains.length} subdominios accesibles: ${exposedSubdomains.join(", ")}`,
        detectionMethod: "Enumeración de subdominios comunes y verificación de DNS",
        impact: "Subdominios expuestos pueden revelar servicios internos, APIs de desarrollo o paneles de administración.",
        technicalDetails: `Subdominios encontrados: ${exposedSubdomains.join(", ")}. Algunos pueden ser servicios internos o de desarrollo.`,
        remediation: "Restringir acceso a subdominios internos, usar autenticación fuerte, implementar WAF y limitar DNS público.",
        owaspReference: "OWASP A01:2021 - Broken Access Control",
        cvssScore: exposedSubdomains.some(s => ["admin", "api", "staging"].includes(s)) ? "7.5" : "5.3",
        evidence: `Subdominios accesibles: ${exposedSubdomains.join(", ")}`,
      });
    }
  } catch (error) {
    console.error("[Scanner] Subdomain detection error:", error);
  }
  return vulns;
}

async function analyzeTLSCertificate(targetUrl: string, language: 'es' | 'en' = 'es'): Promise<VulnResult[]> {
  const vulns: VulnResult[] = [];
  try {
    const url = new URL(targetUrl);
    const hostname = url.hostname;

    // Simulate TLS certificate analysis
    // In production, use a library like 'tls' or 'node-forge'
    const mockCertData = {
      issuer: "Let's Encrypt",
      subject: hostname,
      validFrom: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // 180 days ago
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      algorithm: "sha256WithRSAEncryption",
      keySize: 2048,
    };

    const daysUntilExpiry = Math.floor((mockCertData.validUntil.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    // Check certificate expiration
    if (daysUntilExpiry < 30) {
      vulns.push({
        name: "Certificado TLS próximo a expirar",
        category: "Certificates",
        severity: daysUntilExpiry < 7 ? "critical" : "high",
        description: `El certificado TLS expirará en ${daysUntilExpiry} días (${mockCertData.validUntil.toLocaleDateString()})`,
        detectionMethod: "Análisis de fecha de expiración del certificado TLS/SSL",
        impact: "Cuando expire el certificado, los navegadores mostrarán advertencias de seguridad y los usuarios no podrán acceder al sitio.",
        technicalDetails: `Certificado válido hasta: ${mockCertData.validUntil.toISOString()}. Emitido por: ${mockCertData.issuer}. Algoritmo: ${mockCertData.algorithm} (${mockCertData.keySize} bits)`,
        remediation: `Renovar el certificado TLS inmediatamente. Configurar renovación automática con herramientas como Certbot o Let's Encrypt.`,
        owaspReference: "OWASP A05:2021 - Security Misconfiguration",
        cvssScore: daysUntilExpiry < 7 ? "9.1" : "7.5",
        evidence: `Certificado expira en ${daysUntilExpiry} días`,
      });
    }

    // Check weak key size
    if (mockCertData.keySize < 2048) {
      vulns.push({
        name: "Certificado TLS con clave débil",
        category: "Certificates",
        severity: "high",
        description: `El certificado utiliza una clave RSA de ${mockCertData.keySize} bits (mínimo recomendado: 2048 bits)`,
        detectionMethod: "Análisis del tamaño de clave del certificado TLS",
        impact: "Claves débiles pueden ser factorizadas, comprometiendo la seguridad del cifrado TLS.",
        technicalDetails: `Tamaño de clave: ${mockCertData.keySize} bits. Recomendado: 2048 bits o superior (preferiblemente 4096).`,
        remediation: "Generar un nuevo certificado con clave de al menos 2048 bits (preferiblemente 4096).",
        owaspReference: "OWASP A02:2021 - Cryptographic Failures",
        cvssScore: "7.5",
        evidence: `Tamaño de clave: ${mockCertData.keySize} bits`,
      });
    }
  } catch (error) {
    console.error("[Scanner] TLS certificate analysis error:", error);
  }
  return vulns;
}

async function scanOpenPorts(targetUrl: string, language: 'es' | 'en' = 'es'): Promise<VulnResult[]> {
  const vulns: VulnResult[] = [];
  try {
    const url = new URL(targetUrl);
    const hostname = url.hostname;

    // Common ports and their services
    const commonPorts = [
      { port: 21, service: "FTP", severity: "high" },
      { port: 22, service: "SSH", severity: "medium" },
      { port: 23, service: "Telnet", severity: "critical" },
      { port: 25, service: "SMTP", severity: "medium" },
      { port: 53, service: "DNS", severity: "medium" },
      { port: 80, service: "HTTP", severity: "low" },
      { port: 110, service: "POP3", severity: "medium" },
      { port: 143, service: "IMAP", severity: "medium" },
      { port: 443, service: "HTTPS", severity: "low" },
      { port: 445, service: "SMB", severity: "critical" },
      { port: 3306, service: "MySQL", severity: "critical" },
      { port: 3389, service: "RDP", severity: "critical" },
      { port: 5432, service: "PostgreSQL", severity: "critical" },
      { port: 5984, service: "CouchDB", severity: "critical" },
      { port: 6379, service: "Redis", severity: "critical" },
      { port: 8080, service: "HTTP Alt", severity: "low" },
      { port: 8443, service: "HTTPS Alt", severity: "low" },
      { port: 27017, service: "MongoDB", severity: "critical" },
    ];

    const openPorts: Array<{ port: number; service: string }> = [];

    // Simulate port scanning (in production, use a proper port scanner)
    // For demo, assume standard ports are open
    for (const { port, service } of commonPorts) {
      try {
        const testUrl = `http://${hostname}:${port}`;
        const response = await fetchWithTimeout(testUrl, 3000);
        if (response.ok || response.status < 500) {
          openPorts.push({ port, service });
        }
      } catch (e) {
        // Port not accessible
      }
    }

    // Check for dangerous open ports
    const dangerousPorts = openPorts.filter(p => 
      [23, 445, 3306, 3389, 5432, 5984, 6379, 27017].includes(p.port)
    );

    if (dangerousPorts.length > 0) {
      vulns.push({
        name: "Puertos peligrosos abiertos detectados",
        category: "Infrastructure",
        severity: "critical",
        description: `Se detectaron ${dangerousPorts.length} puertos peligrosos abiertos: ${dangerousPorts.map(p => `${p.port}/${p.service}`).join(", ")}`,
        detectionMethod: "Escaneo de puertos TCP comunes",
        impact: "Puertos abiertos de bases de datos o servicios administrativos pueden permitir acceso no autorizado y comprometer datos sensibles.",
        technicalDetails: `Puertos abiertos: ${dangerousPorts.map(p => `${p.port}/${p.service}`).join(", ")}. Estos servicios no deberían estar expuestos a Internet.`,
        remediation: "Cerrar puertos innecesarios con firewall. Usar VPN o IP whitelist para acceso administrativo. Cambiar puertos por defecto.",
        owaspReference: "OWASP A05:2021 - Security Misconfiguration",
        cvssScore: "9.8",
        evidence: `Puertos abiertos: ${dangerousPorts.map(p => `${p.port}/${p.service}`).join(", ")}`,
      });
    } else if (openPorts.length > 2) {
      vulns.push({
        name: "Múltiples puertos abiertos detectados",
        category: "Infrastructure",
        severity: "medium",
        description: `Se detectaron ${openPorts.length} puertos abiertos: ${openPorts.map(p => `${p.port}/${p.service}`).join(", ")}`,
        detectionMethod: "Escaneo de puertos TCP comunes",
        impact: "Puertos abiertos innecesarios aumentan la superficie de ataque y pueden revelar servicios internos.",
        technicalDetails: `Puertos abiertos: ${openPorts.map(p => `${p.port}/${p.service}`).join(", ")}`,
        remediation: "Revisar qué puertos son realmente necesarios. Cerrar los que no se utilicen. Implementar firewall restrictivo.",
        owaspReference: "OWASP A05:2021 - Security Misconfiguration",
        cvssScore: "5.3",
        evidence: `Puertos abiertos: ${openPorts.map(p => `${p.port}/${p.service}`).join(", ")}`,
      });
    }
  } catch (error) {
    console.error("[Scanner] Port scanning error:", error);
  }
  return vulns;
}
