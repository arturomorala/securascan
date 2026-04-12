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

  // Create checkout session for Business plan subscription
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
        console.error("[Stripe] Error creating Business checkout:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create checkout session",
        });
      }
    }),
});
