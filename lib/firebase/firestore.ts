import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "./config";

export type InvestmentCategory =
  | "renda_fixa"
  | "acoes_fiis"
  | "reserva_emergencia"
  | "cripto"
  | "outros";

export interface Investment {
  id?: string;
  userId: string;
  amount: number;
  category: InvestmentCategory;
  description: string;
  date: string; // ISO format string YYYY-MM-DD
  createdAt?: Timestamp;
}

export interface Expense {
  id?: string;
  userId: string;
  amount: number;
  category: "essencial" | "importante" | "superfluo";
  description: string;
  date: string; // ISO format string YYYY-MM-DD
  createdAt?: Timestamp;
}

export interface BudgetCategoryConfig {
  id: string;
  name: string;
  percentage: number;
  icon?: string;
  color?: string;
  isInvestmentGoal?: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  baseIncome: number;
  extraIncome?: number;
  savingsGoalPercent?: number; // e.g. 15 for 15% Pay Yourself First
  completedGoals?: string[]; // IDs of completed checklist goals in Dashboard
  budgetCategories?: BudgetCategoryConfig[];
  startOfWeek?: string; // e.g. "Sunday" | "Monday"
  notificationsEnabled?: boolean;
  authEnabled?: boolean;
  theme?: string; // "System" | "Light" | "Dark"
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

/**
 * Initializes a user document in Firestore if it doesn't already exist,
 * ensuring existing custom data (like modified baseIncome or preferences) is preserved.
 */
export async function ensureUserProfile(
  user: { uid: string; email?: string | null; displayName?: string | null },
  initialBaseIncome?: number
): Promise<UserProfile | null> {
  try {
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      const defaultProfile: Record<string, unknown> = {
        uid: user.uid,
        email: user.email || "",
        displayName: user.displayName || "",
        baseIncome: initialBaseIncome ?? 3500,
        extraIncome: 0,
        savingsGoalPercent: 15,
        completedGoals: ["goal-1"],
        startOfWeek: "Sunday",
        notificationsEnabled: false,
        authEnabled: true,
        theme: "System",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      await setDoc(ref, defaultProfile);
      return defaultProfile as unknown as UserProfile;
    } else {
      // Merge only non-destructive updates (like updated display name or email if changed)
      const existing = snap.data() as UserProfile;
      const updates: Record<string, unknown> = { updatedAt: Timestamp.now() };
      if (user.email && user.email !== existing.email) updates.email = user.email;
      if (user.displayName && user.displayName !== existing.displayName) updates.displayName = user.displayName;

      if (Object.keys(updates).length > 1) {
        await setDoc(ref, updates, { merge: true });
      }
      return { ...existing, ...updates };
    }
  } catch (err) {
    console.error("Error in ensureUserProfile:", err);
    return null;
  }
}

/**
 * Updates specific fields of a user profile in Firestore.
 */
export async function setUserProfile(profile: Partial<UserProfile> & { uid: string }) {
  try {
    const ref = doc(db, "users", profile.uid);
    const cleanData: Record<string, unknown> = {
      updatedAt: Timestamp.now(),
    };

    if (profile.email !== undefined) cleanData.email = profile.email;
    if (profile.displayName !== undefined) cleanData.displayName = profile.displayName;
    if (profile.baseIncome !== undefined) cleanData.baseIncome = profile.baseIncome;
    if (profile.extraIncome !== undefined) cleanData.extraIncome = profile.extraIncome;
    if (profile.savingsGoalPercent !== undefined) cleanData.savingsGoalPercent = profile.savingsGoalPercent;
    if (profile.completedGoals !== undefined) cleanData.completedGoals = profile.completedGoals;
    if (profile.budgetCategories !== undefined) cleanData.budgetCategories = profile.budgetCategories;
    if (profile.startOfWeek !== undefined) cleanData.startOfWeek = profile.startOfWeek;
    if (profile.notificationsEnabled !== undefined) cleanData.notificationsEnabled = profile.notificationsEnabled;
    if (profile.authEnabled !== undefined) cleanData.authEnabled = profile.authEnabled;
    if (profile.theme !== undefined) cleanData.theme = profile.theme;

    await setDoc(ref, cleanData, { merge: true });
  } catch (err) {
    console.error("Error setting user profile in Firestore:", err);
  }
}

/**
 * Get user profile snapshot.
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data() as UserProfile) : null;
  } catch (err) {
    console.error("Error getting user profile:", err);
    return null;
  }
}

/**
 * Subscribe to user profile changes in real-time.
 */
export function subscribeUserProfile(
  uid: string,
  onData: (profile: UserProfile | null) => void
) {
  if (!uid) {
    onData(null);
    return () => {};
  }

  const ref = doc(db, "users", uid);
  return onSnapshot(
    ref,
    (snap) => {
      if (snap.exists()) {
        onData(snap.data() as UserProfile);
      } else {
        onData(null);
      }
    },
    (err) => {
      if (err.code === "permission-denied") {
        console.warn(
          "Firestore Permission Error: Permissões insuficientes para acessar 'users/" +
            uid +
            "'. Atualize as Regras de Segurança no Firebase Console ou publique o arquivo firestore.rules."
        );
      } else {
        console.error("Error in subscribeUserProfile:", err);
      }
      onData(null);
    }
  );
}

/**
 * Add a new expense record for a user.
 */
export async function addExpense(expense: Omit<Expense, "id" | "createdAt">) {
  const ref = collection(db, "expenses");
  return await addDoc(ref, {
    ...expense,
    createdAt: Timestamp.now(),
  });
}

/**
 * Update an existing expense record.
 */
export async function updateExpense(id: string, expenseData: Partial<Expense>) {
  const ref = doc(db, "expenses", id);
  await updateDoc(ref, expenseData);
}

/**
 * Delete an expense record.
 */
export async function deleteExpense(id: string) {
  const ref = doc(db, "expenses", id);
  await deleteDoc(ref);
}

/**
 * Subscribe to real-time expense records filtered by userId.
 */
export function subscribeExpenses(
  userId: string,
  onData: (expenses: Expense[]) => void
) {
  if (!userId) {
    onData([]);
    return () => {};
  }

  const q = query(
    collection(db, "expenses"),
    where("userId", "==", userId),
    orderBy("date", "desc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const list: Expense[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Expense, "id">),
      }));
      onData(list);
    },
    (err) => {
      if (err.code === "permission-denied") {
        console.warn(
          "Firestore Permission Error: Permissões insuficientes para acessar 'expenses' do usuário '" +
            userId +
            "'. Atualize as Regras de Segurança no Firebase Console ou publique o arquivo firestore.rules."
        );
      } else {
        console.error("Error in subscribeExpenses:", err);
      }
      onData([]);
    }
  );
}

