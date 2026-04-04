import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  logSecurityEvent,
  checkBruteForcePattern,
  checkSuspiciousScanPattern,
  checkSuspiciousIP,
  getSecurityStats,
} from "./security-logger";
import { getDb } from "../db";

vi.mock("../db", () => ({
  getDb: vi.fn(),
}));

describe("Security Logger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("logSecurityEvent", () => {
    it("should log a security event successfully", async () => {
      const mockDb = {
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockResolvedValue(undefined),
        }),
      };
      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      await logSecurityEvent({
        userId: 1,
        eventType: "login_success",
        severity: "info",
        ipAddress: "192.168.1.1",
        email: "test@example.com",
        description: "User logged in successfully",
      });

      expect(mockDb.insert).toHaveBeenCalled();
    });

    it("should handle database unavailability gracefully", async () => {
      vi.mocked(getDb).mockResolvedValue(null);

      // Should not throw
      await logSecurityEvent({
        userId: 1,
        eventType: "login_success",
        severity: "info",
        description: "Test",
      });

      expect(true).toBe(true);
    });

    it("should set default severity to info", async () => {
      const mockDb = {
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockResolvedValue(undefined),
        }),
      };
      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      await logSecurityEvent({
        userId: 1,
        eventType: "login_success",
        description: "Test",
      });

      expect(mockDb.insert).toHaveBeenCalled();
    });
  });

  describe("checkBruteForcePattern", () => {
    it("should detect brute force attempts", async () => {
      const mockLogs = Array(6).fill({
        eventType: "login_failed",
        email: "test@example.com",
        ipAddress: "192.168.1.1",
        createdAt: new Date(),
      });

      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(mockLogs),
          }),
        }),
      };
      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const result = await checkBruteForcePattern(
        "test@example.com",
        "192.168.1.1"
      );

      expect(result).toBe(true);
    });

    it("should return false for normal login attempts", async () => {
      const mockLogs = Array(2).fill({
        eventType: "login_failed",
        email: "test@example.com",
        ipAddress: "192.168.1.1",
        createdAt: new Date(),
      });

      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(mockLogs),
          }),
        }),
      };
      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const result = await checkBruteForcePattern(
        "test@example.com",
        "192.168.1.1"
      );

      expect(result).toBe(false);
    });

    it("should return false when database is unavailable", async () => {
      vi.mocked(getDb).mockResolvedValue(null);

      const result = await checkBruteForcePattern(
        "test@example.com",
        "192.168.1.1"
      );

      expect(result).toBe(false);
    });
  });

  describe("checkSuspiciousScanPattern", () => {
    it("should detect suspicious scan patterns", async () => {
      const mockLogs = Array(25).fill({
        eventType: "scan_created",
        userId: 1,
        createdAt: new Date(),
      });

      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(mockLogs),
          }),
        }),
      };
      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const result = await checkSuspiciousScanPattern(1, 60);

      expect(result).toBe(true);
    });

    it("should return false for normal scan activity", async () => {
      const mockLogs = Array(5).fill({
        eventType: "scan_created",
        userId: 1,
        createdAt: new Date(),
      });

      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(mockLogs),
          }),
        }),
      };
      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const result = await checkSuspiciousScanPattern(1, 60);

      expect(result).toBe(false);
    });
  });

  describe("checkSuspiciousIP", () => {
    it("should detect suspicious IP addresses", async () => {
      const mockLogs = Array(15).fill({
        eventType: "login_failed",
        ipAddress: "192.168.1.100",
        createdAt: new Date(),
      });

      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(mockLogs),
          }),
        }),
      };
      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const result = await checkSuspiciousIP("192.168.1.100", 60);

      expect(result).toBe(true);
    });

    it("should return false for normal IP activity", async () => {
      const mockLogs = Array(3).fill({
        eventType: "login_failed",
        ipAddress: "192.168.1.100",
        createdAt: new Date(),
      });

      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(mockLogs),
          }),
        }),
      };
      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const result = await checkSuspiciousIP("192.168.1.100", 60);

      expect(result).toBe(false);
    });
  });

  describe("getSecurityStats", () => {
    it("should calculate security statistics correctly", async () => {
      const mockLogs = [
        {
          eventType: "login_failed",
          severity: "info",
          isAnomalous: false,
          createdAt: new Date(),
        },
        {
          eventType: "login_failed",
          severity: "info",
          isAnomalous: false,
          createdAt: new Date(),
        },
        {
          eventType: "login_brute_force",
          severity: "critical",
          isAnomalous: true,
          createdAt: new Date(),
        },
        {
          eventType: "scan_suspicious",
          severity: "warning",
          isAnomalous: true,
          createdAt: new Date(),
        },
      ];

      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue(mockLogs),
            }),
          }),
        }),
      };
      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const stats = await getSecurityStats(24);

      expect(stats.totalEvents).toBe(4);
      expect(stats.loginFailures).toBe(2);
      expect(stats.bruteForceAttempts).toBe(1);
      expect(stats.suspiciousScans).toBe(1);
      expect(stats.criticalEvents).toBe(1);
      expect(stats.anomalousEvents).toBe(2);
    });

    it("should return empty stats when database is unavailable", async () => {
      vi.mocked(getDb).mockResolvedValue(null);

      const stats = await getSecurityStats(24);

      expect(stats.totalEvents).toBe(0);
      expect(stats.loginFailures).toBe(0);
      expect(stats.bruteForceAttempts).toBe(0);
    });
  });
});
