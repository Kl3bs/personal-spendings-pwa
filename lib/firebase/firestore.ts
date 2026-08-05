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

import { BudgetCategory } from "@/lib/budget-engine";

export interface Expense {
  id?: string;
  userId: string;
  amount: number;
  category: "essencial" | "importante" | "superfluo";
  description: string;
  date: string; // ISO format string YYYY-MM-DD
  createdAt?: Timestamp;
}

export interface UserProfile {
  uid: string;
  email?: string;
  displayName?: string;
  baseIncome: number;
  extraIncome?: number;
  customCategories?: BudgetCategory[];
  savingsGoalPercent?: number; // e.g. 15 for 15% Pay Yourself First
  completedGoals?: string[]; // IDs of completed checklist goals in Dashboard
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
