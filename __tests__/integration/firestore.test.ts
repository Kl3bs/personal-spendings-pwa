import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock firebase/firestore module
vi.mock("firebase/firestore", () => {
  return {
    collection: vi.fn(() => "expenses-collection-ref"),
    doc: vi.fn((db, path, id) => `doc-ref-${path}-${id}`),
    addDoc: vi.fn().mockResolvedValue({ id: "new-expense-id" }),
    updateDoc: vi.fn().mockResolvedValue(undefined),
    deleteDoc: vi.fn().mockResolvedValue(undefined),
    setDoc: vi.fn().mockResolvedValue(undefined),
    getDoc: vi.fn(),
    onSnapshot: vi.fn((queryOrRef, onNext) => {
      onNext({
        exists: () => true,
        data: () => ({ uid: "user-123", email: "test@example.com" }),
        docs: [
          {
            id: "exp-1",
            data: () => ({
              userId: "user-123",
              amount: 150,
              category: "essencial",
              description: "Mercado",
              date: "2026-08-01",
            }),
          },
        ],
      });
      return vi.fn(); // unsubscribe function
    }),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    Timestamp: {
      now: vi.fn(() => "timestamp-mock"),
    },
    writeBatch: vi.fn(() => ({
      set: vi.fn(),
      commit: vi.fn().mockResolvedValue(undefined),
    })),
  };
});

// Mock config module
vi.mock("@/lib/firebase/config", () => ({
  db: {},
}));

import {
  ensureUserProfile,
  setUserProfile,
  getUserProfile,
  subscribeUserProfile,
  addExpense,
  addExpensesBatch,
  updateExpense,
  deleteExpense,
  subscribeExpenses,
  addInvestment,
  updateInvestment,
  deleteInvestment,
  subscribeInvestments,
  addWallet,
  subscribeWallets,
  deleteWallet,
  addContribution,
  subscribeContributions,
  deleteContribution,
} from "@/lib/firebase/firestore";
import * as firestore from "firebase/firestore";

