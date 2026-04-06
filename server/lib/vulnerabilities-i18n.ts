/**
 * Vulnerability translations for i18n support
 */

type Language = 'es' | 'en';

export const vulnerabilityTranslations: Record<string, Record<Language, Record<string, string>>> = {
  'X-Content-Type-Options no configurado': {
    es: {
      name: 'X-Content-Type-Options no configurado',
      description: 'El header X-Content-Type-Options: nosniff no está configurado, permitiendo ataques de MIME sniffing.',
      impact: 'El navegador puede interpretar archivos con tipos MIME incorrectos, facilitando ataques XSS.',
      detectionMethod: 'Análisis de cabeceras HTTP',
      remediation: 'Añadir el header: X-Content-Type-Options: nosniff',
      owaspReference: 'OWASP A05:2021 - Security Misconfiguration',
    },
    en: {
      name: 'X-Content-Type-Options not configured',
      description: 'The X-Content-Type-Options: nosniff header is not configured, allowing MIME sniffing attacks.',
      impact: 'The browser can interpret files with incorrect MIME types, facilitating XSS attacks.',
      detectionMethod: 'HTTP header analysis',
      remediation: 'Add the header: X-Content-Type-Options: nosniff',
      owaspReference: 'OWASP A05:2021 - Security Misconfiguration',
    },
  },
  'Referrer-Policy no configurado': {
    es: {
      name: 'Referrer-Policy no configurado',
      description: 'El header Referrer-Policy no está configurado. Información sensible de la URL puede filtrarse a terceros.',
      impact: 'URLs con parámetros sensibles (tokens, IDs) pueden filtrarse a sitios externos.',
      detectionMethod: 'Análisis de cabeceras HTTP',
      remediation: 'Añadir: Referrer-Policy: strict-origin-when-cross-origin',
      owaspReference: 'OWASP A05:2021 - Security Misconfiguration',
    },
    en: {
      name: 'Referrer-Policy not configured',
      description: 'The Referrer-Policy header is not configured. Sensitive URL information can be leaked to third parties.',
      impact: 'URLs with sensitive parameters (tokens, IDs) can be leaked to external sites.',
      detectionMethod: 'HTTP header analysis',
      remediation: 'Add: Referrer-Policy: strict-origin-when-cross-origin',
      owaspReference: 'OWASP A05:2021 - Security Misconfiguration',
    },
  },
  'HTTPS no implementado': {
    es: {
      name: 'HTTPS no implementado',
      description: 'El sitio web no utiliza HTTPS. Las comunicaciones no están encriptadas.',
      impact: 'Los datos transmitidos pueden ser interceptados y modificados por atacantes (man-in-the-middle).',
      detectionMethod: 'Verificación de protocolo HTTPS',
      remediation: 'Implementar HTTPS con certificado SSL/TLS válido',
      owaspReference: 'OWASP A02:2021 - Cryptographic Failures',
    },
    en: {
      name: 'HTTPS not implemented',
      description: 'The website does not use HTTPS. Communications are not encrypted.',
      impact: 'Transmitted data can be intercepted and modified by attackers (man-in-the-middle).',
      detectionMethod: 'HTTPS protocol verification',
      remediation: 'Implement HTTPS with a valid SSL/TLS certificate',
      owaspReference: 'OWASP A02:2021 - Cryptographic Failures',
    },
  },
  'Content Security Policy (CSP) no configurada': {
    es: {
      name: 'Content Security Policy (CSP) no configurada',
      description: 'El header Content-Security-Policy no está configurado, permitiendo ataques XSS.',
      impact: 'Los atacantes pueden inyectar scripts maliciosos que se ejecutarán en el navegador del usuario.',
      detectionMethod: 'Análisis de cabeceras HTTP',
      remediation: 'Implementar una política CSP restrictiva',
      owaspReference: 'OWASP A03:2021 - Injection',
    },
    en: {
      name: 'Content Security Policy (CSP) not configured',
      description: 'The Content-Security-Policy header is not configured, allowing XSS attacks.',
      impact: 'Attackers can inject malicious scripts that will execute in the user\'s browser.',
      detectionMethod: 'HTTP header analysis',
      remediation: 'Implement a restrictive CSP policy',
      owaspReference: 'OWASP A03:2021 - Injection',
    },
  },
  'CORS mal configurado': {
    es: {
      name: 'CORS mal configurado',
      description: 'La configuración de CORS permite acceso desde cualquier origen.',
      impact: 'Cualquier sitio web puede hacer solicitudes a este servidor, facilitando ataques CSRF y robo de datos.',
      detectionMethod: 'Análisis de cabeceras CORS',
      remediation: 'Configurar Access-Control-Allow-Origin con orígenes específicos',
      owaspReference: 'OWASP A05:2021 - Security Misconfiguration',
    },
    en: {
      name: 'CORS misconfigured',
      description: 'CORS configuration allows access from any origin.',
      impact: 'Any website can make requests to this server, facilitating CSRF attacks and data theft.',
      detectionMethod: 'CORS header analysis',
      remediation: 'Configure Access-Control-Allow-Origin with specific origins',
      owaspReference: 'OWASP A05:2021 - Security Misconfiguration',
    },
  },
  'Cookies sin atributo Secure': {
    es: {
      name: 'Cookies sin atributo Secure',
      description: 'Las cookies no tienen el atributo Secure, permitiendo transmisión por HTTP sin encriptar.',
      impact: 'Las cookies pueden ser interceptadas si el usuario accede a través de HTTP.',
      detectionMethod: 'Análisis de política de cookies',
      remediation: 'Añadir el atributo Secure a todas las cookies',
      owaspReference: 'OWASP A05:2021 - Security Misconfiguration',
    },
    en: {
      name: 'Cookies without Secure attribute',
      description: 'Cookies do not have the Secure attribute, allowing transmission over unencrypted HTTP.',
      impact: 'Cookies can be intercepted if the user accesses via HTTP.',
      detectionMethod: 'Cookie policy analysis',
      remediation: 'Add the Secure attribute to all cookies',
      owaspReference: 'OWASP A05:2021 - Security Misconfiguration',
    },
  },
  'Cookies sin atributo HttpOnly': {
    es: {
      name: 'Cookies sin atributo HttpOnly',
      description: 'Las cookies no tienen el atributo HttpOnly, permitiendo acceso desde JavaScript.',
      impact: 'Un ataque XSS exitoso puede robar las cookies de sesión del usuario, permitiendo el secuestro de sesión.',
      detectionMethod: 'Análisis de política de cookies',
      remediation: 'Añadir el atributo HttpOnly a todas las cookies sensibles',
      owaspReference: 'OWASP A05:2021 - Security Misconfiguration',
    },
    en: {
      name: 'Cookies without HttpOnly attribute',
      description: 'Cookies do not have the HttpOnly attribute, allowing access from JavaScript.',
      impact: 'A successful XSS attack can steal the user\'s session cookies, enabling session hijacking.',
      detectionMethod: 'Cookie policy analysis',
      remediation: 'Add the HttpOnly attribute to all sensitive cookies',
      owaspReference: 'OWASP A05:2021 - Security Misconfiguration',
    },
  },
  'Cookies sin atributo SameSite': {
    es: {
      name: 'Cookies sin atributo SameSite',
      description: 'Las cookies no tienen el atributo SameSite, lo que puede facilitar ataques CSRF.',
      impact: 'Sin SameSite, las cookies se envían en solicitudes cross-site, facilitando ataques CSRF.',
      detectionMethod: 'Análisis de política de cookies',
      remediation: 'Añadir el atributo SameSite=Strict o SameSite=Lax',
      owaspReference: 'OWASP A05:2021 - Security Misconfiguration',
    },
    en: {
      name: 'Cookies without SameSite attribute',
      description: 'Cookies do not have the SameSite attribute, which can facilitate CSRF attacks.',
      impact: 'Without SameSite, cookies are sent in cross-site requests, facilitating CSRF attacks.',
      detectionMethod: 'Cookie policy analysis',
      remediation: 'Add the SameSite=Strict or SameSite=Lax attribute',
      owaspReference: 'OWASP A05:2021 - Security Misconfiguration',
    },
  },
};

export function translateVulnerability(
  vulnKey: string,
  field: string,
  language: Language
): string {
  const vuln = vulnerabilityTranslations[vulnKey];
  if (!vuln) return '';
  
  const translation = vuln[language];
  if (!translation) return '';
  
  return translation[field as keyof typeof translation] || '';
}

export function getLanguageFromContext(language?: string): Language {
  return language === 'en' ? 'en' : 'es';
}
