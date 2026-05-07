import Stripe from "stripe";
import { getDb } from "../db";
import { payments, subscriptions, users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2026-02-25.clover",
});

/**
 * Create or get Stripe customer for user
 */
export async function getOrCreateStripeCustomer(userId: number, email: string, name?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1).then(rows => rows[0]);

  if (user?.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    email,
    name: name || email,
    metadata: {
      userId: userId.toString(),
    },
  });

  // Update user with Stripe customer ID
  await db
    .update(users)
    .set({ stripeCustomerId: customer.id })
    .where(eq(users.id, userId));

  return customer.id;
}

/**
 * Create checkout session for one-time payment
 */
export async function createOneTimeScanCheckout(
  userId: number,
  email: string,
  name: string,
  successUrl: string,
  cancelUrl: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const customerId = await getOrCreateStripeCustomer(userId, email, name);

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: {
            name: "One-Time Scan",
            description: "Single website security scan with detailed vulnerability report",
          },
          unit_amount: 499, // 4.99 EUR in cents
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: userId.toString(),
    metadata: {
      user_id: userId.toString(),
      customer_email: email,
      customer_name: name,
      plan_type: "one_time_scan",
    },
    allow_promotion_codes: true,
  });

  // Create payment record
  await db.insert(payments).values({
    userId,
    stripeSessionId: session.id,
    amount: "4.99",
    currency: "eur",
    status: "pending",
    description: "One-Time Scan",
  });

  return session.url;
}

/**
 * Create checkout session for subscription
 */
export async function createSubscriptionCheckout(
  userId: number,
  email: string,
  name: string,
  plan: "pro" | "business",
  successUrl: string,
  cancelUrl: string,
  billingPeriod: "month" | "year" = "month"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const customerId = await getOrCreateStripeCustomer(userId, email, name);

  let priceData;
  if (plan === "pro") {
    priceData = { amount: 2999, name: "Pro Plan", description: "Professional security monitoring" };
  } else {
    if (billingPeriod === "year") {
      priceData = { amount: 81588, name: "Business Plan Annual", description: "Enterprise security monitoring (15% discount)" };
    } else {
      priceData = { amount: 7999, name: "Business Plan", description: "Enterprise security monitoring" };
    }
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: {
            name: priceData.name,
            description: priceData.description,
          },
          unit_amount: priceData.amount,
          recurring: {
            interval: billingPeriod,
          },
        },
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: userId.toString(),
    metadata: {
      user_id: userId.toString(),
      customer_email: email,
      customer_name: name,
      plan_type: plan,
      billing_period: billingPeriod,
    },
    allow_promotion_codes: true,
  });

  return session.url;
}

/**
 * Handle successful payment
 */
export async function handlePaymentSuccess(
  sessionId: string,
  customerId: string,
  metadata: Record<string, string>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const userId = parseInt(metadata.user_id);

  // Update payment record
  await db
    .update(payments)
    .set({ status: "succeeded" })
    .where(eq(payments.stripeSessionId, sessionId));

  // For one-time scans, mark user as having purchased one-time scan
  if (metadata.plan_type === "one_time_scan") {
    // Update user to basic plan with one-time scan purchased
    await db
      .update(users)
      .set({
        subscriptionPlan: "basic",
        oneTimeScanUsed: false, // Not used yet, just purchased
        oneTimeScanPurchasedAt: new Date(),
      })
      .where(eq(users.id, userId));
    return;
  }

  // For subscriptions, create subscription record
  const planMap: Record<string, "professional" | "enterprise"> = {
    pro: "professional",
    business: "enterprise",
  };

  const plan = planMap[metadata.plan_type];
  if (!plan) return;

  const db2 = await getDb();
  if (!db2) throw new Error("Database not available");

  // Update user subscription
  await db2
    .update(users)
    .set({
      subscriptionPlan: plan,
      subscriptionStatus: "active",
    })
    .where(eq(users.id, userId));
}

/**
 * Handle subscription events
 */
export async function handleSubscriptionEvent(
  event: Stripe.Event,
  subscription: Stripe.Subscription
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const userId = parseInt(subscription.metadata?.user_id || "0");
  if (!userId) return;

  const planMap: Record<string, "professional" | "enterprise"> = {
    pro: "professional",
    business: "enterprise",
  };

  const plan = planMap[subscription.metadata?.plan_type] || "professional";

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
      // Update subscription record
      const existingSub = await db.select().from(subscriptions).where(eq(subscriptions.stripeSubscriptionId, subscription.id)).limit(1).then(rows => rows[0]);

      if (existingSub) {
      await db
        .update(subscriptions)
        .set({
          status: subscription.status as any,
          currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
          currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
          cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
        })
        .where(eq(subscriptions.id, existingSub.id));
      } else {
        await db.insert(subscriptions).values({
          userId,
          plan: plan as any,
          status: subscription.status as any,
          stripeSubscriptionId: subscription.id,
          stripePriceId: subscription.items.data[0]?.price.id,
          stripeCustomerId: subscription.customer as string,
          currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
          currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
          cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
          amount: subscription.items.data[0]?.price.unit_amount 
            ? (subscription.items.data[0].price.unit_amount / 100).toString()
            : "0",
          currency: subscription.items.data[0]?.price.currency || "eur",
        });
      }

      // Update user subscription status
      await db
        .update(users)
        .set({
          subscriptionPlan: plan,
          subscriptionStatus: subscription.status as any,
          subscriptionExpiresAt: new Date((subscription as any).current_period_end * 1000),
        })
        .where(eq(users.id, userId));
      break;

    case "customer.subscription.deleted":
      // Mark subscription as cancelled
      await db
        .update(subscriptions)
        .set({ status: "cancelled" })
        .where(eq(subscriptions.stripeSubscriptionId, subscription.id));

      // Downgrade user to free plan
      await db
        .update(users)
        .set({
          subscriptionPlan: "free",
          subscriptionStatus: "inactive",
        })
        .where(eq(users.id, userId));
      break;
  }
}

export { stripe };
