import { describe, it, expect } from "vitest";
import {
  calculateBudgetAllocation,
  calculateCustomBudgetAllocation,
  removeBudgetCategory,
  DEFAULT_BUDGET_CATEGORIES,
  formatCurrency,
} from "@/lib/budget-engine";

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

  describe("calculateCustomBudgetAllocation", () => {
    it("should calculate allocations for custom categories list", () => {
      const customCategories = [
        { id: "cat1", name: "Moradia", percentage: 50 },
        { id: "cat2", name: "Investimentos", percentage: 20 },
        { id: "cat3", name: "Assinaturas", percentage: 10 },
      ];
      const result = calculateCustomBudgetAllocation(5000, customCategories);
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ category: customCategories[0], amount: 2500 });
      expect(result[1]).toEqual({ category: customCategories[1], amount: 1000 });
      expect(result[2]).toEqual({ category: customCategories[2], amount: 500 });
    });

    it("should use DEFAULT_BUDGET_CATEGORIES when no categories are passed", () => {
      const result = calculateCustomBudgetAllocation(1000);
      expect(result).toHaveLength(DEFAULT_BUDGET_CATEGORIES.length);
      const necessities = result.find((r) => r.category.id === "necessities");
      expect(necessities?.amount).toBe(550); // 55% of 1000
    });
  });

  describe("removeBudgetCategory", () => {
    it("should remove category by id from categories list", () => {
      const categories = [
        { id: "cat1", name: "Moradia", percentage: 50 },
        { id: "cat2", name: "Lazer", percentage: 20 },
      ];
      const updated = removeBudgetCategory(categories, "cat1");
      expect(updated).toHaveLength(1);
      expect(updated[0].id).toBe("cat2");
    });
  });
});

