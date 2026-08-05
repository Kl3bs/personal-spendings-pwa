export interface BudgetAllocation {
  totalIncome: number;
  necessities: number; // 55%
  investments: number; // 15% (Pay Yourself First)
  emergencyFund: number; // 10%
  leisure: number; // 10%
  education: number; // 10%
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

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);
}
