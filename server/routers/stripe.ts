import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import {
  getOrCreateStripeCustomer,
  createCheckoutSession,
  getCheckoutSession,
  getCustomerSubscriptions,
  cancelSubscription,
} from "../stripe";
import { getUserById, upsertSubscription } from "../db";

// Planes disponibles (en modo testing, estos son IDs de ejemplo)
const PLANS = {
  basic: {
    id: "price_1T5RfEEGL7Xs9cUT0000",
    name: "Básico",
    price: 29,
    scans: 10,
    features: ["10 escaneos/mes", "Informes PDF", "Soporte por email"],
  },
  professional: {
    id: "price_1T5RfEEGL7Xs9cUT0001",
    name: "Profesional",
    price: 99,
    scans: 100,
    features: ["100 escaneos/mes", "Informes PDF", "API access", "Soporte prioritario"],
  },
  enterprise: {
    id: "price_1T5RfEEGL7Xs9cUT0002",
    name: "Empresarial",
    price: 299,
    scans: 1000,
    features: ["1000 escaneos/mes", "Reportes avanzados", "API completa", "Soporte 24/7", "SLA garantizado"],
  },
};

export const stripeRouter = router({
  /**
   * Obtener planes disponibles
   */
  getPlans: publicProcedure.query(() => {
    return Object.entries(PLANS).map(([key, plan]) => ({
      planId: key,
      name: plan.name,
      price: plan.price,
      scans: plan.scans,
      features: plan.features,
    }));
  }),

  /**
   * Crear sesión de checkout para suscripción
   */
  createCheckout: protectedProcedure
    .input(z.object({ planId: z.enum(["basic", "professional", "enterprise"]), origin: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const plan = PLANS[input.planId];
        if (!plan) {
          throw new Error("Plan no válido");
        }

        // Obtener o crear cliente de Stripe
        const customer = await getOrCreateStripeCustomer(
          ctx.user.id,
          ctx.user.email || "",
          ctx.user.name || undefined
        );

        // Crear sesión de checkout
        const origin = input.origin || process.env.VITE_FRONTEND_URL || "https://securascan.manus.space";
        const returnUrl = `${origin}/checkout/success`;
        const session = await createCheckoutSession(
          customer.id,
          plan.id,
          returnUrl
        );

        return {
          sessionId: session.id,
          url: session.url,
        };
      } catch (error) {
        console.error("[Stripe] Error creating checkout:", error);
        throw new Error(`Error al crear sesión de pago: ${String(error)}`);
      }
    }),

  /**
   * Obtener estado de sesión de checkout
   */
  getCheckoutStatus: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input }) => {
      try {
        const session = await getCheckoutSession(input.sessionId);

        return {
          status: session.payment_status,
          subscriptionId: session.subscription as string | null,
          customerId: session.customer as string | null,
          amountTotal: session.amount_total,
        };
      } catch (error) {
        console.error("[Stripe] Error getting checkout status:", error);
        throw new Error(`Error al obtener estado de pago: ${String(error)}`);
      }
    }),

  /**
   * Obtener suscripción actual del usuario
   */
  getCurrentSubscription: protectedProcedure.query(async ({ ctx }) => {
    try {
      const user = await getUserById(ctx.user.id);
      if (!user || !user.stripeCustomerId) {
        return null;
      }

      const subscriptions = await getCustomerSubscriptions(user.stripeCustomerId);

      // Obtener la suscripción activa
      const activeSubscription = subscriptions.find(
        (sub) => sub.status === "active" || sub.status === "trialing"
      );

      if (!activeSubscription) {
        return null;
      }

      // Determinar el plan basado en el precio
      let planId = "basic";
      const priceId = activeSubscription.items.data[0]?.price.id;
      if (priceId === PLANS.professional.id) planId = "professional";
      if (priceId === PLANS.enterprise.id) planId = "enterprise";

      return {
        id: activeSubscription.id,
        planId,
        status: activeSubscription.status,
        currentPeriodStart: new Date((activeSubscription as any).current_period_start * 1000),
        currentPeriodEnd: new Date((activeSubscription as any).current_period_end * 1000),
        cancelAtPeriodEnd: (activeSubscription as any).cancel_at_period_end,
      };
    } catch (error) {
      console.error("[Stripe] Error getting current subscription:", error);
      return null;
    }
  }),

  /**
   * Cancelar suscripción
   */
  cancelSubscription: protectedProcedure
    .input(z.object({ subscriptionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const user = await getUserById(ctx.user.id);
        if (!user) {
          throw new Error("Usuario no encontrado");
        }

        // Cancelar suscripción
        const canceledSub = await cancelSubscription(input.subscriptionId);

        // Actualizar suscripción del usuario
        await upsertSubscription({
          userId: ctx.user.id,
          plan: "basic",
          stripeSubscriptionId: null,
          stripePriceId: null,
          status: "cancelled",
          currentPeriodEnd: null,
        });

        return {
          success: true,
          canceledAt: new Date(canceledSub.canceled_at! * 1000),
        };
      } catch (error) {
        console.error("[Stripe] Error canceling subscription:", error);
        throw new Error(`Error al cancelar suscripción: ${String(error)}`);
      }
    }),

  /**
   * Obtener historial de pagos (últimas 10 transacciones)
   */
  getPaymentHistory: protectedProcedure.query(async ({ ctx }) => {
    try {
      const user = await getUserById(ctx.user.id);
      if (!user || !user.stripeCustomerId) {
        return [];
      }

      // Obtener todas las suscripciones (activas e inactivas)
      const subscriptions = await getCustomerSubscriptions(user.stripeCustomerId);

      return subscriptions.slice(0, 10).map((sub) => {
        const priceId = sub.items.data[0]?.price.id;
        let planName = "Desconocido";
        if (priceId === PLANS.basic.id) planName = "Básico";
        if (priceId === PLANS.professional.id) planName = "Profesional";
        if (priceId === PLANS.enterprise.id) planName = "Empresarial";

        return {
          id: sub.id,
          plan: planName,
          status: sub.status,
          startDate: new Date(sub.created * 1000),
          endDate: sub.ended_at ? new Date(sub.ended_at * 1000) : null,
          amount: sub.items.data[0]?.price.unit_amount
            ? sub.items.data[0].price.unit_amount / 100
            : 0,
        };
      });
    } catch (error) {
      console.error("[Stripe] Error getting payment history:", error);
      return [];
    }
  }),
});
