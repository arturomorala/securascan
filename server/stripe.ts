import Stripe from "stripe";
import { ENV } from "./_core/env";

let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!_stripe && ENV.stripeSecretKey) {
    _stripe = new Stripe(ENV.stripeSecretKey);
  }
  if (!_stripe) {
    throw new Error("Stripe API key not configured");
  }
  return _stripe;
}

export { getStripe };
export const stripe = { get instance() { return getStripe(); } };

/**
 * Crear o recuperar cliente de Stripe
 */
export async function getOrCreateStripeCustomer(userId: number, email: string, name?: string) {
  try {
    // Buscar cliente existente por email
    const customers = await getStripe().customers.list({
      email,
      limit: 1,
    });

    if (customers.data.length > 0) {
      return customers.data[0];
    }

    // Crear nuevo cliente
    const customer = await getStripe().customers.create({
      email,
      name: name || email,
      metadata: {
        userId: String(userId),
      },
    });

    return customer;
  } catch (error) {
    console.error("[Stripe] Error getting/creating customer:", error);
    throw error;
  }
}

/**
 * Crear sesión de checkout para suscripción
 */
export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  returnUrl: string
) {
  try {
    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: returnUrl,
      billing_address_collection: "auto",
    });

    return session;
  } catch (error) {
    console.error("[Stripe] Error creating checkout session:", error);
    throw error;
  }
}

/**
 * Crear sesión de checkout para pago único
 */
export async function createPaymentCheckoutSession(
  customerId: string,
  amount: number,
  currency: string,
  description: string,
  returnUrl: string
) {
  try {
    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: description,
            },
            unit_amount: amount, // en centavos
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: returnUrl,
      billing_address_collection: "auto",
    });

    return session;
  } catch (error) {
    console.error("[Stripe] Error creating payment checkout session:", error);
    throw error;
  }
}

/**
 * Obtener sesión de checkout
 */
export async function getCheckoutSession(sessionId: string) {
  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    return session;
  } catch (error) {
    console.error("[Stripe] Error retrieving checkout session:", error);
    throw error;
  }
}

/**
 * Obtener suscripción
 */
export async function getSubscription(subscriptionId: string) {
  try {
    const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
    return subscription;
  } catch (error) {
    console.error("[Stripe] Error retrieving subscription:", error);
    throw error;
  }
}

/**
 * Cancelar suscripción
 */
export async function cancelSubscription(subscriptionId: string) {
  try {
    const subscription = await getStripe().subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
    return subscription;
  } catch (error) {
    console.error("[Stripe] Error canceling subscription:", error);
    throw error;
  }
}

/**
 * Obtener todas las suscripciones de un cliente
 */
export async function getCustomerSubscriptions(customerId: string) {
  try {
    const subscriptions = await getStripe().subscriptions.list({
      customer: customerId,
      status: "all",
    });
    return subscriptions.data;
  } catch (error) {
    console.error("[Stripe] Error retrieving customer subscriptions:", error);
    throw error;
  }
}

/**
 * Construir evento de webhook desde raw body
 */
export function constructWebhookEvent(body: string, signature: string) {
  try {
    const event = getStripe().webhooks.constructEvent(
      body,
      signature,
      ENV.stripeWebhookSecret
    );
    return event;
  } catch (error) {
    console.error("[Stripe] Webhook signature verification failed:", error);
    throw error;
  }
}
