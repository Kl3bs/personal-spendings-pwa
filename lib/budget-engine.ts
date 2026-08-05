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
  investments: Investment[]
): InvestmentStats {
  const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
  const targetInvested = Math.max(0, Math.round(totalIncome * 0.15 * 100) / 100);

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

