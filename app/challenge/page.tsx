"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import {
  Expense,
  subscribeExpenses,
  addExpense,
  deleteExpense,
} from "@/lib/firebase/firestore";
import { formatCurrency } from "@/lib/budget-engine";
import { FloatingDock } from "@/components/ui/FloatingDock";
import { Plus, Trash2, Calendar, Award, Sparkles } from "lucide-react";
import dynamic from "next/dynamic";

const ExpenseForm = dynamic(
  () => import("@/components/expenses/ExpenseForm").then((mod) => mod.ExpenseForm),
  { ssr: false }
);

export default function ChallengePage() {
  const [user, setUser] = useState<User | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) setLoading(false);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubExp = subscribeExpenses(user.uid, (data) => {
      setExpenses(data);
      setLoading(false);
    });
    return () => unsubExp();
  }, [user]);

  // Derived state (no useEffect needed!)
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalEssential = expenses
    .filter((e) => e.category === "essencial")
    .reduce((sum, e) => sum + e.amount, 0);
  const totalImportant = expenses
    .filter((e) => e.category === "importante")
    .reduce((sum, e) => sum + e.amount, 0);
  const totalSuperfluous = expenses
    .filter((e) => e.category === "superfluo")
    .reduce((sum, e) => sum + e.amount, 0);

  const daysCompleted = new Set(expenses.map((e) => e.date)).size;

  return (
    <div className="flex flex-col min-h-screen px-4 pt-6 pb-28 bg-[#FFFCF8]">
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold font-heading text-[#2C2C2C]">Desafio 30 Dias</h1>
          <p className="text-xs text-[#2C2C2C]/60">Classifique seus gastos com consciência</p>
        </div>
        <div className="flex items-center gap-1.5 bg-[#F9D19C]/30 px-3 py-1.5 rounded-2xl text-xs font-semibold text-[#2C2C2C]">
          <Award className="w-4 h-4 text-[#2C2C2C]" />
          <span>{daysCompleted}/30 Dias</span>
        </div>
      </div>

      {/* Challenge Progress Card */}
      <div className="bg-[#F9D19C] rounded-3xl p-5 shadow-sm space-y-4 mb-6 relative overflow-hidden">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-xs font-medium text-[#2C2C2C]/70">Total Registrado</span>
            <div className="text-3xl font-bold font-heading text-[#2C2C2C]">
              {formatCurrency(totalSpent)}
            </div>
          </div>
          <div className="p-2 bg-white/40 rounded-2xl">
            <Sparkles className="w-5 h-5 text-[#2C2C2C]" />
          </div>
        </div>

        {/* Categories Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px] font-medium text-[#2C2C2C]/80">
            <span>Distribuição de Intenção</span>
            <span>{expenses.length} registros</span>
          </div>
          <div className="h-3 w-full bg-white/40 rounded-full overflow-hidden flex gap-0.5 p-0.5">
            {totalSpent > 0 ? (
              <>
                <div
                  style={{ width: `${(totalEssential / totalSpent) * 100}%` }}
                  className="bg-[#59C7DF] h-full rounded-l-full transition-all"
                  title="Essencial"
                />
                <div
                  style={{ width: `${(totalImportant / totalSpent) * 100}%` }}
                  className="bg-[#10B981] h-full transition-all"
                  title="Importante"
                />
                <div
                  style={{ width: `${(totalSuperfluous / totalSpent) * 100}%` }}
                  className="bg-[#FDB557] h-full rounded-r-full transition-all"
                  title="Supérfluo"
                />
              </>
            ) : (
              <div className="w-full h-full bg-white/20 rounded-full" />
            )}
          </div>
        </div>

        {/* Categories Breakdown Chips */}
        <div className="grid grid-cols-3 gap-2 pt-1 text-center">
          <div className="bg-white/50 p-2 rounded-2xl">
            <div className="text-[10px] text-[#2C2C2C]/60 font-medium">Essencial</div>
            <div className="text-xs font-bold text-[#2C2C2C]">{formatCurrency(totalEssential)}</div>
          </div>
          <div className="bg-white/50 p-2 rounded-2xl">
            <div className="text-[10px] text-[#2C2C2C]/60 font-medium">Importante</div>
            <div className="text-xs font-bold text-[#2C2C2C]">{formatCurrency(totalImportant)}</div>
          </div>
          <div className="bg-white/50 p-2 rounded-2xl">
            <div className="text-[10px] text-[#2C2C2C]/60 font-medium">Supérfluo</div>
            <div className="text-xs font-bold text-[#2C2C2C]">{formatCurrency(totalSuperfluous)}</div>
          </div>
        </div>
      </div>

      {/* Expenses List */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-[#2C2C2C] flex items-center justify-between">
          <span>Histórico de Lançamentos</span>
          <span className="text-xs text-[#2C2C2C]/50 font-normal">Recentes</span>
        </h2>

        {loading ? (
          <div className="py-8 text-center text-xs text-[#2C2C2C]/40">Carregando seus lançamentos...</div>
        ) : expenses.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl text-center space-y-2 border border-gray-100 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-[#F9D19C]/30 text-[#2C2C2C] flex items-center justify-center mx-auto">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-[#2C2C2C]">Nenhum gasto registrado ainda</h3>
            <p className="text-xs text-[#2C2C2C]/60 max-w-xs mx-auto">
              Clique no botão + abaixo para cadastrar seu primeiro gasto no desafio!
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {expenses.map((item) => {
              const categoryBadge =
                item.category === "essencial"
                  ? { label: "Essencial", bg: "bg-[#59C7DF]/15 text-[#0284C7]" }
                  : item.category === "importante"
                  ? { label: "Importante", bg: "bg-[#10B981]/15 text-[#059669]" }
                  : { label: "Supérfluo", bg: "bg-[#FDB557]/20 text-[#D97706]" };

              return (
                <div
                  key={item.id}
                  className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex justify-between items-center gap-3 transition-transform active:scale-[0.99]"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[#2C2C2C]">
                        {item.description}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${categoryBadge.bg}`}
                      >
                        {categoryBadge.label}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#2C2C2C]/50">{item.date}</div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-[#9B3030]">
                      -{formatCurrency(item.amount)}
                    </span>
                    {item.id && (
                      <button
                        onClick={() => deleteExpense(item.id!)}
                        className="text-[#2C2C2C]/30 hover:text-red-500 p-1"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Action Button (FAB) for Quick Expense Addition */}
      <button
        onClick={() => setIsFormOpen(true)}
        className="fixed bottom-24 right-6 z-30 w-14 h-14 bg-[#2C2C2C] text-white rounded-full shadow-xl flex items-center justify-center hover:bg-[#1a1a1a] active:scale-95 transition-all"
        title="Adicionar Novo Gasto"
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* Bottom Sheet Expense Form Modal */}
      {isFormOpen && (
        <ExpenseForm
          userId={user?.uid || "guest"}
          onSave={async (newExp) => {
            if (user) await addExpense(newExp);
          }}
          onClose={() => setIsFormOpen(false)}
        />
      )}

      {/* Floating Navigation Dock */}
      <FloatingDock />
    </div>
  );
}
