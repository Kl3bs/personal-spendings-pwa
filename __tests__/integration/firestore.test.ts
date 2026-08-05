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
  updateExpense,
  deleteExpense,
  subscribeExpenses,
  addInvestment,
  updateInvestment,
  deleteInvestment,
  subscribeInvestments,
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

      const profile = await ensureUserProfile({ uid: "user-1", email: "test@example.com" }, 4000);
      expect(profile).not.toBeNull();
      expect(profile?.uid).toBe("user-1");
      expect(profile?.baseIncome).toBe(4000);
      expect(firestore.setDoc).toHaveBeenCalled();
    });

    it("should update profile if display name changed", async () => {
      vi.mocked(firestore.getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ uid: "user-1", email: "test@example.com", displayName: "Old Name" }),
      } as unknown as firestore.DocumentSnapshot);

      const profile = await ensureUserProfile({ uid: "user-1", email: "test@example.com", displayName: "New Name" });
      expect(profile?.displayName).toBe("New Name");
      expect(firestore.setDoc).toHaveBeenCalledWith(
        "doc-ref-users-user-1",
        expect.objectContaining({ displayName: "New Name" }),
        { merge: true }
      );
    });

    it("should get existing user profile", async () => {
      vi.mocked(firestore.getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ uid: "user-1", email: "test@example.com", baseIncome: 5000 }),
      } as unknown as firestore.DocumentSnapshot);

      const profile = await getUserProfile("user-1");
      expect(profile).toEqual({ uid: "user-1", email: "test@example.com", baseIncome: 5000 });
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
        { merge: true }
      );
    });

    it("should subscribe to user profile changes", () => {
      const callback = vi.fn();
      const unsubscribe = subscribeUserProfile("user-1", callback);
      expect(firestore.onSnapshot).toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith({ uid: "user-123", email: "test@example.com" });
      expect(typeof unsubscribe).toBe("function");
    });

    it("should handle error in ensureUserProfile gracefully", async () => {
      vi.mocked(firestore.getDoc).mockRejectedValueOnce(new Error("Firestore connection error"));
      const profile = await ensureUserProfile({ uid: "err-user" });
      expect(profile).toBeNull();
    });

    it("should handle error in getUserProfile gracefully", async () => {
      vi.mocked(firestore.getDoc).mockRejectedValueOnce(new Error("Network error"));
      const profile = await getUserProfile("err-user");
      expect(profile).toBeNull();
    });

    it("should handle error in setUserProfile gracefully", async () => {
      vi.mocked(firestore.setDoc).mockRejectedValueOnce(new Error("Write error"));
      await expect(setUserProfile({ uid: "err-user", baseIncome: 1000 })).resolves.not.toThrow();
    });

    it("should handle permission-denied error in subscribeUserProfile", () => {
      vi.mocked(firestore.onSnapshot).mockImplementationOnce((ref: unknown, onNext: unknown, onError?: unknown) => {
        if (typeof onError === "function") {
          onError({ code: "permission-denied" });
        }
        return vi.fn();
      });

      const callback = vi.fn();
      subscribeUserProfile("denied-user", callback);
      expect(callback).toHaveBeenCalledWith(null);
    });

    it("should handle generic error in subscribeUserProfile", () => {
      vi.mocked(firestore.onSnapshot).mockImplementationOnce((ref: unknown, onNext: unknown, onError?: unknown) => {
        if (typeof onError === "function") {
          onError(new Error("General snapshot error"));
        }
        return vi.fn();
      });

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
    it("should add a new expense", async () => {
      const res = await addExpense({
        userId: "user-1",
        amount: 200,
        category: "essencial",
        description: "Supermercado",
        date: "2026-08-05",
      });

      expect(firestore.addDoc).toHaveBeenCalledWith(
        "expenses-collection-ref",
        expect.objectContaining({
          userId: "user-1",
          amount: 200,
          category: "essencial",
          description: "Supermercado",
          createdAt: "timestamp-mock",
        })
      );
      expect(res.id).toBe("new-expense-id");
    });

    it("should update an existing expense", async () => {
      await updateExpense("exp-123", { amount: 300 });
      expect(firestore.updateDoc).toHaveBeenCalledWith("doc-ref-expenses-exp-123", { amount: 300 });
    });

    it("should delete an expense", async () => {
      await deleteExpense("exp-123");
      expect(firestore.deleteDoc).toHaveBeenCalledWith("doc-ref-expenses-exp-123");
    });

    it("should return empty unsubscribe if userId is missing in subscribeExpenses", () => {
      const callback = vi.fn();
      const unsub = subscribeExpenses("", callback);
      expect(callback).toHaveBeenCalledWith([]);
      expect(typeof unsub).toBe("function");
    });

    it("should handle permission-denied in subscribeExpenses", () => {
      vi.mocked(firestore.onSnapshot).mockImplementationOnce((query: unknown, onNext: unknown, onError?: unknown) => {
        if (typeof onError === "function") {
          onError({ code: "permission-denied" });
        }
        return vi.fn();
      });

      const callback = vi.fn();
      subscribeExpenses("denied-user", callback);
      expect(callback).toHaveBeenCalledWith([]);
    });

    it("should handle generic error in subscribeExpenses", () => {
      vi.mocked(firestore.onSnapshot).mockImplementationOnce((query: unknown, onNext: unknown, onError?: unknown) => {
        if (typeof onError === "function") {
          onError(new Error("Query error"));
        }
        return vi.fn();
      });

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
      expect(firestore.updateDoc).toHaveBeenCalledWith("doc-ref-investments-inv-123", { amount: 600 });
    });

    it("should delete an investment", async () => {
      await deleteInvestment("inv-123");
      expect(firestore.deleteDoc).toHaveBeenCalledWith("doc-ref-investments-inv-123");
    });

    it("should return empty unsubscribe if userId is missing in subscribeInvestments", () => {
      const callback = vi.fn();
      const unsub = subscribeInvestments("", callback);
      expect(callback).toHaveBeenCalledWith([]);
      expect(typeof unsub).toBe("function");
    });

    it("should handle permission-denied in subscribeInvestments", () => {
      vi.mocked(firestore.onSnapshot).mockImplementationOnce((query: unknown, onNext: unknown, onError?: unknown) => {
        if (typeof onError === "function") {
          onError({ code: "permission-denied" });
        }
        return vi.fn();
      });

      const callback = vi.fn();
      subscribeInvestments("denied-user", callback);
      expect(callback).toHaveBeenCalledWith([]);
    });

    it("should handle generic error in subscribeInvestments", () => {
      vi.mocked(firestore.onSnapshot).mockImplementationOnce((query: unknown, onNext: unknown, onError?: unknown) => {
        if (typeof onError === "function") {
          onError(new Error("Query error"));
        }
        return vi.fn();
      });

      const callback = vi.fn();
      subscribeInvestments("err-user", callback);
      expect(callback).toHaveBeenCalledWith([]);
    });
  });
});

