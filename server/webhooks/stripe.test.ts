import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleStripeWebhook } from "./stripe";
import { constructWebhookEvent } from "../stripe";
import type { Request, Response } from "express";

// Mock de constructWebhookEvent
vi.mock("../stripe", () => ({
  constructWebhookEvent: vi.fn(),
  getStripe: vi.fn(),
}));

// Mock de base de datos
vi.mock("../db", () => ({
  getDb: vi.fn(),
}));

describe("Stripe Webhook Handler", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockJson: ReturnType<typeof vi.fn>;
  let mockStatus: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockJson = vi.fn().mockReturnValue(undefined);
    mockStatus = vi.fn().mockReturnValue({ json: mockJson });

    mockReq = {
      headers: {
        "stripe-signature": "test-signature",
      },
      body: Buffer.from(JSON.stringify({})),
    };

    mockRes = {
      json: mockJson,
      status: mockStatus,
    };
  });

  it("debe rechazar requests sin firma de Stripe", async () => {
    mockReq.headers = {};

    await handleStripeWebhook(mockReq as Request, mockRes as Response);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({ error: "Signature requerida" });
  });

  it("debe manejar errores de validación de firma", async () => {
    const { constructWebhookEvent: mockConstructEvent } = await import("../stripe");
    vi.mocked(mockConstructEvent).mockImplementation(() => {
      throw new Error("Invalid signature");
    });

    await handleStripeWebhook(mockReq as Request, mockRes as Response);

    expect(mockStatus).toHaveBeenCalledWith(400);
  });

  it("debe responder con received: true para eventos válidos", async () => {
    const { constructWebhookEvent: mockConstructEvent } = await import("../stripe");
    vi.mocked(mockConstructEvent).mockReturnValue({
      type: "payment_intent.succeeded",
      data: { object: {} },
    } as any);

    await handleStripeWebhook(mockReq as Request, mockRes as Response);

    expect(mockJson).toHaveBeenCalledWith({ received: true });
  });

  it("debe procesar eventos de payment_intent.succeeded", async () => {
    const { constructWebhookEvent: mockConstructEvent } = await import("../stripe");
    vi.mocked(mockConstructEvent).mockReturnValue({
      type: "payment_intent.succeeded",
      data: {
        object: {
          customer: "cus_test123",
        },
      },
    } as any);

    await handleStripeWebhook(mockReq as Request, mockRes as Response);

    expect(mockJson).toHaveBeenCalledWith({ received: true });
  });

  it("debe procesar eventos de customer.subscription.updated", async () => {
    const { constructWebhookEvent: mockConstructEvent } = await import("../stripe");
    vi.mocked(mockConstructEvent).mockReturnValue({
      type: "customer.subscription.updated",
      data: {
        object: {
          id: "sub_test123",
          customer: "cus_test123",
          status: "active",
          current_period_start: Math.floor(Date.now() / 1000),
          current_period_end: Math.floor(Date.now() / 1000) + 86400,
          items: {
            data: [
              {
                price: {
                  id: "price_basic123",
                },
              },
            ],
          },
        },
      },
    } as any);

    await handleStripeWebhook(mockReq as Request, mockRes as Response);

    expect(mockJson).toHaveBeenCalledWith({ received: true });
  });

  it("debe procesar eventos de customer.subscription.deleted", async () => {
    const { constructWebhookEvent: mockConstructEvent } = await import("../stripe");
    vi.mocked(mockConstructEvent).mockReturnValue({
      type: "customer.subscription.deleted",
      data: {
        object: {
          id: "sub_test123",
          customer: "cus_test123",
        },
      },
    } as any);

    await handleStripeWebhook(mockReq as Request, mockRes as Response);

    expect(mockJson).toHaveBeenCalledWith({ received: true });
  });

  it("debe procesar eventos de checkout.session.completed", async () => {
    const { constructWebhookEvent: mockConstructEvent } = await import("../stripe");
    vi.mocked(mockConstructEvent).mockReturnValue({
      type: "checkout.session.completed",
      data: {
        object: {
          customer: "cus_test123",
          subscription: "sub_test123",
        },
      },
    } as any);

    await handleStripeWebhook(mockReq as Request, mockRes as Response);

    expect(mockJson).toHaveBeenCalledWith({ received: true });
  });

  it("debe procesar eventos de customer.updated", async () => {
    const { constructWebhookEvent: mockConstructEvent } = await import("../stripe");
    vi.mocked(mockConstructEvent).mockReturnValue({
      type: "customer.updated",
      data: {
        object: {
          id: "cus_test123",
          email: "test@example.com",
        },
      },
    } as any);

    await handleStripeWebhook(mockReq as Request, mockRes as Response);

    expect(mockJson).toHaveBeenCalledWith({ received: true });
  });

  it("debe ignorar eventos no manejados", async () => {
    const { constructWebhookEvent: mockConstructEvent } = await import("../stripe");
    vi.mocked(mockConstructEvent).mockReturnValue({
      type: "charge.refunded",
      data: { object: {} },
    } as any);

    await handleStripeWebhook(mockReq as Request, mockRes as Response);

    expect(mockJson).toHaveBeenCalledWith({ received: true });
  });

  it("debe manejar raw body como string", async () => {
    const { constructWebhookEvent: mockConstructEvent } = await import("../stripe");
    vi.mocked(mockConstructEvent).mockReturnValue({
      type: "payment_intent.succeeded",
      data: { object: {} },
    } as any);

    mockReq.body = JSON.stringify({ test: "data" });

    await handleStripeWebhook(mockReq as Request, mockRes as Response);

    expect(mockJson).toHaveBeenCalledWith({ received: true });
  });

  it("debe manejar raw body como Buffer", async () => {
    const { constructWebhookEvent: mockConstructEvent } = await import("../stripe");
    vi.mocked(mockConstructEvent).mockReturnValue({
      type: "payment_intent.succeeded",
      data: { object: {} },
    } as any);

    mockReq.body = Buffer.from(JSON.stringify({ test: "data" }));

    await handleStripeWebhook(mockReq as Request, mockRes as Response);

    expect(mockJson).toHaveBeenCalledWith({ received: true });
  });
});
