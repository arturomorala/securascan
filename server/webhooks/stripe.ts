import { Request, Response } from "express";
import { constructWebhookEvent } from "../stripe";
import { getDb } from "../db";
import { users, subscriptions } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Procesar evento de pago completado
 */
async function handlePaymentIntentSucceeded(event: any) {
  const paymentIntent = event.data.object;
  const customerId = paymentIntent.customer;

  if (!customerId) {
    console.warn("[Webhook] Payment intent sin customer ID");
    return;
  }

  console.log(`[Webhook] Pago completado para cliente: ${customerId}`);
  // El cliente ya está creado en Stripe, la suscripción se manejará en checkout.session.completed
}

/**
 * Procesar evento de suscripción actualizada
 */
async function handleCustomerSubscriptionUpdated(event: any) {
  const subscription = event.data.object;
  const customerId = subscription.customer;
  const stripeSubscriptionId = subscription.id;
  const status = subscription.status;

  if (!customerId) {
    console.warn("[Webhook] Suscripción sin customer ID");
    return;
  }

  try {
    const db = await getDb();
    if (!db) {
      console.error("[Webhook] Database not available");
      return;
    }

    // Buscar usuario por stripeCustomerId
    const user = await db
      .select()
      .from(users)
      .where(eq(users.stripeCustomerId, customerId as string))
      .limit(1);

    if (!user || user.length === 0) {
      console.warn(`[Webhook] Usuario no encontrado para cliente Stripe: ${customerId}`);
      return;
    }

    const userId = user[0].id;
    const priceId = subscription.items.data[0]?.price.id;

    // Determinar el plan basado en el precio
    let plan: "basic" | "professional" | "enterprise" = "basic";
    if (priceId?.includes("professional")) plan = "professional";
    if (priceId?.includes("enterprise")) plan = "enterprise";

    // Mapear estado de Stripe a nuestro enum
    let mappedStatus: "active" | "inactive" | "cancelled" | "past_due" = "inactive";
    if (status === "active" || status === "trialing") mappedStatus = "active";
    if (status === "past_due") mappedStatus = "past_due";
    if (status === "canceled") mappedStatus = "cancelled";

    // Actualizar o crear suscripción
    const currentPeriodStart = new Date(subscription.current_period_start * 1000);
    const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

    await db
      .insert(subscriptions)
      .values({
        userId,
        plan,
        status: mappedStatus,
        stripeCustomerId: customerId as string,
        stripeSubscriptionId,
        stripePriceId: priceId,
        currentPeriodStart,
        currentPeriodEnd,
      })
      .onDuplicateKeyUpdate({
        set: {
          plan,
          status: mappedStatus,
          stripeSubscriptionId,
          stripePriceId: priceId,
          currentPeriodStart,
          currentPeriodEnd,
        },
      });

    console.log(`[Webhook] Suscripción actualizada para usuario ${userId}: ${plan} (${status})`);
  } catch (error) {
    console.error("[Webhook] Error procesando suscripción actualizada:", error);
    throw error;
  }
}

/**
 * Procesar evento de suscripción cancelada
 */
async function handleCustomerSubscriptionDeleted(event: any) {
  const subscription = event.data.object;
  const customerId = subscription.customer;
  const stripeSubscriptionId = subscription.id;

  if (!customerId) {
    console.warn("[Webhook] Suscripción eliminada sin customer ID");
    return;
  }

  try {
    const db = await getDb();
    if (!db) {
      console.error("[Webhook] Database not available");
      return;
    }

    // Buscar usuario por stripeCustomerId
    const user = await db
      .select()
      .from(users)
      .where(eq(users.stripeCustomerId, customerId as string))
      .limit(1);

    if (!user || user.length === 0) {
      console.warn(`[Webhook] Usuario no encontrado para cliente Stripe: ${customerId}`);
      return;
    }

    const userId = user[0].id;

    // Actualizar suscripción a cancelada
    await db
      .insert(subscriptions)
      .values({
        userId,
        plan: "basic",
        status: "cancelled" as const,
        stripeCustomerId: customerId as string,
        stripeSubscriptionId,
        stripePriceId: null,
        currentPeriodEnd: null,
      })
      .onDuplicateKeyUpdate({
        set: {
          status: "cancelled" as const,
          stripePriceId: null,
          currentPeriodEnd: null,
        },
      });

    console.log(`[Webhook] Suscripción cancelada para usuario ${userId}`);
  } catch (error) {
    console.error("[Webhook] Error procesando suscripción cancelada:", error);
    throw error;
  }
}

