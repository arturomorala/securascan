import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { createOneTimeScanCheckout, createSubscriptionCheckout } from "../stripe/utils";
import { TRPCError } from "@trpc/server";

export const stripeRouter = router({
  // Create checkout session for one-time scan
  createOneTimeScanCheckout: protectedProcedure
    .mutation(async ({ ctx }) => {
      if (!ctx.user.email || !ctx.user.name) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Email and name are required",
        });
      }

      const origin = ctx.req.headers.origin || "https://securascan.manus.space";
      const successUrl = `${origin}/scan?payment=success`;
      const cancelUrl = `${origin}/pricing?payment=cancelled`;

      try {
        const checkoutUrl = await createOneTimeScanCheckout(
          ctx.user.id,
          ctx.user.email,
          ctx.user.name,
          successUrl,
          cancelUrl
        );

        if (!checkoutUrl) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create checkout session",
          });
        }

        return { checkoutUrl };
      } catch (error) {
        console.error("[Stripe] Error creating one-time scan checkout:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create checkout session",
        });
      }
    }),

  // Create checkout session for Pro plan subscription
  createProCheckout: protectedProcedure
    .mutation(async ({ ctx }) => {
      if (!ctx.user.email || !ctx.user.name) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Email and name are required",
        });
      }

      const origin = ctx.req.headers.origin || "https://securascan.manus.space";
      const successUrl = `${origin}/dashboard?subscription=success`;
      const cancelUrl = `${origin}/pricing?subscription=cancelled`;

      try {
        const checkoutUrl = await createSubscriptionCheckout(
          ctx.user.id,
          ctx.user.email,
          ctx.user.name,
          "pro",
          successUrl,
          cancelUrl
        );

        if (!checkoutUrl) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create checkout session",
          });
        }

        return { checkoutUrl };
      } catch (error) {
        console.error("[Stripe] Error creating Pro checkout:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create checkout session",
        });
      }
    }),

  // Create checkout session for Business plan subscription (monthly)
  createBusinessCheckout: protectedProcedure
    .mutation(async ({ ctx }) => {
      if (!ctx.user.email || !ctx.user.name) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Email and name are required",
        });
      }

      const origin = ctx.req.headers.origin || "https://securascan.manus.space";
      const successUrl = `${origin}/dashboard?subscription=success`;
      const cancelUrl = `${origin}/pricing?subscription=cancelled`;

      try {
        const checkoutUrl = await createSubscriptionCheckout(
          ctx.user.id,
          ctx.user.email,
          ctx.user.name,
          "business",
          successUrl,
          cancelUrl,
          "month"
        );

        if (!checkoutUrl) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create checkout session",
          });
        }

        return { checkoutUrl };
      } catch (error) {
        console.error("[Stripe] Error creating Business checkout:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create checkout session",
        });
      }
    }),

  // Create checkout session for Business plan subscription (annual with 15% discount)
  createBusinessAnnualCheckout: protectedProcedure
    .mutation(async ({ ctx }) => {
      if (!ctx.user.email || !ctx.user.name) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Email and name are required",
        });
      }

      const origin = ctx.req.headers.origin || "https://securascan.manus.space";
      const successUrl = `${origin}/dashboard?subscription=success`;
      const cancelUrl = `${origin}/pricing?subscription=cancelled`;

      try {
        const checkoutUrl = await createSubscriptionCheckout(
          ctx.user.id,
          ctx.user.email,
          ctx.user.name,
          "business",
          successUrl,
          cancelUrl,
          "year"
        );

        if (!checkoutUrl) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create checkout session",
          });
        }

        return { checkoutUrl };
      } catch (error) {
        console.error("[Stripe] Error creating Business Annual checkout:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create checkout session",
        });
      }
    }),

  // Cancel subscription at end of period
  cancelSubscription: protectedProcedure
    .mutation(async ({ ctx }) => {
      try {
        const { getDb } = await import("../db");
        const { users } = await import("../../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const Stripe = await import("stripe");

        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const stripe = new Stripe.default(process.env.STRIPE_SECRET_KEY || "");

        // Get user's subscription ID from database
        const user = await db
          .select()
          .from(users)
          .where(eq(users.id, ctx.user.id))
          .limit(1)
          .then((rows) => rows[0]);

        if (!user?.stripeSubscriptionId) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "No active subscription found",
          });
        }

        // Cancel subscription at end of period
        const updatedSubscription = await stripe.subscriptions.update(
          user.stripeSubscriptionId,
          {
            cancel_at_period_end: true,
          }
        );

        // Update user in database to mark subscription as cancelled
        await db
          .update(users)
          .set({
            subscriptionStatus: "cancelled",
          })
          .where(eq(users.id, ctx.user.id));

        return {
          success: true,
          message: "Subscription cancelled at end of period",
          cancelDate: (updatedSubscription as any).current_period_end,
        };
      } catch (error) {
        console.error("[Stripe] Error cancelling subscription:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to cancel subscription",
        });
      }
    }),
});
