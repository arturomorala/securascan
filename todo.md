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
