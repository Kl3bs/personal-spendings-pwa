import { describe, it, expect } from "vitest";
import { Wallet, Contribution, calculateWalletBalances, filterContributionsByWallet, calculateMonthlyPatrimonyEvolution, calculatePatrimonySummary } from "@/lib/patrimony-engine";

describe("patrimony-engine", () => {
  describe("calculateWalletBalances", () => {
    it("should return zero balance for wallets with no contributions", () => {
      const wallets: Wallet[] = [{ id: "w1", userId: "u1", name: "Wallet 1" }];
      const balances = calculateWalletBalances(wallets, []);
      expect(balances).toHaveLength(1);
      expect(balances[0].balance).toBe(0);
    });

    it("should handle contributions with undefined amount", () => {
      const wallets: Wallet[] = [{ id: "w1", userId: "u1", name: "Wallet 1" }];
      const contributions: Contribution[] = [
        { id: "c1", userId: "u1", walletId: "w1", amount: (undefined as unknown as number), date: "2026-08-01" },
      ];
      const balances = calculateWalletBalances(wallets, contributions);
      expect(balances[0].balance).toBe(0);
    });

    it("should sum contributions per wallet correctly", () => {
      const wallets: Wallet[] = [
        { id: "w1", userId: "u1", name: "Wallet 1" },
        { id: "w2", userId: "u1", name: "Wallet 2" },
      ];
      const contributions: Contribution[] = [
        { id: "c1", userId: "u1", walletId: "w1", amount: 100, date: "2026-08-01" },
        { id: "c2", userId: "u1", walletId: "w1", amount: 200, date: "2026-08-02" },
        { id: "c3", userId: "u1", walletId: "w2", amount: 50, date: "2026-08-03" },
      ];
      const balances = calculateWalletBalances(wallets, contributions);
      expect(balances[0].balance).toBe(300);
      expect(balances[1].balance).toBe(50);
    });
  });

  describe("filterContributionsByWallet", () => {
    it("should filter contributions by walletId in descending date order", () => {
      const contributions: Contribution[] = [
        { id: "c1", userId: "u1", walletId: "w1", amount: 1000, date: "2026-08-01" },
        { id: "c2", userId: "u1", walletId: "w2", amount: 2000, date: "2026-08-02" },
        { id: "c3", userId: "u1", walletId: "w1", amount: 500, date: "2026-08-05" },
      ];
      const filtered = filterContributionsByWallet(contributions, "w1");
      expect(filtered).toHaveLength(2);
      expect(filtered[0].id).toBe("c3"); // Latest date first
      expect(filtered[1].id).toBe("c1");
    });
  });

  describe("calculateMonthlyPatrimonyEvolution", () => {
    it("should return empty array if no contributions exist", () => {
      expect(calculateMonthlyPatrimonyEvolution([])).toEqual([]);
    });

    it("should calculate cumulative monthly patrimony totals", () => {
      const contributions: Contribution[] = [
        { id: "c1", userId: "u1", walletId: "w1", amount: 1000, date: "2026-06-15" },
        { id: "c2", userId: "u1", walletId: "w1", amount: 500, date: "2026-07-10" },
        { id: "c3", userId: "u1", walletId: "w2", amount: 1500, date: "2026-08-01" },
      ];
      const points = calculateMonthlyPatrimonyEvolution(contributions);
      expect(points).toHaveLength(3);
      expect(points[0].accumulated).toBe(1000);
      expect(points[1].accumulated).toBe(1500);
      expect(points[2].accumulated).toBe(3000);
    });
  });

  describe("calculatePatrimonySummary", () => {
    it("should return zeros for empty contributions", () => {
      const summary = calculatePatrimonySummary([]);
      expect(summary.totalBalance).toBe(0);
      expect(summary.currentMonthDeposits).toBe(0);
      expect(summary.previousMonthDeposits).toBe(0);
      expect(summary.monthlyGrowthPercentage).toBe(0);
    });

    it("should return 100% growth when only current month has deposits", () => {
      const contributions: Contribution[] = [
        { id: "c1", userId: "u1", walletId: "w1", amount: 1000, date: "2026-08-01" },
      ];
      const summary = calculatePatrimonySummary(contributions);
      expect(summary.totalBalance).toBe(1000);
      expect(summary.monthlyGrowthPercentage).toBe(100);
    });

    it("should compute total balance and growth percentage", () => {
      const contributions: Contribution[] = [
        { id: "c1", userId: "u1", walletId: "w1", amount: 1000, date: "2026-07-01" },
        { id: "c2", userId: "u1", walletId: "w1", amount: 500, date: "2026-08-01" },
      ];
      const summary = calculatePatrimonySummary(contributions);
      expect(summary.totalBalance).toBe(1500);
      expect(summary.currentMonthDeposits).toBe(500);
      expect(summary.previousMonthDeposits).toBe(1000);
      expect(summary.monthlyGrowthPercentage).toBe(-50); // 500 vs 1000 = -50%
    });
  });
});
