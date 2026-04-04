import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  json,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  subscriptionPlan: mysqlEnum("subscriptionPlan", ["free", "basic", "professional", "enterprise"]).default("free").notNull(),
  subscriptionStatus: mysqlEnum("subscriptionStatus", ["active", "inactive", "cancelled", "past_due"]).default("inactive").notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  subscriptionExpiresAt: timestamp("subscriptionExpiresAt"),
  scansUsed: int("scansUsed").default(0).notNull(),
  scansLimit: int("scansLimit").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const scans = mysqlTable("scans", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  url: varchar("url", { length: 2048 }).notNull(),
  status: mysqlEnum("status", ["pending", "running", "completed", "failed"]).default("pending").notNull(),
  progress: int("progress").default(0).notNull(),
  currentStep: varchar("currentStep", { length: 255 }),
  securityScore: int("securityScore"),
  riskLevel: mysqlEnum("riskLevel", ["low", "medium", "high", "critical"]),
  totalVulnerabilities: int("totalVulnerabilities").default(0).notNull(),
  criticalCount: int("criticalCount").default(0).notNull(),
  highCount: int("highCount").default(0).notNull(),
  mediumCount: int("mediumCount").default(0).notNull(),
  lowCount: int("lowCount").default(0).notNull(),
  isPaid: boolean("isPaid").default(false).notNull(),
  paymentIntentId: varchar("paymentIntentId", { length: 255 }),
  reportPdfUrl: varchar("reportPdfUrl", { length: 2048 }),
  reportPdfKey: varchar("reportPdfKey", { length: 1024 }),
  scanDuration: int("scanDuration"),
  errorMessage: text("errorMessage"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type Scan = typeof scans.$inferSelect;
export type InsertScan = typeof scans.$inferInsert;

export const vulnerabilities = mysqlTable("vulnerabilities", {
  id: int("id").autoincrement().primaryKey(),
  scanId: int("scanId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 128 }).notNull(),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).notNull(),
  description: text("description").notNull(),
  detectionMethod: text("detectionMethod"),
  impact: text("impact"),
  technicalDetails: text("technicalDetails"),
  remediation: text("remediation"),
  owaspReference: varchar("owaspReference", { length: 255 }),
  cvssScore: decimal("cvssScore", { precision: 4, scale: 1 }),
  evidence: text("evidence"),
  aiExplanationBasic: text("aiExplanationBasic"),
  aiExplanationTechnical: text("aiExplanationTechnical"),
  aiExplanationExpert: text("aiExplanationExpert"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Vulnerability = typeof vulnerabilities.$inferSelect;
export type InsertVulnerability = typeof vulnerabilities.$inferInsert;

export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  plan: mysqlEnum("plan", ["basic", "professional", "enterprise"]).notNull(),
  status: mysqlEnum("status", ["active", "inactive", "cancelled", "past_due"]).notNull(),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  stripePriceId: varchar("stripePriceId", { length: 255 }),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  currentPeriodStart: timestamp("currentPeriodStart"),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  cancelAtPeriodEnd: boolean("cancelAtPeriodEnd").default(false).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("eur"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  scanId: int("scanId"),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  stripeSessionId: varchar("stripeSessionId", { length: 255 }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("eur").notNull(),
  status: mysqlEnum("status", ["pending", "succeeded", "failed", "refunded"]).notNull(),
  description: varchar("description", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

export const securityLogs = mysqlTable("securityLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  eventType: mysqlEnum("eventType", [
    "login_success",
    "login_failed",
    "login_brute_force",
    "scan_created",
    "scan_suspicious",
    "admin_access",
    "admin_user_modified",
    "payment_attempted",
    "payment_failed",
    "webhook_received",
    "webhook_failed",
    "rate_limit_exceeded",
    "unauthorized_access",
    "data_export",
    "suspicious_ip",
  ]).notNull(),
  severity: mysqlEnum("severity", ["info", "warning", "critical"]).default("info").notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  email: varchar("email", { length: 320 }),
  description: text("description").notNull(),
  metadata: json("metadata"),
  isAnomalous: boolean("isAnomalous").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SecurityLog = typeof securityLogs.$inferSelect;
export type InsertSecurityLog = typeof securityLogs.$inferInsert;
