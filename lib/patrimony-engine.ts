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
