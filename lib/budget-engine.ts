export interface BudgetAllocation {
  totalIncome: number;
  necessities: number; // 55%
  investments: number; // 15% (Pay Yourself First)
  emergencyFund: number; // 10%
  leisure: number; // 10%
  education: number; // 10%
}

export interface BudgetCategory {
  id: string;
  name: string;
  percentage: number;
  description?: string;
  icon?: string;
}

export const DEFAULT_BUDGET_CATEGORIES: BudgetCategory[] = [
  { id: "necessities", name: "Necessidades Básicas", percentage: 55, description: "Moradia, Alimentação e Contas", icon: "🏠" },
  { id: "investments", name: "Para o Seu Futuro (Investimentos)", percentage: 15, description: "Boleto Obrigatório Nº 1", icon: "Sparkles" },
  { id: "emergencyFund", name: "Reserva de Emergência", percentage: 10, description: "Meta: 6 meses de custo de vida", icon: "ShieldCheck" },
  { id: "leisure", name: "Lazer & Supérfluos", percentage: 10, description: "Passeios, hobbies e relaxamento", icon: "HeartHandshake" },
  { id: "education", name: "Educação", percentage: 10, description: "Livros, cursos e evolução pessoal", icon: "GraduationCap" },
];

export interface CategoryAllocation {
  category: BudgetCategory;
  amount: number;
}

export function calculateCustomBudgetAllocation(
  totalIncome: number,
  categories: BudgetCategory[] = DEFAULT_BUDGET_CATEGORIES
): CategoryAllocation[] {
  const safeTotal = Math.max(0, totalIncome);
  return categories.map((cat) => ({
    category: cat,
    amount: Math.round(safeTotal * (cat.percentage / 100) * 100) / 100,
  }));
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
