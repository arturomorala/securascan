import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";
import type { User } from "../drizzle/schema";

// Mock the database functions
vi.mock("./db", () => ({
  getUserById: vi.fn(),
  getScansByUserId: vi.fn().mockResolvedValue([]),
  getScanById: vi.fn(),
  createScan: vi.fn(),
  updateScan: vi.fn(),
  getVulnerabilitiesByScanId: vi.fn().mockResolvedValue([]),
  createVulnerabilities: vi.fn(),
  updateVulnerability: vi.fn(),
  getAllUsers: vi.fn().mockResolvedValue([]),
  getAllScans: vi.fn().mockResolvedValue([]),
  getAdminStats: vi.fn().mockResolvedValue({ users: 0, scans: 0, vulnerabilities: 0, revenue: 0 }),
  getRecentScans: vi.fn().mockResolvedValue([]),
  getSubscriptionByUserId: vi.fn().mockResolvedValue(null),
  getPaymentsByUserId: vi.fn().mockResolvedValue([]),
  getUserCount: vi.fn().mockResolvedValue(0),
}));

// Mock scanner
vi.mock("./scanner", () => ({
  performSecurityScan: vi.fn().mockResolvedValue(undefined),
}));

// Mock AI explainer
vi.mock("./aiExplainer", () => ({
  generateVulnerabilityExplanation: vi.fn().mockResolvedValue("Explicación de prueba"),
  generateExecutiveSummary: vi.fn().mockResolvedValue("Resumen ejecutivo de prueba"),
}));

// Mock PDF generator
vi.mock("./pdfGenerator", () => ({
  generateAndStorePdfReport: vi.fn().mockResolvedValue("https://example.com/report.pdf"),
}));

// Mock notification
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

// Mock LLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({ choices: [{ message: { content: "Test response" } }] }),
}));

type CookieCall = { name: string; options: Record<string, unknown> };

function createUserContext(role: "user" | "admin" = "user"): { ctx: TrpcContext; clearedCookies: CookieCall[] } {
  const clearedCookies: CookieCall[] = [];
  const user: User = {
    id: 1,
    openId: "test-user-openid",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role,
    subscriptionPlan: "free",
    subscriptionStatus: "inactive",
    subscriptionExpiresAt: null,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  const ctx: TrpcContext = {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };
  return { ctx, clearedCookies };
}

function createGuestContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ─── Auth tests ───────────────────────────────────────────────────────────────
describe("auth.logout", () => {
  it("clears session cookie and returns success", async () => {
    const { ctx, clearedCookies } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
    expect(clearedCookies[0]?.options).toMatchObject({ maxAge: -1, httpOnly: true, path: "/" });
  });

  it("auth.me returns null for unauthenticated user", async () => {
    const ctx = createGuestContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("auth.me returns user for authenticated user", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.email).toBe("test@example.com");
    expect(result?.role).toBe("user");
  });
});

// ─── Scans tests ──────────────────────────────────────────────────────────────
describe("scans.list", () => {
  it("returns empty array for user with no scans", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.scans.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("throws UNAUTHORIZED for unauthenticated user", async () => {
    const ctx = createGuestContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.scans.list()).rejects.toThrow();
  });
});

describe("scans.create", () => {
  it("throws UNAUTHORIZED for unauthenticated user", async () => {
    const ctx = createGuestContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.scans.create({
      url: "https://example.com",
      ownerConfirmation: true,
      termsAccepted: true,
    })).rejects.toThrow();
  });

  it("validates URL format", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.scans.create({
      url: "not-a-valid-url",
      ownerConfirmation: true,
      termsAccepted: true,
    })).rejects.toThrow();
  });

  it("requires owner confirmation", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.scans.create({
      url: "https://example.com",
      ownerConfirmation: false,
      termsAccepted: true,
    })).rejects.toThrow();
  });

  it("requires terms acceptance", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.scans.create({
      url: "https://example.com",
      ownerConfirmation: true,
      termsAccepted: false,
    })).rejects.toThrow();
  });
});

// ─── Admin tests ──────────────────────────────────────────────────────────────
describe("admin.stats", () => {
  it("throws FORBIDDEN for non-admin user", async () => {
    const { ctx } = createUserContext("user");
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.stats()).rejects.toThrow();
  });

  it("returns stats for admin user", async () => {
    const { ctx } = createUserContext("admin");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.stats();
    expect(result).toHaveProperty("users");
    expect(result).toHaveProperty("scans");
    expect(result).toHaveProperty("vulnerabilities");
    expect(result).toHaveProperty("revenue");
  });

  it("throws UNAUTHORIZED for unauthenticated user", async () => {
    const ctx = createGuestContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.stats()).rejects.toThrow();
  });
});

describe("admin.users", () => {
  it("throws FORBIDDEN for non-admin user", async () => {
    const { ctx } = createUserContext("user");
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.users()).rejects.toThrow();
  });

  it("returns users array for admin", async () => {
    const { ctx } = createUserContext("admin");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.users();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("admin.scans", () => {
  it("throws FORBIDDEN for regular user", async () => {
    const { ctx } = createUserContext("user");
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.scans()).rejects.toThrow();
  });

  it("returns scans array for admin", async () => {
    const { ctx } = createUserContext("admin");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.scans();
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── Stripe tests ─────────────────────────────────────────────────────────────
describe("stripe.createCheckoutSession", () => {
  it("throws UNAUTHORIZED for unauthenticated user", async () => {
    const ctx = createGuestContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.stripe.createCheckoutSession({ scanId: 1 })).rejects.toThrow();
  });
});
