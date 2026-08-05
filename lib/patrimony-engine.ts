export interface Wallet {
  id: string;
  userId: string;
  name: string;
  color?: string;
  createdAt?: any;
}

export interface Contribution {
  id?: string;
  userId: string;
  walletId: string;
  amount: number;
  date: string; // YYYY-MM-DD
  note?: string;
  createdAt?: any;
}

export interface WalletWithBalance {
  wallet: Wallet;
  balance: number;
}

export function calculateWalletBalances(
  wallets: Wallet[],
  contributions: Contribution[]
): WalletWithBalance[] {
  return wallets.map((wallet) => {
    const total = contributions
      .filter((c) => c.walletId === wallet.id)
      .reduce((sum, c) => sum + (c.amount || 0), 0);
    return {
      wallet,
      balance: Math.round(total * 100) / 100,
    };
  });
}

export function filterContributionsByWallet(
  contributions: Contribution[],
  walletId: string
): Contribution[] {
  return contributions
    .filter((c) => c.walletId === walletId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export interface MonthlyPatrimonyPoint {
  monthKey: string; // YYYY-MM
  label: string; // Month name or short format
  monthlyDeposit: number;
  accumulated: number;
}

export function calculateMonthlyPatrimonyEvolution(
  contributions: Contribution[]
): MonthlyPatrimonyPoint[] {
  if (contributions.length === 0) return [];

  // Group deposits by month (YYYY-MM)
  const depositsByMonth = new Map<string, number>();

  // Sort contributions chronologically
  const sorted = [...contributions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  sorted.forEach((c) => {
    const monthKey = c.date.substring(0, 7); // YYYY-MM
    depositsByMonth.set(
      monthKey,
      (depositsByMonth.get(monthKey) || 0) + (c.amount || 0)
    );
  });

  const monthKeys = Array.from(depositsByMonth.keys()).sort();
  let cumulative = 0;

  const monthNames = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez"
  ];

  return monthKeys.map((key) => {
    const deposit = depositsByMonth.get(key) || 0;
    cumulative += deposit;
    const [, monthNum] = key.split("-");
    const label = monthNames[parseInt(monthNum, 10) - 1] || key;

    return {
      monthKey: key,
      label,
      monthlyDeposit: Math.round(deposit * 100) / 100,
      accumulated: Math.round(cumulative * 100) / 100,
    };
  });
}
