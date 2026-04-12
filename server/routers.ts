import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router, rateLimitedProcedure } from "./_core/trpc";
import { logSecurityEvent, checkBruteForcePattern, checkSuspiciousScanPattern, getSecurityStats, getRecentSecurityEvents } from "./lib/security-logger";
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

    create: rateLimitedProcedure
      .use(({ ctx, next }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Debes estar autenticado." });
        return next({ ctx: { ...ctx, user: ctx.user } });
      })
      .input(z.object({
        url: z.string().url("URL inválida").max(2048),
        ownerConfirmation: z.boolean().refine(v => v === true, "Debes confirmar que eres propietario o tienes permiso para analizar esta web."),
        termsAccepted: z.boolean().refine(v => v === true, "Debes aceptar los términos de uso."),
        language: z.enum(['es', 'en']).default('es'),
      }))
      .mutation(async ({ ctx, input }) => {
        // Check scan limit for FREE plan
        const user = await getUserById(ctx.user.id);
        if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "Usuario no encontrado." });

        if (user.subscriptionPlan === 'free') {
          // FREE plan: 2 escaneos de por vida
          const userScans = await getScansByUserId(ctx.user.id, 1000, 0);
          if (userScans.length >= 2) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Has alcanzado el límite de 2 escaneos en el plan FREE. Actualiza tu plan para escanear más sitios."
            });
          }
        }

        // Validate URL format only
        const url = new URL(input.url);

        const scan = await createScan({
          userId: ctx.user.id,
          url: input.url,
          status: "pending",
          progress: 0,
          language: input.language || 'es',
        });

        // Log scan creation
        await logSecurityEvent({
          userId: ctx.user.id,
          eventType: "scan_created",
          severity: "info",
          ipAddress: ctx.req.ip,
          userAgent: (ctx.req.headers["user-agent"] as string) || undefined,
          email: ctx.user.email || undefined,
          description: `Nuevo escaneo creado para: ${input.url}`,
          metadata: { url: input.url },
        });

        // Start scan asynchronously
        const insertId = (scan as any).insertId as number;
        performSecurityScan(insertId, input.url, ctx.user, input.language).catch(err => {
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
        const pdfUrl = await generateAndStorePdfReport(scan, vulns, user, scan.language);
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
        language: z.enum(["es", "en"]).default("es"),
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

        const explanation = await generateVulnerabilityExplanation(vuln, input.level, input.language);
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
    stats: adminProcedure.query(async ({ ctx }) => {
      await logSecurityEvent({
        userId: ctx.user.id,
        eventType: "admin_access",
        severity: "info",
        ipAddress: ctx.req.ip,
        userAgent: (ctx.req.headers["user-agent"] as string) || undefined,
        email: ctx.user.email || undefined,
        description: "Admin accedió a estadísticas del panel",
      });
      return getAdminStats();
    }),

    users: adminProcedure
      .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }).optional())
      .query(async ({ ctx, input }) => {
        await logSecurityEvent({
          userId: ctx.user.id,
          eventType: "admin_access",
          severity: "info",
          ipAddress: ctx.req.ip,
          userAgent: (ctx.req.headers["user-agent"] as string) || undefined,
          email: ctx.user.email || undefined,
          description: "Admin consultó lista de usuarios",
        });
        return getAllUsers(input?.limit ?? 50, input?.offset ?? 0);
      }),

    scans: adminProcedure
      .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }).optional())
      .query(async ({ ctx, input }) => {
        await logSecurityEvent({
          userId: ctx.user.id,
          eventType: "admin_access",
          severity: "info",
          ipAddress: ctx.req.ip,
          userAgent: (ctx.req.headers["user-agent"] as string) || undefined,
          email: ctx.user.email || undefined,
          description: "Admin consultó lista de escaneos",
        });
        return getAllScans(input?.limit ?? 50, input?.offset ?? 0);
      }),

    recentScans: adminProcedure
      .input(z.object({ limit: z.number().default(10) }).optional())
      .query(async ({ ctx, input }) => {
        await logSecurityEvent({
          userId: ctx.user.id,
          eventType: "admin_access",
          severity: "info",
          ipAddress: ctx.req.ip,
          userAgent: (ctx.req.headers["user-agent"] as string) || undefined,
          email: ctx.user.email || undefined,
          description: "Admin consultó escaneos recientes",
        });
        return getRecentScans(input?.limit ?? 10);
      }),

    securityStats: adminProcedure
      .input(z.object({ hoursBack: z.number().min(1).max(720).default(24) }).optional())
      .query(async ({ ctx, input }) => {
        await logSecurityEvent({
          userId: ctx.user.id,
          eventType: "admin_access",
          severity: "info",
          ipAddress: ctx.req.ip,
          userAgent: (ctx.req.headers["user-agent"] as string) || undefined,
          email: ctx.user.email || undefined,
          description: "Admin consultó estadísticas de seguridad",
        });
        return getSecurityStats(input?.hoursBack ?? 24);
      }),

    auditLog: adminProcedure
      .input(z.object({ limit: z.number().min(1).max(500).default(100), userId: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        await logSecurityEvent({
          userId: ctx.user.id,
          eventType: "admin_access",
          severity: "info",
          ipAddress: ctx.req.ip,
          userAgent: (ctx.req.headers["user-agent"] as string) || undefined,
          email: ctx.user.email || undefined,
          description: "Admin consultó registro de auditoría",
        });
        return getRecentSecurityEvents(input?.limit ?? 100, input?.userId);
      }),
  }),

  // ─── Testimonials ────────────────────────────────────────────────────────────
  testimonials: router({
    list: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(50).default(10) }).optional())
      .query(async ({ input }) => {
        // Get published testimonials from database
        const limit = input?.limit ?? 10;
        // For now, return empty array - will be populated by user reviews
        return [];
      }),

    create: protectedProcedure
      .input(z.object({
        rating: z.number().min(1).max(5),
        title: z.string().min(5).max(255),
        content: z.string().min(10).max(1000),
      }))
      .mutation(async ({ ctx, input }) => {
        // Create testimonial in database
        // For now, return success
        return {
          id: Math.random().toString(),
          userId: ctx.user.id,
          userName: ctx.user.name || "Usuario",
          rating: input.rating,
          title: input.title,
          content: input.content,
          isPublished: true,
          createdAt: new Date(),
        };
      }),
  }),

  // ─── Stripe / Payments ────────────────────────────────────────────────────────
  stripe: stripeRouter,
});

export type AppRouter = typeof appRouter;
