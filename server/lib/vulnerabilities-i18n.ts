/**
 * Vulnerability translations for i18n support
 * Complete translations for all vulnerabilities detected by the scanner
 */

type Language = 'es' | 'en';

export const vulnerabilityTranslations: Record<string, Record<Language, Record<string, string>>> = {
  // Security Headers
  'HSTS no configurado': {
    es: {
      name: 'HSTS no configurado',
      description: 'El encabezado HTTP Strict-Transport-Security (HSTS) no está configurado. Esto permite ataques de downgrade de HTTPS a HTTP.',
      impact: 'Los usuarios pueden ser redirigidos a versiones HTTP inseguras del sitio mediante ataques man-in-the-middle.',
      detectionMethod: 'Análisis de cabeceras HTTP de respuesta',
      remediation: 'Añadir el header: Strict-Transport-Security: max-age=31536000; includeSubDomains; preload',
      owaspReference: 'OWASP A05:2021 - Security Misconfiguration',
    },
    en: {
      name: 'HSTS not configured',
      description: 'The HTTP Strict-Transport-Security (HSTS) header is not configured. This allows HTTPS to HTTP downgrade attacks.',
      impact: 'Users can be redirected to insecure HTTP versions of the site through man-in-the-middle attacks.',
      detectionMethod: 'HTTP response header analysis',
      remediation: 'Add the header: Strict-Transport-Security: max-age=31536000; includeSubDomains; preload',
      owaspReference: 'OWASP A05:2021 - Security Misconfiguration',
    },
  },
  'Protección Clickjacking ausente': {
    es: {
      name: 'Protección Clickjacking ausente',
      description: 'El sitio no implementa protección contra ataques de clickjacking. No se encontró X-Frame-Options ni frame-ancestors en CSP.',
      impact: 'Atacantes pueden incrustar el sitio en iframes maliciosos para engañar a usuarios y capturar clics.',
      detectionMethod: 'Análisis de cabeceras X-Frame-Options y Content-Security-Policy',
      remediation: 'Añadir: X-Frame-Options: DENY o Content-Security-Policy: frame-ancestors \'none\'',
      owaspReference: 'OWASP A05:2021 - Security Misconfiguration',
    },
    en: {
      name: 'Clickjacking protection missing',
      description: 'The site does not implement clickjacking protection. X-Frame-Options or frame-ancestors in CSP not found.',
      impact: 'Attackers can embed the site in malicious iframes to trick users and capture clicks.',
      detectionMethod: 'X-Frame-Options and Content-Security-Policy header analysis',
      remediation: 'Add: X-Frame-Options: DENY or Content-Security-Policy: frame-ancestors \'none\'',
      owaspReference: 'OWASP A05:2021 - Security Misconfiguration',
    },
  },
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
  'Permissions-Policy no configurado': {
    es: {
      name: 'Permissions-Policy no configurado',
      description: 'El header Permissions-Policy no restringe el acceso a APIs del navegador como cámara, micrófono o geolocalización.',
      impact: 'Scripts maliciosos podrían acceder a APIs sensibles del navegador sin restricción.',
      detectionMethod: 'Análisis de cabeceras HTTP',
      remediation: 'Añadir: Permissions-Policy: camera=(), microphone=(), geolocation=()',
      owaspReference: 'OWASP A05:2021 - Security Misconfiguration',
    },
    en: {
      name: 'Permissions-Policy not configured',
      description: 'The Permissions-Policy header does not restrict access to browser APIs like camera, microphone or geolocation.',
      impact: 'Malicious scripts could access sensitive browser APIs without restriction.',
      detectionMethod: 'HTTP header analysis',
      remediation: 'Add: Permissions-Policy: camera=(), microphone=(), geolocation=()',
      owaspReference: 'OWASP A05:2021 - Security Misconfiguration',
    },
  },
  // HTTPS/Encryption
  'Sitio sin HTTPS': {
    es: {
      name: 'Sitio sin HTTPS',
      description: 'El sitio web no utiliza HTTPS. Toda la comunicación entre el usuario y el servidor se transmite en texto plano.',
      impact: 'Cualquier atacante en la red puede interceptar, leer y modificar toda la comunicación (credenciales, datos personales, sesiones).',
      detectionMethod: 'Verificación del protocolo de la URL',
      remediation: 'Instalar un certificado SSL/TLS (gratuito con Let\'s Encrypt) y redirigir todo el tráfico HTTP a HTTPS.',
      owaspReference: 'OWASP A02:2021 - Cryptographic Failures',
    },
    en: {
      name: 'Site without HTTPS',
      description: 'The website does not use HTTPS. All communication between user and server is transmitted in plain text.',
      impact: 'Any attacker on the network can intercept, read and modify all communication (credentials, personal data, sessions).',
      detectionMethod: 'URL protocol verification',
      remediation: 'Install an SSL/TLS certificate (free with Let\'s Encrypt) and redirect all HTTP traffic to HTTPS.',
      owaspReference: 'OWASP A02:2021 - Cryptographic Failures',
    },
  },
  // Information Disclosure
  'Versión del servidor expuesta': {
    es: {
      name: 'Versión del servidor expuesta',
      description: 'El servidor revela información sobre su software y versión. Esto facilita ataques dirigidos.',
      impact: 'Los atacantes pueden identificar versiones específicas con vulnerabilidades conocidas (CVEs) y explotarlas.',
      detectionMethod: 'Análisis del header Server en la respuesta HTTP',
      remediation: 'Configurar el servidor para ocultar la versión. En Apache: ServerTokens Prod. En Nginx: server_tokens off.',
      owaspReference: 'OWASP A05:2021 - Security Misconfiguration',
    },
    en: {
      name: 'Server version exposed',
      description: 'The server reveals information about its software and version. This facilitates targeted attacks.',
      impact: 'Attackers can identify specific versions with known vulnerabilities (CVEs) and exploit them.',
      detectionMethod: 'Server header analysis in HTTP response',
      remediation: 'Configure the server to hide the version. In Apache: ServerTokens Prod. In Nginx: server_tokens off.',
      owaspReference: 'OWASP A05:2021 - Security Misconfiguration',
    },
  },
  'Tecnología backend expuesta': {
    es: {
      name: 'Tecnología backend expuesta',
      description: 'El header X-Powered-By revela la tecnología del backend.',
      impact: 'Facilita ataques dirigidos a vulnerabilidades específicas del framework o lenguaje detectado.',
      detectionMethod: 'Análisis del header X-Powered-By',
      remediation: 'Eliminar el header X-Powered-By. En Express.js: app.disable(\'x-powered-by\'). En PHP: expose_php = Off.',
      owaspReference: 'OWASP A05:2021 - Security Misconfiguration',
    },
    en: {
      name: 'Backend technology exposed',
      description: 'The X-Powered-By header reveals the backend technology.',
      impact: 'Facilitates targeted attacks on specific vulnerabilities of the detected framework or language.',
      detectionMethod: 'X-Powered-By header analysis',
      remediation: 'Remove the X-Powered-By header. In Express.js: app.disable(\'x-powered-by\'). In PHP: expose_php = Off.',
      owaspReference: 'OWASP A05:2021 - Security Misconfiguration',
    },
  },
  'WordPress detectado': {
    es: {
      name: 'WordPress detectado',
      description: 'Se ha detectado WordPress como CMS. Los sitios WordPress son objetivos frecuentes de ataques automatizados.',
      impact: 'Si WordPress o sus plugins no están actualizados, pueden existir vulnerabilidades críticas conocidas.',
      detectionMethod: 'Análisis del código fuente HTML - rutas /wp-content/ y /wp-includes/',
      remediation: 'Mantener WordPress y todos los plugins actualizados. Usar un plugin de seguridad como Wordfence. Limitar intentos de login.',
      owaspReference: 'OWASP A06:2021 - Vulnerable and Outdated Components',
    },
    en: {
      name: 'WordPress detected',
      description: 'WordPress has been detected as the CMS. WordPress sites are frequent targets of automated attacks.',
      impact: 'If WordPress or its plugins are not updated, known critical vulnerabilities may exist.',
      detectionMethod: 'HTML source code analysis - /wp-content/ and /wp-includes/ paths',
      remediation: 'Keep WordPress and all plugins updated. Use a security plugin like Wordfence. Limit login attempts.',
      owaspReference: 'OWASP A06:2021 - Vulnerable and Outdated Components',
    },
  },
  // Cookie Security
  'Cookies sin flag HttpOnly': {
    es: {
      name: 'Cookies sin flag HttpOnly',
      description: 'Las cookies de sesión no tienen el flag HttpOnly. JavaScript del lado del cliente puede acceder a ellas.',
      impact: 'Un ataque XSS exitoso puede robar las cookies de sesión del usuario, permitiendo el secuestro de sesión.',
      detectionMethod: 'Análisis del header Set-Cookie en la respuesta HTTP',
      remediation: 'Añadir el atributo HttpOnly a todas las cookies de sesión: Set-Cookie: session=xxx; HttpOnly; Secure; SameSite=Strict',
      owaspReference: 'OWASP A02:2021 - Cryptographic Failures',
    },
    en: {
      name: 'Cookies without HttpOnly flag',
      description: 'Session cookies do not have the HttpOnly flag. Client-side JavaScript can access them.',
      impact: 'A successful XSS attack can steal the user\'s session cookies, enabling session hijacking.',
      detectionMethod: 'Set-Cookie header analysis in HTTP response',
      remediation: 'Add the HttpOnly attribute to all session cookies: Set-Cookie: session=xxx; HttpOnly; Secure; SameSite=Strict',
      owaspReference: 'OWASP A02:2021 - Cryptographic Failures',
    },
  },
  'Cookies sin flag Secure': {
    es: {
      name: 'Cookies sin flag Secure',
      description: 'Las cookies no tienen el flag Secure. Pueden transmitirse por conexiones HTTP no cifradas.',
      impact: 'Las cookies pueden ser interceptadas en redes no seguras (ataques man-in-the-middle).',
      detectionMethod: 'Análisis del header Set-Cookie',
      remediation: 'Añadir el atributo Secure a todas las cookies: Set-Cookie: session=xxx; Secure; HttpOnly',
      owaspReference: 'OWASP A02:2021 - Cryptographic Failures',
    },
    en: {
      name: 'Cookies without Secure flag',
      description: 'Cookies do not have the Secure flag. They can be transmitted over unencrypted HTTP connections.',
      impact: 'Cookies can be intercepted on insecure networks (man-in-the-middle attacks).',
      detectionMethod: 'Set-Cookie header analysis',
      remediation: 'Add the Secure attribute to all cookies: Set-Cookie: session=xxx; Secure; HttpOnly',
      owaspReference: 'OWASP A02:2021 - Cryptographic Failures',
    },
  },
  'Cookies sin atributo SameSite': {
    es: {
      name: 'Cookies sin atributo SameSite',
      description: 'Las cookies no tienen el atributo SameSite, lo que puede facilitar ataques CSRF.',
      impact: 'Sin SameSite, las cookies se envían en solicitudes cross-site, facilitando ataques CSRF.',
      detectionMethod: 'Análisis del header Set-Cookie',
      remediation: 'Añadir SameSite=Strict o SameSite=Lax a todas las cookies de sesión.',
      owaspReference: 'OWASP A01:2021 - Broken Access Control',
    },
    en: {
      name: 'Cookies without SameSite attribute',
      description: 'Cookies do not have the SameSite attribute, which can facilitate CSRF attacks.',
      impact: 'Without SameSite, cookies are sent in cross-site requests, facilitating CSRF attacks.',
      detectionMethod: 'Set-Cookie header analysis',
      remediation: 'Add SameSite=Strict or SameSite=Lax to all session cookies.',
      owaspReference: 'OWASP A01:2021 - Broken Access Control',
    },
  },
  // CSP
  'Content Security Policy (CSP) ausente': {
    es: {
      name: 'Content Security Policy (CSP) ausente',
      description: 'No se ha configurado una Content Security Policy. Sin CSP, el sitio es vulnerable a ataques XSS.',
      impact: 'Sin CSP, los ataques Cross-Site Scripting (XSS) pueden ejecutar código malicioso en el contexto del sitio.',
      detectionMethod: 'Análisis del header Content-Security-Policy',
      remediation: 'Implementar una CSP restrictiva: Content-Security-Policy: default-src \'self\'; script-src \'self\'; style-src \'self\' \'unsafe-inline\'',
      owaspReference: 'OWASP A03:2021 - Injection',
    },
    en: {
      name: 'Content Security Policy (CSP) missing',
      description: 'No Content Security Policy has been configured. Without CSP, the site is vulnerable to XSS attacks.',
      impact: 'Without CSP, Cross-Site Scripting (XSS) attacks can execute malicious code in the context of the site.',
      detectionMethod: 'Content-Security-Policy header analysis',
      remediation: 'Implement a restrictive CSP: Content-Security-Policy: default-src \'self\'; script-src \'self\'; style-src \'self\' \'unsafe-inline\'',
      owaspReference: 'OWASP A03:2021 - Injection',
    },
  },
  'CSP con directivas inseguras': {
    es: {
      name: 'CSP con directivas inseguras',
      description: 'La Content Security Policy contiene directivas inseguras (\'unsafe-inline\' o \'unsafe-eval\') que reducen su efectividad.',
      impact: 'Las directivas unsafe-inline y unsafe-eval permiten la ejecución de scripts inline, debilitando la protección XSS.',
      detectionMethod: 'Análisis del header Content-Security-Policy',
      remediation: 'Eliminar \'unsafe-inline\' y \'unsafe-eval\'. Usar nonces o hashes para scripts específicos.',
      owaspReference: 'OWASP A03:2021 - Injection',
    },
    en: {
      name: 'CSP with unsafe directives',
      description: 'The Content Security Policy contains unsafe directives (\'unsafe-inline\' or \'unsafe-eval\') that reduce its effectiveness.',
      impact: 'The unsafe-inline and unsafe-eval directives allow inline script execution, weakening XSS protection.',
      detectionMethod: 'Content-Security-Policy header analysis',
      remediation: 'Remove \'unsafe-inline\' and \'unsafe-eval\'. Use nonces or hashes for specific scripts.',
      owaspReference: 'OWASP A03:2021 - Injection',
    },
  },
  // CORS
  'CORS configurado con wildcard': {
    es: {
      name: 'CORS configurado con wildcard',
      description: 'El servidor permite solicitudes CORS desde cualquier origen (Access-Control-Allow-Origin: *). Esto puede exponer datos sensibles.',
      impact: 'Cualquier sitio web puede hacer solicitudes autenticadas a la API, potencialmente accediendo a datos sensibles.',
      detectionMethod: 'Análisis del header Access-Control-Allow-Origin',
      remediation: 'Restringir CORS a orígenes específicos: Access-Control-Allow-Origin: https://tudominio.com',
      owaspReference: 'OWASP A05:2021 - Security Misconfiguration',
    },
    en: {
      name: 'CORS configured with wildcard',
      description: 'The server allows CORS requests from any origin (Access-Control-Allow-Origin: *). This can expose sensitive data.',
      impact: 'Any website can make authenticated requests to the API, potentially accessing sensitive data.',
      detectionMethod: 'Access-Control-Allow-Origin header analysis',
      remediation: 'Restrict CORS to specific origins: Access-Control-Allow-Origin: https://yourdomain.com',
      owaspReference: 'OWASP A05:2021 - Security Misconfiguration',
    },
  },
  // Sensitive Files
  'Archivo .env expuesto': {
    es: {
      name: 'Archivo .env expuesto',
      description: 'El archivo .env es accesible públicamente. Puede contener información sensible como credenciales, claves API o configuración del servidor.',
      impact: 'Exposición de credenciales de base de datos, claves API y configuración sensible.',
      detectionMethod: 'Solicitud HTTP GET a /.env - Respuesta: 200',
      remediation: 'Bloquear el acceso al archivo .env mediante configuración del servidor web o moverlo fuera del directorio público.',
      owaspReference: 'OWASP A05:2021 - Security Misconfiguration',
    },
    en: {
      name: '.env file exposed',
      description: 'The .env file is publicly accessible. It may contain sensitive information such as credentials, API keys or server configuration.',
      impact: 'Exposure of database credentials, API keys and sensitive configuration.',
      detectionMethod: 'HTTP GET request to /.env - Response: 200',
      remediation: 'Block access to the .env file through web server configuration or move it outside the public directory.',
      owaspReference: 'OWASP A05:2021 - Security Misconfiguration',
    },
  },
  'Repositorio Git expuesto': {
    es: {
      name: 'Repositorio Git expuesto',
      description: 'El repositorio Git es accesible públicamente. Puede contener información sensible como credenciales, claves API o configuración del servidor.',
      impact: 'Exposición de credenciales de base de datos, claves API y configuración sensible.',
      detectionMethod: 'Solicitud HTTP GET a /.git/config - Respuesta: 200',
      remediation: 'Bloquear el acceso al directorio .git mediante configuración del servidor web o moverlo fuera del directorio público.',
      owaspReference: 'OWASP A05:2021 - Security Misconfiguration',
    },
    en: {
      name: 'Git repository exposed',
      description: 'The Git repository is publicly accessible. It may contain sensitive information such as credentials, API keys or server configuration.',
      impact: 'Exposure of database credentials, API keys and sensitive configuration.',
      detectionMethod: 'HTTP GET request to /.git/config - Response: 200',
      remediation: 'Block access to the .git directory through web server configuration or move it outside the public directory.',
      owaspReference: 'OWASP A05:2021 - Security Misconfiguration',
    },
  },
  // XSS Risk
  'Múltiples scripts inline detectados': {
    es: {
      name: 'Múltiples scripts inline detectados',
      description: 'Se detectaron múltiples scripts inline en el HTML. El uso excesivo de scripts inline dificulta la implementación de CSP y aumenta el riesgo de XSS.',
      impact: 'Los scripts inline son difíciles de proteger con CSP y pueden ser vectores de ataques XSS si el contenido no está correctamente sanitizado.',
      detectionMethod: 'Análisis del código fuente HTML',
      remediation: 'Mover los scripts a archivos externos y usar nonces o hashes en la CSP para los scripts necesarios inline.',
      owaspReference: 'OWASP A03:2021 - Injection',
    },
    en: {
      name: 'Multiple inline scripts detected',
      description: 'Multiple inline scripts were detected in the HTML. Excessive use of inline scripts makes CSP implementation difficult and increases XSS risk.',
      impact: 'Inline scripts are difficult to protect with CSP and can be XSS attack vectors if content is not properly sanitized.',
      detectionMethod: 'HTML source code analysis',
      remediation: 'Move scripts to external files and use nonces or hashes in CSP for necessary inline scripts.',
      owaspReference: 'OWASP A03:2021 - Injection',
    },
  },
  // CSRF
  'Posible falta de protección CSRF': {
    es: {
      name: 'Posible falta de protección CSRF',
      description: 'Se encontraron formularios sin indicadores visibles de protección CSRF (tokens anti-CSRF).',
      impact: 'Sin protección CSRF, atacantes pueden hacer que usuarios autenticados ejecuten acciones no deseadas.',
      detectionMethod: 'Análisis del código fuente HTML - búsqueda de tokens CSRF en formularios',
      remediation: 'Implementar tokens CSRF en todos los formularios. Usar el patrón Synchronizer Token o Double Submit Cookie.',
      owaspReference: 'OWASP A01:2021 - Broken Access Control',
    },
    en: {
      name: 'Possible lack of CSRF protection',
      description: 'Forms were found without visible indicators of CSRF protection (anti-CSRF tokens).',
      impact: 'Without CSRF protection, attackers can make authenticated users perform unwanted actions.',
      detectionMethod: 'HTML source code analysis - search for CSRF tokens in forms',
      remediation: 'Implement CSRF tokens in all forms. Use the Synchronizer Token or Double Submit Cookie pattern.',
      owaspReference: 'OWASP A01:2021 - Broken Access Control',
    },
  },
  // Infrastructure
  'Subdominios expuestos detectados': {
    es: {
      name: 'Subdominios expuestos detectados',
      description: 'Se detectaron subdominios accesibles que pueden revelar servicios internos, APIs de desarrollo o paneles de administración.',
      impact: 'Subdominios expuestos pueden revelar servicios internos, APIs de desarrollo o paneles de administración.',
      detectionMethod: 'Enumeración de subdominios comunes y verificación de DNS',
      remediation: 'Restringir acceso a subdominios internos, usar autenticación fuerte, implementar WAF y limitar DNS público.',
      owaspReference: 'OWASP A01:2021 - Broken Access Control',
    },
    en: {
      name: 'Exposed subdomains detected',
      description: 'Accessible subdomains were detected that may reveal internal services, development APIs or admin panels.',
      impact: 'Exposed subdomains can reveal internal services, development APIs or admin panels.',
      detectionMethod: 'Common subdomain enumeration and DNS verification',
      remediation: 'Restrict access to internal subdomains, use strong authentication, implement WAF and limit public DNS.',
      owaspReference: 'OWASP A01:2021 - Broken Access Control',
    },
  },
  'Puertos peligrosos abiertos detectados': {
    es: {
      name: 'Puertos peligrosos abiertos detectados',
      description: 'Se detectaron puertos peligrosos abiertos (bases de datos, servicios administrativos, etc.).',
      impact: 'Puertos abiertos de bases de datos o servicios administrativos pueden permitir acceso no autorizado y comprometer datos sensibles.',
      detectionMethod: 'Escaneo de puertos TCP comunes',
      remediation: 'Cerrar puertos innecesarios con firewall. Usar VPN o IP whitelist para acceso administrativo. Cambiar puertos por defecto.',
      owaspReference: 'OWASP A05:2021 - Security Misconfiguration',
    },
    en: {
      name: 'Dangerous open ports detected',
      description: 'Dangerous open ports were detected (databases, administrative services, etc.).',
      impact: 'Open database or administrative service ports can allow unauthorized access and compromise sensitive data.',
      detectionMethod: 'Common TCP port scanning',
      remediation: 'Close unnecessary ports with firewall. Use VPN or IP whitelist for administrative access. Change default ports.',
      owaspReference: 'OWASP A05:2021 - Security Misconfiguration',
    },
  },
  'Múltiples puertos abiertos detectados': {
    es: {
      name: 'Múltiples puertos abiertos detectados',
      description: 'Se detectaron múltiples puertos abiertos que pueden revelar servicios internos.',
      impact: 'Puertos abiertos innecesarios aumentan la superficie de ataque y pueden revelar servicios internos.',
      detectionMethod: 'Escaneo de puertos TCP comunes',
      remediation: 'Revisar qué puertos son realmente necesarios. Cerrar los que no se utilicen. Implementar firewall restrictivo.',
      owaspReference: 'OWASP A05:2021 - Security Misconfiguration',
    },
    en: {
      name: 'Multiple open ports detected',
      description: 'Multiple open ports were detected that may reveal internal services.',
      impact: 'Unnecessary open ports increase the attack surface and can reveal internal services.',
      detectionMethod: 'Common TCP port scanning',
      remediation: 'Review which ports are really necessary. Close unused ones. Implement restrictive firewall.',
      owaspReference: 'OWASP A05:2021 - Security Misconfiguration',
    },
  },
  // Certificates
  'Certificado TLS próximo a expirar': {
    es: {
      name: 'Certificado TLS próximo a expirar',
      description: 'El certificado TLS expirará pronto.',
      impact: 'Cuando expire el certificado, los navegadores mostrarán advertencias de seguridad y los usuarios no podrán acceder al sitio.',
      detectionMethod: 'Análisis de fecha de expiración del certificado TLS/SSL',
      remediation: 'Renovar el certificado TLS inmediatamente. Configurar renovación automática con herramientas como Certbot o Let\'s Encrypt.',
      owaspReference: 'OWASP A05:2021 - Security Misconfiguration',
    },
    en: {
      name: 'TLS certificate expiring soon',
      description: 'The TLS certificate will expire soon.',
      impact: 'When the certificate expires, browsers will show security warnings and users will not be able to access the site.',
      detectionMethod: 'TLS/SSL certificate expiration date analysis',
      remediation: 'Renew the TLS certificate immediately. Configure automatic renewal with tools like Certbot or Let\'s Encrypt.',
      owaspReference: 'OWASP A05:2021 - Security Misconfiguration',
    },
  },
  'Certificado TLS con clave débil': {
    es: {
      name: 'Certificado TLS con clave débil',
      description: 'El certificado utiliza una clave RSA débil (menor a 2048 bits).',
      impact: 'Claves débiles pueden ser factorizadas, comprometiendo la seguridad del cifrado TLS.',
      detectionMethod: 'Análisis del tamaño de clave del certificado TLS',
      remediation: 'Generar un nuevo certificado con clave de al menos 2048 bits (preferiblemente 4096).',
      owaspReference: 'OWASP A02:2021 - Cryptographic Failures',
    },
    en: {
      name: 'TLS certificate with weak key',
      description: 'The certificate uses a weak RSA key (less than 2048 bits).',
      impact: 'Weak keys can be factored, compromising the security of TLS encryption.',
      detectionMethod: 'TLS certificate key size analysis',
      remediation: 'Generate a new certificate with a key of at least 2048 bits (preferably 4096).',
      owaspReference: 'OWASP A02:2021 - Cryptographic Failures',
    },
  },
  // Server Configuration
  'Versión ASP.NET expuesta': {
    es: {
      name: 'Versión ASP.NET expuesta',
      description: 'El header X-AspNet-Version revela la versión de ASP.NET.',
      impact: 'Permite a atacantes identificar versiones específicas de ASP.NET con vulnerabilidades conocidas.',
      detectionMethod: 'Análisis del header X-AspNet-Version',
      remediation: 'Añadir en web.config: <httpRuntime enableVersionHeader=\'false\' />',
      owaspReference: 'OWASP A05:2021 - Security Misconfiguration',
    },
    en: {
      name: 'ASP.NET version exposed',
      description: 'The X-AspNet-Version header reveals the ASP.NET version.',
      impact: 'Allows attackers to identify specific ASP.NET versions with known vulnerabilities.',
      detectionMethod: 'X-AspNet-Version header analysis',
      remediation: 'Add in web.config: <httpRuntime enableVersionHeader=\'false\' />',
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
