import { describe, it, expect } from "vitest";
import {
  calculateInvestmentStats,
  calculateNetBalance,
} from "@/lib/budget-engine";
import { Investment } from "@/lib/firebase/firestore";

describe("Investment Utilities (budget-engine)", () => {
  const sampleInvestments: Investment[] = [
    {
      id: "inv-1",
      userId: "user-123",
      amount: 500,
      category: "renda_fixa",
      description: "CDB 100% CDI",
      date: "2026-08-01",
    },
    {
      id: "inv-2",
      userId: "user-123",
      amount: 300,
      category: "acoes_fiis",
      description: "IVVB11",
      date: "2026-08-02",
    },
    {
      id: "inv-3",
      userId: "user-123",
      amount: 200,
      category: "reserva_emergencia",
      description: "Tesouro Selic",
      date: "2026-08-03",
    },
  ];

  describe("calculateInvestmentStats", () => {
    it("should calculate total invested and target progress correctly", () => {
      const totalIncome = 5000; // 15% target = 750
      const stats = calculateInvestmentStats(totalIncome, sampleInvestments);

      expect(stats.totalInvested).toBe(1000); // 500 + 300 + 200
      expect(stats.targetInvested).toBe(750); // 15% of 5000
      expect(stats.targetProgressPercent).toBe(133.33); // (1000 / 750) * 100 rounded
      expect(stats.isTargetReached).toBe(true);
    });

    it("should handle 0 investments gracefully", () => {
      const totalIncome = 4000;
      const stats = calculateInvestmentStats(totalIncome, []);

      expect(stats.totalInvested).toBe(0);
      expect(stats.targetInvested).toBe(600);
      expect(stats.targetProgressPercent).toBe(0);
      expect(stats.isTargetReached).toBe(false);
    });

    it("should handle 0 income gracefully", () => {
      const stats = calculateInvestmentStats(0, sampleInvestments);

      expect(stats.totalInvested).toBe(1000);
      expect(stats.targetInvested).toBe(0);
      expect(stats.targetProgressPercent).toBe(100);
      expect(stats.isTargetReached).toBe(true);
    });

    it("should group investment amounts correctly by category", () => {
      const stats = calculateInvestmentStats(5000, sampleInvestments);

      expect(stats.byCategory.renda_fixa.amount).toBe(500);
      expect(stats.byCategory.renda_fixa.percentage).toBe(50); // 500 / 1000

      expect(stats.byCategory.acoes_fiis.amount).toBe(300);
      expect(stats.byCategory.acoes_fiis.percentage).toBe(30); // 300 / 1000

      expect(stats.byCategory.reserva_emergencia.amount).toBe(200);
      expect(stats.byCategory.reserva_emergencia.percentage).toBe(20); // 200 / 1000

      expect(stats.byCategory.cripto.amount).toBe(0);
      expect(stats.byCategory.cripto.percentage).toBe(0);

      expect(stats.byCategory.outros.amount).toBe(0);
      expect(stats.byCategory.outros.percentage).toBe(0);
    });
  });

  describe("calculateNetBalance", () => {
    it("should deduct both expenses and investments from total income", () => {
      const netBalance = calculateNetBalance(5000, 2000, 1000);
      expect(netBalance).toBe(2000); // 5000 - 2000 - 1000
    });

    it("should handle negative net balance when expenses and investments exceed income", () => {
      const netBalance = calculateNetBalance(3000, 2500, 1000);
      expect(netBalance).toBe(-500);
    });
  });
});