/**
 * Procesar evento de sesión de checkout completada
 */
async function handleCheckoutSessionCompleted(event: any) {
  const session = event.data.object;
  const customerId = session.customer;
  const subscriptionId = session.subscription;

  if (!customerId || !subscriptionId) {
    console.warn("[Webhook] Sesión de checkout sin customer o subscription ID");
    return;
  }

  try {
    const db = await getDb();
    if (!db) {
      console.error("[Webhook] Database not available");
      return;
    }

    // Buscar usuario por stripeCustomerId
    const user = await db
      .select()
      .from(users)
      .where(eq(users.stripeCustomerId, customerId as string))
      .limit(1);

    if (!user || user.length === 0) {
      console.warn(`[Webhook] Usuario no encontrado para cliente Stripe: ${customerId}`);
      return;
    }

    console.log(`[Webhook] Sesión de checkout completada para usuario ${user[0].id}`);
    // La suscripción se actualizará cuando Stripe envíe el evento customer.subscription.updated
  } catch (error) {
    console.error("[Webhook] Error procesando sesión de checkout:", error);
    throw error;
  }
}

/**
 * Procesar evento de cliente actualizado (para guardar stripeCustomerId en usuario)
 */
async function handleCustomerUpdated(event: any) {
  const customer = event.data.object;
  const customerId = customer.id;
  const email = customer.email;

  if (!customerId || !email) {
    console.warn("[Webhook] Cliente sin ID o email");
    return;
  }

  try {
    const db = await getDb();
    if (!db) {
      console.error("[Webhook] Database not available");
      return;
    }

    // Buscar usuario por email
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user || user.length === 0) {
      console.warn(`[Webhook] Usuario no encontrado con email: ${email}`);
      return;
    }

    // Actualizar stripeCustomerId si no lo tiene
    if (!user[0].stripeCustomerId) {
      await db
        .insert(users)
        .values({
          openId: user[0].openId,
          stripeCustomerId: customerId,
        })
        .onDuplicateKeyUpdate({
          set: { stripeCustomerId: customerId },
        });

      console.log(`[Webhook] stripeCustomerId guardado para usuario ${user[0].id}`);
    }
  } catch (error) {
    console.error("[Webhook] Error procesando cliente actualizado:", error);
    throw error;
  }
}

/**
 * Handler principal de webhooks de Stripe
 */
export async function handleStripeWebhook(req: Request, res: Response) {
  const signature = req.headers["stripe-signature"];

  if (!signature) {
    console.error("[Webhook] Signature no encontrada");
    return res.status(400).json({ error: "Signature requerida" });
  }

  try {
    // Obtener raw body como string (Express    // Construir y validar evento
    // Para Express raw body, necesitamos obtenerlo del middleware
    let rawBody: string;
    if (typeof req.body === "string") {
      rawBody = req.body;
    } else if (Buffer.isBuffer(req.body)) {
      rawBody = req.body.toString("utf-8");
    } else {
      rawBody = JSON.stringify(req.body);
    };

    // Construir y validar evento
    const event = constructWebhookEvent(rawBody, signature as string);

    console.log(`[Webhook] Evento recibido: ${event.type}`);

    // Procesar diferentes tipos de eventos
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event);
        break;

      case "customer.subscription.updated":
        await handleCustomerSubscriptionUpdated(event);
        break;

      case "customer.subscription.deleted":
        await handleCustomerSubscriptionDeleted(event);
        break;

      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event);
        break;

      case "customer.updated":
        await handleCustomerUpdated(event);
        break;

      default:
        console.log(`[Webhook] Evento no manejado: ${event.type}`);
    }

    // Responder a Stripe que recibimos el evento
    res.json({ received: true });
  } catch (error) {
    console.error("[Webhook] Error procesando webhook:", error);
    res.status(400).json({ error: String(error) });
  }
}
