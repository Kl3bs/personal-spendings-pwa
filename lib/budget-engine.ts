import { Investment, InvestmentCategory } from "./firebase/firestore";

export interface BudgetAllocation {
  totalIncome: number;
  necessities: number; // 55%
  investments: number; // 15% (Pay Yourself First)
  emergencyFund: number; // 10%
  leisure: number; // 10%
  education: number; // 10%
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

export function calculateBudgetAllocation(baseIncome: number, extraIncome: number = 0): BudgetAllocation {
  const total = Math.max(0, baseIncome + extraIncome);
  return {
    totalIncome: total,
    necessities: Math.round(total * 0.55 * 100) / 100,
    investments: Math.round(total * 0.15 * 100) / 100,
    emergencyFund: Math.round(total * 0.10 * 100) / 100,
    leisure: Math.round(total * 0.10 * 100) / 100,
    education: Math.round(total * 0.10 * 100) / 100,
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