/**
 * Add a new investment record for a user.
 */
export async function addInvestment(
  investment: Omit<Investment, "id" | "createdAt">
) {
  const ref = collection(db, "investments");
  return await addDoc(ref, {
    ...investment,
    createdAt: Timestamp.now(),
  });
}

/**
 * Update an existing investment record.
 */
export async function updateInvestment(
  id: string,
  investmentData: Partial<Investment>
) {
  const ref = doc(db, "investments", id);
  await updateDoc(ref, investmentData);
}

/**
 * Delete an investment record.
 */
export async function deleteInvestment(id: string) {
  const ref = doc(db, "investments", id);
  await deleteDoc(ref);
}

/**
 * Subscribe to real-time investment records filtered by userId.
 */
export function subscribeInvestments(
  userId: string,
  onData: (investments: Investment[]) => void
) {
  if (!userId) {
    onData([]);
    return () => {};
  }

  const q = query(
    collection(db, "investments"),
    where("userId", "==", userId),
    orderBy("date", "desc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const list: Investment[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Investment, "id">),
      }));
      onData(list);
    },
    (err) => {
      if (err.code === "permission-denied") {
        console.warn(
          "Firestore Permission Error: Permissões insuficientes para acessar 'investments' do usuário '" +
            userId +
            "'. Atualize as Regras de Segurança no Firebase Console ou publique o arquivo firestore.rules."
        );
      } else {
        console.error("Error in subscribeInvestments:", err);
      }
      onData([]);
    }
  );
}

// ----------------------------------------------------
// WALLETS (PATRIMONY) OPERATIONS
// ----------------------------------------------------

import { Wallet, Contribution } from "@/lib/patrimony-engine";

export async function addWallet(wallet: Omit<Wallet, "id">) {
  const data: Record<string, unknown> = {
    userId: wallet.userId,
    name: wallet.name,
    createdAt: Timestamp.now(),
  };
  if (wallet.color !== undefined) data.color = wallet.color;
  return await addDoc(collection(db, "wallets"), data);
}

export function subscribeWallets(
  userId: string,
  onData: (wallets: Wallet[]) => void
) {
  if (!userId) {
    onData([]);
    return () => {};
  }
  const q = query(
    collection(db, "wallets"),
    where("userId", "==", userId)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const list: Wallet[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Wallet, "id">),
      }));
      onData(list);
    },
    (err) => {
      if (err.code === "permission-denied") {
        console.warn(
          "Firestore Permission Error: Permissões insuficientes para acessar 'wallets'. Atualize as Regras de Segurança no Firebase Console ou execute firebase deploy --only firestore:rules."
        );
      } else {
        console.error("Error in subscribeWallets:", err);
      }
      onData([]);
    }
  );
}

export async function deleteWallet(walletId: string) {
  return await deleteDoc(doc(db, "wallets", walletId));
}

// ----------------------------------------------------
// CONTRIBUTIONS (APORTES) OPERATIONS
// ----------------------------------------------------

export async function addContribution(contribution: Omit<Contribution, "id">) {
  const data: Record<string, unknown> = {
    userId: contribution.userId,
    walletId: contribution.walletId,
    amount: contribution.amount,
    date: contribution.date,
    createdAt: Timestamp.now(),
  };
  if (contribution.note) {
    data.note = contribution.note;
  }
  return await addDoc(collection(db, "contributions"), data);
}

export function subscribeContributions(
  userId: string,
  onData: (contributions: Contribution[]) => void
) {
  if (!userId) {
    onData([]);
    return () => {};
  }
  const q = query(
    collection(db, "contributions"),
    where("userId", "==", userId)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const list: Contribution[] = snapshot.docs
        .map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<Contribution, "id">),
        }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      onData(list);
    },
    (err) => {
      if (err.code === "permission-denied") {
        console.warn(
          "Firestore Permission Error: Permissões insuficientes para acessar 'contributions'. Atualize as Regras de Segurança no Firebase Console ou execute firebase deploy --only firestore:rules."
        );
      } else {
        console.error("Error in subscribeContributions:", err);
      }
      onData([]);
    }
  );
}

export async function deleteContribution(contributionId: string) {
  return await deleteDoc(doc(db, "contributions", contributionId));
}

