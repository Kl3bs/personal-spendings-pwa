import { Investment, InvestmentCategory, BudgetCategoryConfig } from "./firebase/firestore";

export interface CalculatedCategory {
  id: string;
  name: string;
  percentage: number;
  amount: number;
  icon?: string;
  color?: string;
  isInvestmentGoal?: boolean;
}

export interface BudgetAllocation {
  totalIncome: number;
  necessities: number; // 55%
  investments: number; // 15% (Pay Yourself First)
  emergencyFund: number; // 10%
  leisure: number; // 10%
  education: number; // 10%
  categories: CalculatedCategory[];
}

export interface CategoryBreakdown {
  amount: number;
  percentage: number;
}

export interface InvestmentStats {
  totalInvested: number;
  targetInvested: number;
  targetProgressPercent: number;
  isTargetReached: boolean;
  byCategory: Record<InvestmentCategory, CategoryBreakdown>;
}

export const DEFAULT_BUDGET_CATEGORIES: BudgetCategoryConfig[] = [
  { id: "necessities", name: "Necessidades Básicas", percentage: 55, icon: "🏠", color: "#0284C7" },
  { id: "investments", name: "Investimentos", percentage: 15, icon: "🎯", color: "#7C3AED", isInvestmentGoal: true },
  { id: "emergency", name: "Reserva de Emergência", percentage: 10, icon: "🛡️", color: "#F59E0B" },
  { id: "leisure", name: "Lazer & Estilo de Vida", percentage: 10, icon: "🎉", color: "#EC4899" },
  { id: "education", name: "Educação & Conhecimento", percentage: 10, icon: "🎓", color: "#8B5CF6" },
];

export function calculateBudgetAllocation(
  baseIncome: number,
  extraIncome: number = 0,
  customCategories?: BudgetCategoryConfig[]
): BudgetAllocation {
  const total = Math.max(0, baseIncome + extraIncome);
  const configs = customCategories && customCategories.length > 0
    ? customCategories
    : DEFAULT_BUDGET_CATEGORIES;

  const categories: CalculatedCategory[] = configs.map((cat) => ({
    id: cat.id,
    name: cat.name,
    percentage: cat.percentage,
    amount: Math.round(total * (cat.percentage / 100) * 100) / 100,
    icon: cat.icon || "💰",
    color: cat.color || "#6B7280",
    isInvestmentGoal: !!cat.isInvestmentGoal,
  }));

  const findAmt = (id: string, defPct: number) => {
    const found = categories.find((c) => c.id === id);
    if (found) return found.amount;
    const invGoal = categories.find((c) => c.isInvestmentGoal);
    if (id === "investments" && invGoal) return invGoal.amount;
    return Math.round(total * defPct * 100) / 100;
  };

  return {
    totalIncome: total,
    necessities: findAmt("necessities", 0.55),
    investments: findAmt("investments", 0.15),
    emergencyFund: findAmt("emergency", 0.10),
    leisure: findAmt("leisure", 0.10),
    education: findAmt("education", 0.10),
    categories,
  };
}

export function calculateInvestmentStats(
  totalIncome: number,
  investments: Investment[],
  targetAmount?: number
): InvestmentStats {
  const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
  const targetInvested = typeof targetAmount === "number"
    ? Math.max(0, targetAmount)
    : Math.max(0, Math.round(totalIncome * 0.15 * 100) / 100);

  let targetProgressPercent = 0;
  if (targetInvested > 0) {
    targetProgressPercent = Math.round((totalInvested / targetInvested) * 10000) / 100;
  } else if (totalInvested > 0) {
    targetProgressPercent = 100;
  }

  const categories: InvestmentCategory[] = [
    "renda_fixa",
    "acoes_fiis",
    "reserva_emergencia",
    "cripto",
    "outros",
  ];

  const byCategory = categories.reduce((acc, cat) => {
    const amount = investments
      .filter((inv) => inv.category === cat)
      .reduce((sum, inv) => sum + inv.amount, 0);

    const percentage =
      totalInvested > 0
        ? Math.round((amount / totalInvested) * 10000) / 100
        : 0;

    acc[cat] = { amount, percentage };
    return acc;
  }, {} as Record<InvestmentCategory, CategoryBreakdown>);

  return {
    totalInvested,
    targetInvested,
    targetProgressPercent,
    isTargetReached: totalInvested >= targetInvested && targetInvested >= 0,
    byCategory,
  };
}

export function calculateNetBalance(
  totalIncome: number,
  totalExpenses: number,
  totalInvested: number
): number {
  return Math.round((totalIncome - totalExpenses - totalInvested) * 100) / 100;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);
}

export interface BalanceChartItem {
  label: string;
  income: number;
  expenses: number;
  incPercent: number;
  expPercent: number;
}

export function calculateBalanceChartData(
  expenses: Array<{ date: string; amount: number }>,
  totalIncome: number,
  mode: "months" | "weeks",
  referenceDate: Date = new Date()
): BalanceChartItem[] {
  const parseLocalDate = (dateStr: string) => {
    if (dateStr.includes("T")) return new Date(dateStr);
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    }
    return new Date(dateStr);
  };

  if (mode === "weeks") {
    const currentYear = referenceDate.getFullYear();
    const currentMonth = referenceDate.getMonth();
    const weeklyIncome = Math.round((totalIncome / 4) * 100) / 100;

    return [1, 2, 3, 4].map((weekNum) => {
      const weekExpenses = expenses
        .filter((e) => {
          const d = parseLocalDate(e.date);
          if (d.getFullYear() !== currentYear || d.getMonth() !== currentMonth) return false;
          const day = d.getDate();
          if (weekNum === 1) return day >= 1 && day <= 7;
          if (weekNum === 2) return day >= 8 && day <= 14;
          if (weekNum === 3) return day >= 15 && day <= 21;
          return day >= 22;
        })
        .reduce((sum, e) => sum + e.amount, 0);

      const maxVal = Math.max(weeklyIncome, weekExpenses, 1);
      return {
        label: `Sem ${weekNum}`,
        income: weeklyIncome,
        expenses: weekExpenses,
        incPercent: Math.min(100, Math.round((weeklyIncome / maxVal) * 100)),
        expPercent: Math.min(100, Math.round((weekExpenses / maxVal) * 100)),
      };
    });
  } else {
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const result: BalanceChartItem[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth();
      const label = monthNames[month];

      const monthExpenses = expenses
        .filter((e) => {
          const expDate = parseLocalDate(e.date);
          return expDate.getFullYear() === year && expDate.getMonth() === month;
        })
        .reduce((sum, e) => sum + e.amount, 0);

      const maxVal = Math.max(totalIncome, monthExpenses, 1);

      result.push({
        label,
        income: totalIncome,
        expenses: monthExpenses,
        incPercent: Math.min(100, Math.round((totalIncome / maxVal) * 100)),
        expPercent: Math.min(100, Math.round((monthExpenses / maxVal) * 100)),
      });
    }

    return result;
  }
}

