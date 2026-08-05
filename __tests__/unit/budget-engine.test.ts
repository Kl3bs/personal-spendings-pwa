import { describe, it, expect } from "vitest";
import { calculateBudgetAllocation, formatCurrency } from "@/lib/budget-engine";

describe("budget-engine", () => {
  describe("calculateBudgetAllocation", () => {
    it("should calculate correct allocations for standard income", () => {
      const result = calculateBudgetAllocation(5000, 1000); // Total: 6000
      expect(result.totalIncome).toBe(6000);
      expect(result.necessities).toBe(3300); // 55%
      expect(result.investments).toBe(900); // 15%
      expect(result.emergencyFund).toBe(600); // 10%
      expect(result.leisure).toBe(600); // 10%
      expect(result.education).toBe(600); // 10%
    });

    it("should default extraIncome to 0 when omitted", () => {
      const result = calculateBudgetAllocation(3000);
      expect(result.totalIncome).toBe(3000);
      expect(result.necessities).toBe(1650);
      expect(result.investments).toBe(450);
    });

    it("should handle 0 income gracefully", () => {
      const result = calculateBudgetAllocation(0, 0);
      expect(result.totalIncome).toBe(0);
      expect(result.necessities).toBe(0);
      expect(result.investments).toBe(0);
      expect(result.emergencyFund).toBe(0);
      expect(result.leisure).toBe(0);
      expect(result.education).toBe(0);
    });

    it("should clamp negative income to 0", () => {
      const result = calculateBudgetAllocation(-1000, -500);
      expect(result.totalIncome).toBe(0);
      expect(result.necessities).toBe(0);
    });

    it("should correctly round floating numbers to 2 decimal places", () => {
      const result = calculateBudgetAllocation(1234.56, 78.90); // 1313.46
      expect(result.totalIncome).toBe(1313.46);
      expect(result.necessities).toBe(722.4); // 1313.46 * 0.55 = 722.403 -> 722.4
      expect(result.investments).toBe(197.02); // 1313.46 * 0.15 = 197.019 -> 197.02
    });

    it("should calculate allocations based on custom categories if provided", () => {
      const customCategories = [
        { id: "cat-1", name: "Moradia", percentage: 50 },
        { id: "cat-2", name: "Investimentos", percentage: 20, isInvestmentGoal: true },
        { id: "cat-3", name: "Viagens", percentage: 15 },
        { id: "cat-4", name: "Lazer", percentage: 15 },
      ];
      const result = calculateBudgetAllocation(10000, 0, customCategories);
      expect(result.totalIncome).toBe(10000);
      expect(result.categories).toHaveLength(4);
      expect(result.categories[0]).toEqual({
        id: "cat-1",
        name: "Moradia",
        percentage: 50,
        amount: 5000,
        icon: "💰",
        color: "#6B7280",
        isInvestmentGoal: false,
      });
      expect(result.investments).toBe(2000); // 20% of 10000
    });
  });

  describe("formatCurrency", () => {
    it("should format positive number as BRL currency", () => {
      const formatted = formatCurrency(1250.5);
      expect(formatted).toContain("1.250,50");
      expect(formatted).toContain("R$");
    });

    it("should format zero as BRL currency", () => {
      const formatted = formatCurrency(0);
      expect(formatted).toContain("0,00");
    });

    it("should format negative numbers correctly", () => {
      const formatted = formatCurrency(-500);
      expect(formatted).toContain("500,00");
    });
  });
});
