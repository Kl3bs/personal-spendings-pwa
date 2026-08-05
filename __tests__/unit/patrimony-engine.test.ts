import { describe, it, expect } from "vitest";
import { Wallet, Contribution, calculateWalletBalances } from "@/lib/patrimony-engine";

describe("patrimony-engine", () => {
  describe("calculateWalletBalances", () => {
    it("should return zero balance for wallets with no contributions", () => {
      const wallets: Wallet[] = [
        { id: "w1", userId: "u1", name: "Reserva de Emergência" },
        { id: "w2", userId: "u1", name: "CDB Nubank" },
      ];
      const result = calculateWalletBalances(wallets, []);
      expect(result).toHaveLength(2);
      expect(result[0].balance).toBe(0);
      expect(result[1].balance).toBe(0);
    });

    it("should sum contributions per wallet correctly", () => {
      const wallets: Wallet[] = [
        { id: "w1", userId: "u1", name: "Reserva de Emergência" },
        { id: "w2", userId: "u1", name: "CDB Nubank" },
      ];
      const contributions: Contribution[] = [
        { id: "c1", userId: "u1", walletId: "w1", amount: 1000, date: "2026-08-01" },
        { id: "c2", userId: "u1", walletId: "w1", amount: 500, date: "2026-08-05" },
        { id: "c3", userId: "u1", walletId: "w2", amount: 2000, date: "2026-08-02" },
      ];
      const result = calculateWalletBalances(wallets, contributions);
      expect(result.find((w) => w.wallet.id === "w1")?.balance).toBe(1500);
      expect(result.find((w) => w.wallet.id === "w2")?.balance).toBe(2000);
    });
  });
});
