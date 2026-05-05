import axios from 'axios';

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_URL = 'https://api.brevo.com/v3';

interface EmailPayload {
  to: Array<{ email: string; name?: string }>;
  subject: string;
  htmlContent: string;
  sender: { email: string; name: string };
  replyTo?: { email: string; name?: string };
}

/**
 * Send email using Brevo API
 */
export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  try {
    if (!BREVO_API_KEY) {
      console.error('[Email] BREVO_API_KEY not configured');
      return false;
    }

    const response = await axios.post(`${BREVO_API_URL}/smtp/email`, payload, {
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    console.log('[Email] Sent successfully:', response.data);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send:', error);
    return false;
  }
}

/**
 * Send payment confirmation email for One-Time Scan
 */
export async function sendOneTimeScanConfirmation(
  userEmail: string,
  userName: string,
  amount: number,
  transactionId: string,
  dashboardUrl: string
): Promise<boolean> {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .section { margin: 20px 0; padding: 15px; background: white; border-left: 4px solid #667eea; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
          table { width: 100%; border-collapse: collapse; }
          td { padding: 10px; border-bottom: 1px solid #eee; }
          .label { font-weight: bold; color: #667eea; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Pago Confirmado</h1>
            <p>Tu escaneo está listo</p>
          </div>
          
          <div class="content">
            <p>Hola <strong>${userName}</strong>,</p>
            
            <p>¡Gracias por tu compra! 🎉</p>
            
            <p>Tu pago de <strong>€${(amount / 100).toFixed(2)}</strong> ha sido procesado exitosamente.</p>
            
            <div class="section">
              <h3>📋 Detalles de tu Compra</h3>
              <table>
                <tr>
                  <td class="label">Producto:</td>
                  <td>One-Time Scan</td>
                </tr>
                <tr>
                  <td class="label">Precio:</td>
                  <td>€${(amount / 100).toFixed(2)}</td>
                </tr>
                <tr>
                  <td class="label">Fecha:</td>
                  <td>${new Date().toLocaleDateString('es-ES')}</td>
                </tr>
                <tr>
                  <td class="label">ID Transacción:</td>
                  <td>${transactionId}</td>
                </tr>
                <tr>
                  <td class="label">Estado:</td>
                  <td>✅ Completado</td>
                </tr>
              </table>
            </div>
            
            <div class="section">
              <h3>🚀 ¿Qué Sigue?</h3>
              <p>Ya tienes 1 escaneo completo disponible. Puedes:</p>
              <ol>
                <li>Ir a tu Panel de Control</li>
                <li>Hacer clic en "New Scan"</li>
                <li>Ingresar la URL de tu web</li>
                <li>¡Obtener tu reporte en 2-5 minutos!</li>
              </ol>
              <a href="${dashboardUrl}" class="button">Ir a Mi Panel</a>
            </div>
            
            <div class="section">
              <h3>📦 Tu Reporte Incluye</h3>
              <ul>
                <li>✅ Puntuación de seguridad (0-100)</li>
                <li>✅ Todas las vulnerabilidades (detalle completo)</li>
                <li>✅ Explicaciones con IA (claras y técnicas)</li>
                <li>✅ Recomendaciones paso a paso</li>
                <li>✅ PDF profesional descargable</li>
                <li>✅ Listo para presentar a clientes</li>
              </ul>
            </div>
            
            <div class="section">
              <h3>❓ Preguntas Frecuentes</h3>
              <p><strong>P: ¿Cuándo expira mi escaneo?</strong><br>
              R: Puedes usarlo en cualquier momento. No expira.</p>
              
              <p><strong>P: ¿Puedo escanear múltiples webs?</strong><br>
              R: Sí, puedes usar tu escaneo en cualquier URL.</p>
              
              <p><strong>P: ¿Necesito hacer algo más?</strong><br>
              R: No, solo ve a tu panel y comienza a escanear.</p>
            </div>
            
            <p>¿Necesitas ayuda?</p>
            <p>
              📧 support@securascan.com<br>
              💬 Chat en vivo disponible<br>
              📞 +34 XXX XXX XXX
            </p>
            
            <p>Gracias por confiar en SecuraScan.</p>
            <p><strong>Equipo SecuraScan</strong></p>
          </div>
          
          <div class="footer">
            <p>© 2026 SecuraScan. Todos los derechos reservados.</p>
            <p>Este es un email automático, por favor no respondas a este mensaje.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: [{ email: userEmail, name: userName }],
    subject: '✅ Pago Confirmado - Tu Escaneo Está Listo',
    htmlContent,
    sender: { email: 'noreply@securascan.com', name: 'SecuraScan' },
    replyTo: { email: 'support@securascan.com', name: 'SecuraScan Support' },
  });
}

/**
 * Send subscription confirmation email for Pro plan
 */
export async function sendProSubscriptionConfirmation(
  userEmail: string,
  userName: string,
  amount: number,
  transactionId: string,
  dashboardUrl: string
): Promise<boolean> {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .section { margin: 20px 0; padding: 15px; background: white; border-left: 4px solid #667eea; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
          table { width: 100%; border-collapse: collapse; }
          td { padding: 10px; border-bottom: 1px solid #eee; }
          .label { font-weight: bold; color: #667eea; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Bienvenido a SecuraScan Pro</h1>
            <p>Acceso Ilimitado Activado</p>
          </div>
          
          <div class="content">
            <p>Hola <strong>${userName}</strong>,</p>
            
            <p>¡Bienvenido a SecuraScan Pro! 🚀</p>
            
            <p>Tu suscripción ha sido activada exitosamente.</p>
            
            <div class="section">
              <h3>📋 Detalles de tu Suscripción</h3>
              <table>
                <tr>
                  <td class="label">Plan:</td>
                  <td>Pro</td>
                </tr>
                <tr>
                  <td class="label">Precio:</td>
                  <td>€${(amount / 100).toFixed(2)}/mes</td>
                </tr>
                <tr>
                  <td class="label">Fecha de Inicio:</td>
                  <td>${new Date().toLocaleDateString('es-ES')}</td>
                </tr>
                <tr>
                  <td class="label">Próxima Renovación:</td>
                  <td>${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('es-ES')}</td>
                </tr>
                <tr>
                  <td class="label">ID Suscripción:</td>
                  <td>${transactionId}</td>
                </tr>
                <tr>
                  <td class="label">Estado:</td>
                  <td>✅ Activo</td>
                </tr>
              </table>
            </div>
            
            <div class="section">
              <h3>🎁 Lo que Incluye tu Plan Pro</h3>
              <ul>
                <li>✅ Escaneos ILIMITADOS</li>
                <li>✅ 1 sitio web</li>
                <li>✅ 1 usuario</li>
                <li>✅ Monitoreo continuo</li>
                <li>✅ Historial completo</li>
                <li>✅ Reportes PDF ilimitados</li>
                <li>✅ Explicaciones con IA ilimitadas</li>
              </ul>
            </div>
            
            <div class="section">
              <h3>🚀 Próximos Pasos</h3>
              <ol>
                <li>Ve a tu Panel de Control</li>
                <li>Haz clic en "New Scan"</li>
                <li>¡Comienza a escanear ilimitadamente!</li>
              </ol>
              <a href="${dashboardUrl}" class="button">Ir a Mi Panel</a>
            </div>
            
            <div class="section">
              <h3>💡 Consejos para Máxima Seguridad</h3>
              <ol>
                <li>Escanea tu web esta semana</li>
                <li>Arregla las vulnerabilidades críticas primero</li>
                <li>Escanea de nuevo en 1-2 semanas</li>
                <li>Repite mensualmente para monitoreo continuo</li>
              </ol>
            </div>
            
            <div class="section">
              <h3>❓ ¿Cómo Cancelo?</h3>
              <p>Puedes cancelar en cualquier momento desde tu Panel:</p>
              <ol>
                <li>Ve a "Información de Suscripción"</li>
                <li>Haz clic en "Cancel Subscription"</li>
                <li>Confirma</li>
              </ol>
              <p>Tu acceso continuará hasta fin de mes.</p>
            </div>
            
            <p>¿Necesitas ayuda?</p>
            <p>
              📧 support@securascan.com<br>
              💬 Chat en vivo disponible<br>
              📞 +34 XXX XXX XXX
            </p>
            
            <p>Gracias por elegir SecuraScan Pro.</p>
            <p><strong>Equipo SecuraScan</strong></p>
          </div>
          
          <div class="footer">
            <p>© 2026 SecuraScan. Todos los derechos reservados.</p>
            <p>Este es un email automático, por favor no respondas a este mensaje.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: [{ email: userEmail, name: userName }],
    subject: '🎉 Bienvenido a SecuraScan Pro - Acceso Ilimitado',
    htmlContent,
    sender: { email: 'noreply@securascan.com', name: 'SecuraScan' },
    replyTo: { email: 'support@securascan.com', name: 'SecuraScan Support' },
  });
}

/**
 * Send subscription confirmation email for Business plan
 */
export async function sendBusinessSubscriptionConfirmation(
  userEmail: string,
  userName: string,
  amount: number,
  transactionId: string,
  dashboardUrl: string
): Promise<boolean> {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .section { margin: 20px 0; padding: 15px; background: white; border-left: 4px solid #667eea; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
          table { width: 100%; border-collapse: collapse; }
          td { padding: 10px; border-bottom: 1px solid #eee; }
          .label { font-weight: bold; color: #667eea; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Bienvenido a SecuraScan Business</h1>
            <p>Solución Empresarial Activada</p>
          </div>
          
          <div class="content">
            <p>Hola <strong>${userName}</strong>,</p>
            
            <p>¡Bienvenido a SecuraScan Business! 🚀</p>
            
            <p>Tu suscripción empresarial ha sido activada exitosamente.</p>
            
            <div class="section">
              <h3>📋 Detalles de tu Suscripción</h3>
              <table>
                <tr>
                  <td class="label">Plan:</td>
                  <td>Business</td>
                </tr>
                <tr>
                  <td class="label">Precio:</td>
                  <td>€${(amount / 100).toFixed(2)}/mes</td>
                </tr>
                <tr>
                  <td class="label">Fecha de Inicio:</td>
                  <td>${new Date().toLocaleDateString('es-ES')}</td>
                </tr>
                <tr>
                  <td class="label">Próxima Renovación:</td>
                  <td>${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('es-ES')}</td>
                </tr>
                <tr>
                  <td class="label">ID Suscripción:</td>
                  <td>${transactionId}</td>
                </tr>
                <tr>
                  <td class="label">Estado:</td>
                  <td>✅ Activo</td>
                </tr>
              </table>
            </div>
            
            <div class="section">
              <h3>🎁 Lo que Incluye tu Plan Business</h3>
              <ul>
                <li>✅ Múltiples sitios web</li>
                <li>✅ Múltiples usuarios</li>
                <li>✅ Escaneos ILIMITADOS</li>
                <li>✅ Escaneos automáticos programados</li>
                <li>✅ Acceso a API</li>
                <li>✅ Soporte prioritario</li>
                <li>✅ Reportes automáticos por email</li>
              </ul>
            </div>
            
            <div class="section">
              <h3>🚀 Próximos Pasos</h3>
              <ol>
                <li>Ve a tu Panel de Control</li>
                <li>Configura tus múltiples sitios web</li>
                <li>Invita a miembros de tu equipo</li>
                <li>¡Comienza a escanear!</li>
              </ol>
              <a href="${dashboardUrl}" class="button">Ir a Mi Panel</a>
            </div>
            
            <div class="section">
              <h3>📞 Soporte Prioritario</h3>
              <p>Como cliente Business, tienes acceso a soporte prioritario:</p>
              <p>
                📧 business@securascan.com<br>
                💬 Chat prioritario disponible<br>
                📞 +34 XXX XXX XXX
              </p>
            </div>
            
            <p>Gracias por elegir SecuraScan Business.</p>
            <p><strong>Equipo SecuraScan</strong></p>
          </div>
          
          <div class="footer">
            <p>© 2026 SecuraScan. Todos los derechos reservados.</p>
            <p>Este es un email automático, por favor no respondas a este mensaje.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: [{ email: userEmail, name: userName }],
    subject: '🎉 Bienvenido a SecuraScan Business - Solución Empresarial',
    htmlContent,
    sender: { email: 'noreply@securascan.com', name: 'SecuraScan' },
    replyTo: { email: 'support@securascan.com', name: 'SecuraScan Support' },
  });
}
