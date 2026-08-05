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

export interface BudgetMethodology {
  id: string;
  name: string;
  description: string;
  categories: BudgetCategory[];
}

export const DEFAULT_BUDGET_CATEGORIES: BudgetCategory[] = [
  { id: "necessities", name: "Necessidades Básicas", percentage: 55, description: "Moradia, Alimentação e Contas", icon: "🏠" },
  { id: "investments", name: "Para o Seu Futuro (Investimentos)", percentage: 15, description: "Boleto Obrigatório Nº 1", icon: "Sparkles" },
  { id: "emergencyFund", name: "Reserva de Emergência", percentage: 10, description: "Meta: 6 meses de custo de vida", icon: "ShieldCheck" },
  { id: "leisure", name: "Lazer & Supérfluos", percentage: 10, description: "Passeios, hobbies e relaxamento", icon: "HeartHandshake" },
  { id: "education", name: "Educação", percentage: 10, description: "Livros, cursos e evolução pessoal", icon: "GraduationCap" },
];

export const BUDGET_METHODOLOGIES: BudgetMethodology[] = [
  {
    id: "payYourselfFirst",
    name: "Pay Yourself First (55/15/10/10/10)",
    description: "Priorize seu futuro antes de pagar qualquer outra conta.",
    categories: DEFAULT_BUDGET_CATEGORIES,
  },
  {
    id: "rule503020",
    name: "Regra 50/30/20",
    description: "Divisão clássica: 50% necessidades, 30% desejos/lazer, 20% investimentos.",
    categories: [
      { id: "necessities", name: "Necessidades Básicas", percentage: 50, description: "Aluguel, contas, alimentação básica", icon: "🏠" },
      { id: "leisure", name: "Desejos & Lazer", percentage: 30, description: "Restaurantes, hobbies, streaming", icon: "HeartHandshake" },
      { id: "investments", name: "Investimentos & Poupança", percentage: 20, description: "Reserva e liberdade financeira", icon: "Sparkles" },
    ],
  },
  {
    id: "rule602020",
    name: "Regra 60/20/20",
    description: "Ideal para quem precisa de maior margem no custo de vida essencial.",
    categories: [
      { id: "necessities", name: "Necessidades Essenciais", percentage: 60, description: "Moradia, transporte, saúde", icon: "🏠" },
      { id: "investments", name: "Investimentos & Reserva", percentage: 20, description: "Metas de longo prazo", icon: "Sparkles" },
      { id: "leisure", name: "Lazer & Estilo de Vida", percentage: 20, description: "Passeios e compras", icon: "HeartHandshake" },
    ],
  },
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

export function removeBudgetCategory(
  categories: BudgetCategory[],
  categoryId: string
): BudgetCategory[] {
  return categories.filter((cat) => cat.id !== categoryId);
}

export interface PercentageStatus {
  totalPercentage: number;
  isComplete: boolean;
  message: string;
  status: "complete" | "under" | "over";
}

export function getBudgetPercentageStatus(categories: BudgetCategory[]): PercentageStatus {
  const total = categories.reduce((sum, cat) => sum + (cat.percentage || 0), 0);
  const roundedTotal = Math.round(total * 100) / 100;

  if (roundedTotal === 100) {
    return {
      totalPercentage: 100,
      isComplete: true,
      message: "⋆ 100% do orçamento distribuído perfeitamente",
      status: "complete",
    };
  } else if (roundedTotal < 100) {
    const diff = Math.round((100 - roundedTotal) * 100) / 100;
    return {
      totalPercentage: roundedTotal,
      isComplete: false,
      message: `⋆ ${roundedTotal}% distribuídos — faltam ${diff}%`,
      status: "under",
    };
  } else {
    const diff = Math.round((roundedTotal - 100) * 100) / 100;
    return {
      totalPercentage: roundedTotal,
      isComplete: false,
      message: `⋆ ${roundedTotal}% distribuídos — ${diff}% acima de 100%`,
      status: "over",
    };
  }
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
