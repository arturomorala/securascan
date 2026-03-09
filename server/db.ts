import { eq, desc, and, sql, count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, scans, vulnerabilities, subscriptions, payments, Scan, InsertScan, InsertVulnerability, Vulnerability } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt)).limit(limit).offset(offset);
}

export async function getUserCount() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: count() }).from(users);
  return result[0]?.count ?? 0;
}

// ─── Scans ────────────────────────────────────────────────────────────────────

export async function createScan(data: InsertScan) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(scans).values(data);
  return result[0];
}

export async function getScanById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(scans).where(eq(scans.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getScansByUserId(userId: number, limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(scans).where(eq(scans.userId, userId)).orderBy(desc(scans.createdAt)).limit(limit).offset(offset);
}

export async function updateScan(id: number, data: Partial<Scan>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(scans).set({ ...data, updatedAt: new Date() }).where(eq(scans.id, id));
}

export async function getAllScans(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(scans).orderBy(desc(scans.createdAt)).limit(limit).offset(offset);
}

export async function getScanCount() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: count() }).from(scans);
  return result[0]?.count ?? 0;
}

export async function getRecentScans(limit = 10) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(scans).orderBy(desc(scans.createdAt)).limit(limit);
}

// ─── Vulnerabilities ──────────────────────────────────────────────────────────

export async function createVulnerabilities(data: InsertVulnerability[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (data.length === 0) return;
  await db.insert(vulnerabilities).values(data);
}

export async function getVulnerabilitiesByScanId(scanId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(vulnerabilities).where(eq(vulnerabilities.scanId, scanId)).orderBy(vulnerabilities.severity);
}

export async function updateVulnerability(id: number, data: Partial<Vulnerability>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(vulnerabilities).set(data).where(eq(vulnerabilities.id, id));
}

export async function getTotalVulnerabilityCount() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: count() }).from(vulnerabilities);
  return result[0]?.count ?? 0;
}

// ─── Subscriptions ────────────────────────────────────────────────────────────

export async function getSubscriptionByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(subscriptions).where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, "active"))).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertSubscription(data: typeof subscriptions.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(subscriptions).values(data).onDuplicateKeyUpdate({ set: { ...data, updatedAt: new Date() } });
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export async function createPayment(data: typeof payments.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(payments).values(data);
  return result[0];
}

export async function getPaymentsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(payments).where(eq(payments.userId, userId)).orderBy(desc(payments.createdAt));
}

export async function getTotalRevenue() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ total: sql<number>`COALESCE(SUM(amount), 0)` }).from(payments).where(eq(payments.status, "succeeded"));
  return result[0]?.total ?? 0;
}

export async function getAdminStats() {
  const db = await getDb();
  if (!db) return { users: 0, scans: 0, vulnerabilities: 0, revenue: 0 };
  const [userCount, scanCount, vulnCount, revenue] = await Promise.all([
    getUserCount(),
    getScanCount(),
    getTotalVulnerabilityCount(),
    getTotalRevenue(),
  ]);
  return { users: userCount, scans: scanCount, vulnerabilities: vulnCount, revenue };
}
