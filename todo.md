# SecuraScan - TODO

## Fase 1: Base de datos y estructura del proyecto
- [x] Diseñar esquema de base de datos (users, scans, vulnerabilities, subscriptions, reports)
- [x] Migrar esquema a la base de datos
- [x] Configurar helpers de DB en server/db.ts
- [x] Configurar tema oscuro profesional en index.css

## Fase 2: Landing Page
- [x] Hero section con CTA principal y animaciones
- [x] Sección "Cómo funciona" con pasos visuales
- [x] Sección de tipos de vulnerabilidades detectadas
- [x] Sección de precios (Básico, Profesional, Empresarial)
- [x] Sección de testimonios
- [x] Sección FAQ
- [x] Footer profesional con links legales
- [x] Navegación principal con login/registro

## Fase 3: Autenticación, Panel de Usuario y Motor de Escaneo
- [x] Sistema de autenticación con roles (user/admin)
- [x] Panel de usuario con historial de escaneos
- [x] Formulario de nuevo escaneo con validación de URL
- [x] Motor de escaneo de vulnerabilidades (análisis de headers, HTTPS, cookies, CSP, etc.)
- [x] Progreso de escaneo en tiempo real con estados
- [x] Resultado del escaneo con resumen de vulnerabilidades
- [x] Sistema de scoring de seguridad (0-100)

## Fase 4: IA, PDF y S3
- [x] Integración con LLM para explicar vulnerabilidades
- [x] Tres niveles de explicación (básico, técnico, experto)
- [x] Generación de PDF profesional con logo, resumen ejecutivo y vulnerabilidades
- [x] Almacenamiento de PDF en S3
- [x] Descarga de informes desde panel de usuario

## Fase 5: Stripe, Admin y Notificaciones
- [x] Integración con Stripe para suscripciones (Básico 19€, Profesional 49€, Empresarial 199€)
- [x] Checkout session para desbloquear informes
- [x] Panel de administrador con estadísticas
- [x] Gestión de usuarios desde admin
- [x] Monitoreo de escaneos desde admin
- [x] Notificaciones al propietario cuando se detectan vulnerabilidades críticas
- [ ] Notificaciones por email a usuarios (requiere configuración SMTP externa)

## Fase 6: Pruebas y Entrega
- [x] 18 tests unitarios con Vitest (auth, scans, admin, stripe)
- [x] Checkpoint final
- [x] Páginas legales (Términos, Privacidad)


## Fase 7: Ampliación del motor de escaneo
- [x] Detección de subdominios expuestos (búsqueda en DNS, CNAME)
- [x] Análisis de certificados TLS (expiración, validez, cadena)
- [x] Escaneo de puertos abiertos (top 100 puertos comunes)
- [x] Nuevas categorías de vulnerabilidades (Infrastructure, Certificates)
- [x] Pruebas unitarias para nuevas funcionalidades (17 tests pasando)


## Fase 8: Integración de Stripe
- [x] Configurar secretos de Stripe (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET)
- [x] Instalar dependencias (stripe, @stripe/stripe-js)
- [x] Crear módulo stripe.ts con helpers para clientes y sesiones
- [x] Crear router de Stripe con procedimientos (getPlans, createCheckout, getCurrentSubscription, cancelSubscription)
- [x] Implementar página de checkout con planes disponibles
- [x] Corregir inicialización lazy de Stripe para evitar errores en pruebas
- [x] Todas las pruebas pasando (35 tests)


## Fase 9: Webhook Handler de Stripe
- [x] Crear endpoint /api/stripe/webhook
- [x] Implementar handlers para payment_intent.succeeded
- [x] Implementar handlers para customer.subscription.updated
- [x] Implementar handlers para customer.subscription.deleted
- [x] Actualizar base de datos con información de suscripciones
- [x] Pruebas unitarias para webhook handler (11 tests pasando)
- [x] Registrar webhook endpoint en Express server


## Bugs Corregidos
- [x] Error NotFoundError al desbloquear informe - Corregido: returnUrl ahora usa window.location.origin, CheckoutPage registrada en rutas, session_id parseado correctamente desde query params
- [x] Error insertBefore persistente en DOM - Corregido: Se eliminaron todas las anclas anidadas (Link dentro de Button y viceversa) en Home, ScanPage, Dashboard y PricingPage. Ahora usan estructura válida: <Link><a><Button/></a></Link>


## Bugs Corregidos (Sesión Actual)
- [x] Error insertBefore al desbloquear informe - Solucionado: Procedimiento unlockReport ahora es gratis (0€), no usa Stripe
- [x] Cambiar precio de desbloqueo de informe a 0€ - Completado: Botón ahora dice "Desbloquear informe — Gratis"


## Fase 10: Solución de Vulnerabilidades de Seguridad (Escaneo Automatizado)

### ALTO (Crítico):
- [x] HSTS no configurado - Agregado header Strict-Transport-Security
- [x] Content Security Policy (CSP) ausente - Implementada CSP restrictiva

### MEDIO:
- [x] Protección Clickjacking ausente - Agregado X-Frame-Options: DENY
- [x] Múltiples puertos abiertos - Gestionados por Manus

### BAJO:
- [x] X-Content-Type-Options no configurado - Agregado header nosniff
- [x] Referrer-Policy no configurado - Agregado header strict-origin-when-cross-origin
- [x] Permissions-Policy no configurado - Agregado header para restricción de APIs
- [x] Versión del servidor expuesta - Oculto header Server


## Fase 11: Rate Limiting y Protección contra Ataques
- [x] Crear middleware de Rate Limiting en memoria
- [x] Aplicar Rate Limiting a endpoints de escaneo (10 escaneos/hora por usuario)
- [x] Aplicar Rate Limiting a webhook de Stripe (100 requests/min)
- [x] Escribir pruebas unitarias para Rate Limiting (8 tests pasando)
- [x] Verificar que Rate Limiting funciona correctamente (52 tests totales pasando)

## Fase 12: Logging de Seguridad y Auditoría
- [x] Diseñar esquema de logging de seguridad y actualizar base de datos
- [x] Crear helpers y middleware para registrar eventos de seguridad
- [x] Integrar logging en endpoints críticos (login, escaneo, admin)
- [x] Implementar detección de patrones sospechosos y alertas
- [x] Escribir pruebas unitarias para logging de seguridad
- [x] Crear página de auditoría en panel de admin (procedimientos tRPC: securityStats, auditLog)
