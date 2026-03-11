import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  getUserById, getScansByUserId, getScanById, createScan, updateScan,
  getVulnerabilitiesByScanId, createVulnerabilities, updateVulnerability,
  getAllUsers, getAllScans, getAdminStats, getRecentScans,
  getSubscriptionByUserId, getPaymentsByUserId, getUserCount
} from "./db";
import { performSecurityScan } from "./scanner";
import { generateVulnerabilityExplanation } from "./aiExplainer";
import { generateAndStorePdfReport } from "./pdfGenerator";
import { notifyOwner } from "./_core/notification";
import { invokeLLM } from "./_core/llm";
import { stripeRouter } from "./routers/stripe";

// Admin middleware
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acceso denegado: se requieren permisos de administrador." });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Scans ───────────────────────────────────────────────────────────────────
  scans: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().min(1).max(50).default(20), offset: z.number().min(0).default(0) }).optional())
      .query(async ({ ctx, input }) => {
        return getScansByUserId(ctx.user.id, input?.limit ?? 20, input?.offset ?? 0);
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const scan = await getScanById(input.id);
        if (!scan) throw new TRPCError({ code: "NOT_FOUND", message: "Escaneo no encontrado." });
        if (scan.userId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "No tienes permiso para ver este escaneo." });
        }
        return scan;
      }),

    create: protectedProcedure
      .input(z.object({
        url: z.string().url("URL inválida").max(2048),
        ownerConfirmation: z.boolean().refine(v => v === true, "Debes confirmar que eres propietario o tienes permiso para analizar esta web."),
        termsAccepted: z.boolean().refine(v => v === true, "Debes aceptar los términos de uso."),
      }))
      .mutation(async ({ ctx, input }) => {
        // Validate URL is not internal/private
        const url = new URL(input.url);
        const hostname = url.hostname.toLowerCase();
        const privatePatterns = [/^localhost$/, /^127\./, /^10\./, /^192\.168\./, /^172\.(1[6-9]|2\d|3[01])\./, /^::1$/, /^0\.0\.0\.0$/];
        if (privatePatterns.some(p => p.test(hostname))) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "No se pueden escanear direcciones IP privadas o localhost." });
        }

        const scan = await createScan({
          userId: ctx.user.id,
          url: input.url,
          status: "pending",
          progress: 0,
        });

        // Start scan asynchronously
        const insertId = (scan as any).insertId as number;
        performSecurityScan(insertId, input.url, ctx.user).catch(err => {
          console.error("[Scanner] Error performing scan:", err);
          updateScan(insertId, { status: "failed", errorMessage: String(err) });
        });

        return { id: insertId, status: "pending" };
      }),

    getVulnerabilities: protectedProcedure
      .input(z.object({ scanId: z.number() }))
      .query(async ({ ctx, input }) => {
        const scan = await getScanById(input.scanId);
        if (!scan) throw new TRPCError({ code: "NOT_FOUND" });
        if (scan.userId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        if (!scan.isPaid && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Necesitas el informe completo para ver las vulnerabilidades." });
        }
        return getVulnerabilitiesByScanId(input.scanId);
      }),

    getPublicSummary: protectedProcedure
      .input(z.object({ scanId: z.number() }))
      .query(async ({ ctx, input }) => {
        const scan = await getScanById(input.scanId);
        if (!scan) throw new TRPCError({ code: "NOT_FOUND" });
        if (scan.userId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return {
          id: scan.id,
          url: scan.url,
          status: scan.status,
          progress: scan.progress,
          currentStep: scan.currentStep,
          securityScore: scan.securityScore,
          riskLevel: scan.riskLevel,
          totalVulnerabilities: scan.totalVulnerabilities,
          criticalCount: scan.criticalCount,
          highCount: scan.highCount,
          mediumCount: scan.mediumCount,
          lowCount: scan.lowCount,
          isPaid: scan.isPaid,
          reportPdfUrl: scan.isPaid ? scan.reportPdfUrl : null,
          createdAt: scan.createdAt,
          completedAt: scan.completedAt,
        };
      }),

    generatePdf: protectedProcedure
      .input(z.object({ scanId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const scan = await getScanById(input.scanId);
        if (!scan) throw new TRPCError({ code: "NOT_FOUND" });
        if (scan.userId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        if (!scan.isPaid && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Necesitas el informe completo para generar el PDF." });
        }
        if (scan.reportPdfUrl) return { url: scan.reportPdfUrl };
        const user = await getUserById(ctx.user.id);
        const vulns = await getVulnerabilitiesByScanId(input.scanId);
        const pdfUrl = await generateAndStorePdfReport(scan, vulns, user);
        await updateScan(input.scanId, { reportPdfUrl: pdfUrl });
        return { url: pdfUrl };
      }),

    unlockReport: protectedProcedure
      .input(z.object({ scanId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const scan = await getScanById(input.scanId);
        if (!scan) throw new TRPCError({ code: "NOT_FOUND" });
        if (scan.userId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await updateScan(input.scanId, { isPaid: true });
        return { success: true };
      }),
  }),

  // ─── AI Explanations ─────────────────────────────────────────────────────────
  ai: router({
    explainVulnerability: protectedProcedure
      .input(z.object({
        vulnerabilityId: z.number(),
        level: z.enum(["basic", "technical", "expert"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const db_vulns = await getVulnerabilitiesByScanId(0); // placeholder
        // Get vulnerability directly
        const { getDb } = await import("./db");
        const { vulnerabilities } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const vulnResult = await db.select().from(vulnerabilities).where(eq(vulnerabilities.id, input.vulnerabilityId)).limit(1);
        const vuln = vulnResult[0];
        if (!vuln) throw new TRPCError({ code: "NOT_FOUND" });

        // Check if already generated
        const existingField = input.level === "basic" ? vuln.aiExplanationBasic :
          input.level === "technical" ? vuln.aiExplanationTechnical : vuln.aiExplanationExpert;
        if (existingField) return { explanation: existingField };

        const explanation = await generateVulnerabilityExplanation(vuln, input.level);
        const updateField = input.level === "basic" ? { aiExplanationBasic: explanation } :
          input.level === "technical" ? { aiExplanationTechnical: explanation } :
          { aiExplanationExpert: explanation };
        await updateVulnerability(input.vulnerabilityId, updateField);
        return { explanation };
      }),
  }),

  // ─── User profile ─────────────────────────────────────────────────────────────
  user: router({
    profile: protectedProcedure.query(async ({ ctx }) => {
      return getUserById(ctx.user.id);
    }),

    subscription: protectedProcedure.query(async ({ ctx }) => {
      return getSubscriptionByUserId(ctx.user.id);
    }),

    payments: protectedProcedure.query(async ({ ctx }) => {
      return getPaymentsByUserId(ctx.user.id);
    }),
  }),

  // ─── Admin ────────────────────────────────────────────────────────────────────
  admin: router({
    stats: adminProcedure.query(async () => {
      return getAdminStats();
    }),

    users: adminProcedure
      .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }).optional())
      .query(async ({ input }) => {
        return getAllUsers(input?.limit ?? 50, input?.offset ?? 0);
      }),

    scans: adminProcedure
      .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }).optional())
      .query(async ({ input }) => {
        return getAllScans(input?.limit ?? 50, input?.offset ?? 0);
      }),

    recentScans: adminProcedure
      .input(z.object({ limit: z.number().default(10) }).optional())
      .query(async ({ input }) => {
        return getRecentScans(input?.limit ?? 10);
      }),
  }),

  // ─── Stripe / Payments ────────────────────────────────────────────────────────
  stripe: stripeRouter,
});

export type AppRouter = typeof appRouter;