describe("firestore integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("UserProfile operations", () => {
    it("should create default profile when snap does not exist", async () => {
      vi.mocked(firestore.getDoc).mockResolvedValueOnce({
        exists: () => false,
      } as unknown as firestore.DocumentSnapshot);

      const profile = await ensureUserProfile(
        { uid: "user-1", email: "test@example.com" },
        4000,
      );
      expect(profile).not.toBeNull();
      expect(profile?.uid).toBe("user-1");
      expect(profile?.baseIncome).toBe(4000);
      expect(firestore.setDoc).toHaveBeenCalled();
    });

    it("should update profile if display name changed", async () => {
      vi.mocked(firestore.getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          uid: "user-1",
          email: "test@example.com",
          displayName: "Old Name",
        }),
      } as unknown as firestore.DocumentSnapshot);

      const profile = await ensureUserProfile({
        uid: "user-1",
        email: "test@example.com",
        displayName: "New Name",
      });
      expect(profile?.displayName).toBe("New Name");
      expect(firestore.setDoc).toHaveBeenCalledWith(
        "doc-ref-users-user-1",
        expect.objectContaining({ displayName: "New Name" }),
        { merge: true },
      );
    });

    it("should get existing user profile", async () => {
      vi.mocked(firestore.getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          uid: "user-1",
          email: "test@example.com",
          baseIncome: 5000,
        }),
      } as unknown as firestore.DocumentSnapshot);

      const profile = await getUserProfile("user-1");
      expect(profile).toEqual({
        uid: "user-1",
        email: "test@example.com",
        baseIncome: 5000,
      });
    });

    it("should return null if user profile does not exist", async () => {
      vi.mocked(firestore.getDoc).mockResolvedValueOnce({
        exists: () => false,
      } as unknown as firestore.DocumentSnapshot);

      const profile = await getUserProfile("non-existent");
      expect(profile).toBeNull();
    });

    it("should update user profile via setUserProfile", async () => {
      await setUserProfile({ uid: "user-1", baseIncome: 6000, theme: "Dark" });
      expect(firestore.setDoc).toHaveBeenCalledWith(
        "doc-ref-users-user-1",
        expect.objectContaining({ baseIncome: 6000, theme: "Dark" }),
        { merge: true },
      );
    });

    it("should save budgetCategories via setUserProfile", async () => {
      const budgetCategories = [
        { id: "cat-1", name: "Moradia", percentage: 50 },
        { id: "cat-2", name: "Investimentos", percentage: 50 },
      ];
      await setUserProfile({ uid: "user-1", budgetCategories });
      expect(firestore.setDoc).toHaveBeenCalledWith(
        "doc-ref-users-user-1",
        expect.objectContaining({ budgetCategories }),
        { merge: true },
      );
    });

    it("should subscribe to user profile changes", () => {
      const callback = vi.fn();
      const unsubscribe = subscribeUserProfile("user-1", callback);
      expect(firestore.onSnapshot).toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith({
        uid: "user-123",
        email: "test@example.com",
      });
      expect(typeof unsubscribe).toBe("function");
    });

    it("should handle error in ensureUserProfile gracefully", async () => {
      vi.mocked(firestore.getDoc).mockRejectedValueOnce(
        new Error("Firestore connection error"),
      );
      const profile = await ensureUserProfile({ uid: "err-user" });
      expect(profile).toBeNull();
    });

    it("should handle error in getUserProfile gracefully", async () => {
      vi.mocked(firestore.getDoc).mockRejectedValueOnce(
        new Error("Network error"),
      );
      const profile = await getUserProfile("err-user");
      expect(profile).toBeNull();
    });

    it("should handle error in setUserProfile gracefully", async () => {
      vi.mocked(firestore.setDoc).mockRejectedValueOnce(
        new Error("Write error"),
      );
      await expect(
        setUserProfile({ uid: "err-user", baseIncome: 1000 }),
      ).resolves.not.toThrow();
    });

    it("should handle permission-denied error in subscribeUserProfile", () => {
      vi.mocked(firestore.onSnapshot).mockImplementationOnce(
        (ref: unknown, onNext: unknown, onError?: unknown) => {
          if (typeof onError === "function") {
            onError({ code: "permission-denied" });
          }
          return vi.fn();
        },
      );

      const callback = vi.fn();
      subscribeUserProfile("denied-user", callback);
      expect(callback).toHaveBeenCalledWith(null);
    });

    it("should handle generic error in subscribeUserProfile", () => {
      vi.mocked(firestore.onSnapshot).mockImplementationOnce(
        (ref: unknown, onNext: unknown, onError?: unknown) => {
          if (typeof onError === "function") {
            onError(new Error("General snapshot error"));
          }
          return vi.fn();
        },
      );

      const callback = vi.fn();
      subscribeUserProfile("err-user", callback);
      expect(callback).toHaveBeenCalledWith(null);
    });

    it("should return empty unsubscribe if uid is missing in subscribeUserProfile", () => {
      const callback = vi.fn();
      const unsub = subscribeUserProfile("", callback);
      expect(callback).toHaveBeenCalledWith(null);
      expect(typeof unsub).toBe("function");
    });
  });

  describe("Expense operations", () => {
    it("should add a new expense with isMonthlyBill flag", async () => {
      const res = await addExpense({
        userId: "user-1",
        amount: 200,
        category: "essencial",
        description: "Aluguel",
        date: "2026-08-05",
        isMonthlyBill: true,
      });

      expect(firestore.addDoc).toHaveBeenCalledWith(
        "expenses-collection-ref",
        expect.objectContaining({
          userId: "user-1",
          amount: 200,
          category: "essencial",
          description: "Aluguel",
          isMonthlyBill: true,
          createdAt: "timestamp-mock",
        }),
      );
      expect(res.id).toBe("new-expense-id");
    });

    it("should add multiple expenses in batch via writeBatch", async () => {
      const expenses = [
        {
          userId: "user-1",
          amount: 50,
          category: "essencial" as const,
          description: "Almoço",
          date: "2026-08-05",
        },
        {
          userId: "user-1",
          amount: 120,
          category: "superfluo" as const,
          description: "Cinema",
          date: "2026-08-05",
        },
      ];

      await addExpensesBatch(expenses);
      expect(firestore.writeBatch).toHaveBeenCalled();
    });

    it("should update an existing expense", async () => {
      await updateExpense("exp-123", { amount: 300 });
      expect(firestore.updateDoc).toHaveBeenCalledWith(
        "doc-ref-expenses-exp-123",
        { amount: 300 },
      );
    });

    it("should delete an expense", async () => {
      await deleteExpense("exp-123");
      expect(firestore.deleteDoc).toHaveBeenCalledWith(
        "doc-ref-expenses-exp-123",
      );
    });

    it("should return empty unsubscribe if userId is missing in subscribeExpenses", () => {
      const callback = vi.fn();
      const unsub = subscribeExpenses("", callback);
      expect(callback).toHaveBeenCalledWith([]);
      expect(typeof unsub).toBe("function");
    });

    it("should handle permission-denied in subscribeExpenses", () => {
      vi.mocked(firestore.onSnapshot).mockImplementationOnce(
        (query: unknown, onNext: unknown, onError?: unknown) => {
          if (typeof onError === "function") {
            onError({ code: "permission-denied" });
          }
          return vi.fn();
        },
      );

      const callback = vi.fn();
      subscribeExpenses("denied-user", callback);
      expect(callback).toHaveBeenCalledWith([]);
    });

    it("should handle generic error in subscribeExpenses", () => {
      vi.mocked(firestore.onSnapshot).mockImplementationOnce(
        (query: unknown, onNext: unknown, onError?: unknown) => {
          if (typeof onError === "function") {
            onError(new Error("Query error"));
          }
          return vi.fn();
        },
      );

      const callback = vi.fn();
      subscribeExpenses("err-user", callback);
      expect(callback).toHaveBeenCalledWith([]);
    });
  });

  describe("Investment operations", () => {
    it("should add a new investment with timestamp", async () => {
      const invData = {
        userId: "user-123",
        amount: 500,
        category: "renda_fixa" as const,
        description: "CDB 100% CDI",
        date: "2026-08-01",
      };
      await addInvestment(invData);

      expect(firestore.collection).toHaveBeenCalledWith({}, "investments");
      expect(firestore.addDoc).toHaveBeenCalledWith("expenses-collection-ref", {
        ...invData,
        createdAt: "timestamp-mock",
      });
    });

    it("should update an existing investment", async () => {
      await updateInvestment("inv-123", { amount: 600 });
      expect(firestore.updateDoc).toHaveBeenCalledWith(
        "doc-ref-investments-inv-123",
        { amount: 600 },
      );
    });

    it("should delete an investment", async () => {
      await deleteInvestment("inv-123");
      expect(firestore.deleteDoc).toHaveBeenCalledWith(
        "doc-ref-investments-inv-123",
      );
    });

    it("should return empty unsubscribe if userId is missing in subscribeInvestments", () => {
      const callback = vi.fn();
      const unsub = subscribeInvestments("", callback);
      expect(callback).toHaveBeenCalledWith([]);
      expect(typeof unsub).toBe("function");
    });

    it("should handle permission-denied in subscribeInvestments", () => {
      vi.mocked(firestore.onSnapshot).mockImplementationOnce(
        (query: unknown, onNext: unknown, onError?: unknown) => {
          if (typeof onError === "function") {
            onError({ code: "permission-denied" });
          }
          return vi.fn();
        },
      );

      const callback = vi.fn();
      subscribeInvestments("denied-user", callback);
      expect(callback).toHaveBeenCalledWith([]);
    });

    it("should handle generic error in subscribeInvestments", () => {
      vi.mocked(firestore.onSnapshot).mockImplementationOnce(
        (query: unknown, onNext: unknown, onError?: unknown) => {
          if (typeof onError === "function") {
            onError(new Error("Query error"));
          }
          return vi.fn();
        },
      );

      const callback = vi.fn();
      subscribeInvestments("err-user", callback);
      expect(callback).toHaveBeenCalledWith([]);
    });
  });

  describe("Wallet operations", () => {
    it("should add a wallet with color", async () => {
      await addWallet({ userId: "u1", name: "Cripto", color: "#FF9900" });
      expect(firestore.addDoc).toHaveBeenCalledWith(
        "expenses-collection-ref",
        expect.objectContaining({
          userId: "u1",
          name: "Cripto",
          color: "#FF9900",
        }),
      );
    });

    it("should add a wallet without color", async () => {
      await addWallet({ userId: "u1", name: "Reserva" });
      expect(firestore.addDoc).toHaveBeenCalled();
    });

    it("should subscribe to wallets", () => {
      const callback = vi.fn();
      subscribeWallets("u1", callback);
      expect(callback).toHaveBeenCalled();
    });

    it("should handle empty userId in subscribeWallets", () => {
      const callback = vi.fn();
      const unsub = subscribeWallets("", callback);
      expect(callback).toHaveBeenCalledWith([]);
      expect(typeof unsub).toBe("function");
    });

    it("should handle permission-denied in subscribeWallets", () => {
      vi.mocked(firestore.onSnapshot).mockImplementationOnce(
        (q: unknown, onNext: unknown, onError?: unknown) => {
          if (typeof onError === "function") {
            onError({ code: "permission-denied" });
          }
          return vi.fn();
        },
      );
      const callback = vi.fn();
      subscribeWallets("u1", callback);
      expect(callback).toHaveBeenCalledWith([]);
    });

    it("should handle generic error in subscribeWallets", () => {
      vi.mocked(firestore.onSnapshot).mockImplementationOnce(
        (q: unknown, onNext: unknown, onError?: unknown) => {
          if (typeof onError === "function") {
            onError(new Error("Wallet error"));
          }
          return vi.fn();
        },
      );
      const callback = vi.fn();
      subscribeWallets("u1", callback);
      expect(callback).toHaveBeenCalledWith([]);
    });

    it("should delete a wallet", async () => {
      await deleteWallet("w1");
      expect(firestore.deleteDoc).toHaveBeenCalledWith("doc-ref-wallets-w1");
    });
  });

  describe("Contribution operations", () => {
    it("should add a contribution with note", async () => {
      await addContribution({
        userId: "u1",
        walletId: "w1",
        amount: 500,
        date: "2026-08-01",
        note: "Aporte mensal",
      });
      expect(firestore.addDoc).toHaveBeenCalledWith(
        "expenses-collection-ref",
        expect.objectContaining({
          userId: "u1",
          walletId: "w1",
          amount: 500,
          note: "Aporte mensal",
        }),
      );
    });

    it("should add a contribution without note", async () => {
      await addContribution({
        userId: "u1",
        walletId: "w1",
        amount: 200,
        date: "2026-08-02",
      });
      expect(firestore.addDoc).toHaveBeenCalled();
    });

    it("should subscribe to contributions and sort them descending", () => {
      vi.mocked(firestore.onSnapshot).mockImplementationOnce(
        (q: unknown, onNext: unknown) => {
          if (typeof onNext === "function") {
            onNext({
              docs: [
                {
                  id: "c1",
                  data: () => ({
                    userId: "u1",
                    walletId: "w1",
                    amount: 100,
                    date: "2026-08-01",
                  }),
                },
                {
                  id: "c2",
                  data: () => ({
                    userId: "u1",
                    walletId: "w1",
                    amount: 200,
                    date: "2026-08-05",
                  }),
                },
              ],
            });
          }
          return vi.fn();
        },
      );
      const callback = vi.fn();
      subscribeContributions("u1", callback);
      expect(callback).toHaveBeenCalledWith([
        {
          id: "c2",
          userId: "u1",
          walletId: "w1",
          amount: 200,
          date: "2026-08-05",
        },
        {
          id: "c1",
          userId: "u1",
          walletId: "w1",
          amount: 100,
          date: "2026-08-01",
        },
      ]);
    });

    it("should handle empty userId in subscribeContributions", () => {
      const callback = vi.fn();
      const unsub = subscribeContributions("", callback);
      expect(callback).toHaveBeenCalledWith([]);
      expect(typeof unsub).toBe("function");
    });

    it("should handle permission-denied in subscribeContributions", () => {
      vi.mocked(firestore.onSnapshot).mockImplementationOnce(
        (q: unknown, onNext: unknown, onError?: unknown) => {
          if (typeof onError === "function") {
            onError({ code: "permission-denied" });
          }
          return vi.fn();
        },
      );
      const callback = vi.fn();
      subscribeContributions("u1", callback);
      expect(callback).toHaveBeenCalledWith([]);
    });

    it("should handle generic error in subscribeContributions", () => {
      vi.mocked(firestore.onSnapshot).mockImplementationOnce(
        (q: unknown, onNext: unknown, onError?: unknown) => {
          if (typeof onError === "function") {
            onError(new Error("Contribution error"));
          }
          return vi.fn();
        },
      );
      const callback = vi.fn();
      subscribeContributions("u1", callback);
      expect(callback).toHaveBeenCalledWith([]);
    });

    it("should delete a contribution", async () => {
      await deleteContribution("c1");
      expect(firestore.deleteDoc).toHaveBeenCalledWith(
        "doc-ref-contributions-c1",
      );
    });
  });
});
