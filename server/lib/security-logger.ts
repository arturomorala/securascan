import { getDb } from "../db";
import { securityLogs } from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import type { InsertSecurityLog } from "../../drizzle/schema";

export type SecurityEventType = InsertSecurityLog["eventType"];
export type SecuritySeverity = InsertSecurityLog["severity"];

export interface SecurityLogInput {
  userId?: number;
  eventType: SecurityEventType;
  severity?: SecuritySeverity;
  ipAddress?: string;
  userAgent?: string;
  email?: string;
  description: string;
  metadata?: Record<string, any>;
  isAnomalous?: boolean;
}

/**
 * Log a security event to the database
 */
export async function logSecurityEvent(input: SecurityLogInput): Promise<void> {
  try {
    const db = await getDb();
    if (!db) {
      console.warn("[SecurityLogger] Database not available");
      return;
    }
    await db.insert(securityLogs).values({
      userId: input.userId,
      eventType: input.eventType,
      severity: input.severity || "info",
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      email: input.email,
      description: input.description,
      metadata: input.metadata,
      isAnomalous: input.isAnomalous || false,
    });
  } catch (error) {
    console.error("[SecurityLogger] Failed to log event:", error);
    // Don't throw - logging failures shouldn't break the app
  }
}

/**
 * Check for suspicious login patterns (brute force attempts)
 * Returns true if suspicious activity is detected
 */
export async function checkBruteForcePattern(
  email: string,
  ipAddress: string,
  timeWindowMinutes: number = 15
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  const cutoffTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000);

  const failureCount = await db
    .select()
    .from(securityLogs)
    .where(
      and(
        eq(securityLogs.eventType, "login_failed"),
        eq(securityLogs.email, email),
        eq(securityLogs.ipAddress, ipAddress)
      )
    );

  // If more than 5 failed attempts in the time window, it's suspicious
  return failureCount.filter((log: any) => log.createdAt >= cutoffTime).length >= 5;
}

/**
 * Check for suspicious scan patterns
 * Returns true if user is creating too many scans in a short time
 */
export async function checkSuspiciousScanPattern(
  userId: number,
  timeWindowMinutes: number = 60
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  const cutoffTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000);

  const recentScans = await db
    .select()
    .from(securityLogs)
    .where(
      and(
        eq(securityLogs.eventType, "scan_created"),
        eq(securityLogs.userId, userId)
      )
    );

  // If more than 20 scans in the time window, it's suspicious
  return recentScans.filter((log: any) => log.createdAt >= cutoffTime).length > 20;
}

/**
 * Check for suspicious IP addresses (multiple failed logins from different accounts)
 */
export async function checkSuspiciousIP(
  ipAddress: string,
  timeWindowMinutes: number = 60
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  const cutoffTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000);

  const failedAttempts = await db
    .select()
    .from(securityLogs)
    .where(
      and(
        eq(securityLogs.eventType, "login_failed"),
        eq(securityLogs.ipAddress, ipAddress)
      )
    );

  // If more than 10 failed attempts from same IP, it's suspicious
  return failedAttempts.filter((log: any) => log.createdAt >= cutoffTime).length > 10;
}

/**
 * Get recent security events for audit trail
 */
export async function getRecentSecurityEvents(
  limit: number = 100,
  userId?: number
) {
  const db = await getDb();
  if (!db) return [];
  
  if (userId) {
    return db
      .select()
      .from(securityLogs)
      .where(eq(securityLogs.userId, userId))
      .orderBy(desc(securityLogs.createdAt))
      .limit(limit);
  }

  return db
    .select()
    .from(securityLogs)
    .orderBy(desc(securityLogs.createdAt))
    .limit(limit);
}

/**
 * Get security statistics for admin dashboard
 */
export async function getSecurityStats(hoursBack: number = 24) {
  const db = await getDb();
  if (!db) return {
    totalEvents: 0,
    loginFailures: 0,
    bruteForceAttempts: 0,
    suspiciousScans: 0,
    unauthorizedAccess: 0,
    rateLimitExceeded: 0,
    criticalEvents: 0,
    anomalousEvents: 0,
  };
  
  const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

  // Get all events and filter in memory since Drizzle date comparison is complex
  const allEvents = await db
    .select()
    .from(securityLogs)
    .orderBy(desc(securityLogs.createdAt))
    .limit(1000);
  
  const recentEvents = allEvents.filter((e: any) => new Date(e.createdAt) >= cutoffTime);

  const stats = {
    totalEvents: recentEvents.length,
    loginFailures: recentEvents.filter((e: any) => e.eventType === "login_failed").length,
    bruteForceAttempts: recentEvents.filter((e: any) => e.eventType === "login_brute_force").length,
    suspiciousScans: recentEvents.filter((e: any) => e.eventType === "scan_suspicious").length,
    unauthorizedAccess: recentEvents.filter((e: any) => e.eventType === "unauthorized_access").length,
    rateLimitExceeded: recentEvents.filter((e: any) => e.eventType === "rate_limit_exceeded").length,
    criticalEvents: recentEvents.filter((e: any) => e.severity === "critical").length,
    anomalousEvents: recentEvents.filter((e: any) => e.isAnomalous).length,
  };

  return stats;
}
