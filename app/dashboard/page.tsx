"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import {
  Expense,
  Investment,
  UserProfile,
  subscribeUserProfile,
  subscribeExpenses,
  subscribeInvestments,
  setUserProfile,
} from "@/lib/firebase/firestore";
import {
  formatCurrency,
  calculateBudgetAllocation,
  calculateInvestmentStats,
  calculateNetBalance,
} from "@/lib/budget-engine";
import {
  TrendingUp,
  TrendingDown,
  Plus,
  CheckCircle2,
  Circle,
  PiggyBank,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubProfile = subscribeUserProfile(user.uid, (p) => {
      setProfile(p);
    });
    const unsubExp = subscribeExpenses(user.uid, (data) => {
      setExpenses(data);
    });
    const unsubInv = subscribeInvestments(user.uid, (data) => {
      setInvestments(data);
    });
    return () => {
      unsubProfile();
      unsubExp();
      unsubInv();
    };
  }, [user]);

  // Derived computations
  const baseIncome = profile?.baseIncome || 3500;
  const extraIncome = profile?.extraIncome || 0;
  const allocation = calculateBudgetAllocation(baseIncome, extraIncome, profile?.budgetCategories);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const investmentStats = calculateInvestmentStats(allocation.totalIncome, investments, allocation.investments);
  const currentBalance = calculateNetBalance(
    allocation.totalIncome,
    totalExpenses,
    investmentStats.totalInvested
  );
  const userName =
    profile?.displayName ||
    user?.displayName ||
    (user?.email ? user.email.split("@")[0] : "Usuário");

  const completedGoals = profile?.completedGoals || [];

  async function toggleGoal(goalId: string) {
    if (!user) return;
    const exists = completedGoals.includes(goalId);
    const updated = exists
      ? completedGoals.filter((g) => g !== goalId)
      : [...completedGoals, goalId];
    await setUserProfile({ uid: user.uid, completedGoals: updated });
  };

  return (
    <div className="space-y-6">
      {/* Overview Title Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[#1E293B]">Overview</h1>
          <p className="text-xs text-gray-500">
            Bem-vindo de volta, <span className="font-semibold text-gray-700">{userName}</span>! Confira seu resumo financeiro.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/challenge"
            className="py-2.5 px-4 bg-[#F9D19C] text-[#2C2C2C] font-semibold text-xs rounded-xl hover:bg-[#f5c37e] shadow-xs flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Gasto (30d)</span>
          </Link>
        </div>
      </div>

      {/* Top 4 Summary Cards Grid (Figma Desktop Style) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: My Balance */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-emerald-600 text-[11px] font-semibold">
            <span className="flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" /> +20%
            </span>
          </div>
          <div className="text-xs text-gray-500">Saldo Atual</div>
          <div className="text-xl md:text-2xl font-extrabold font-heading text-[#1E293B]">
            {formatCurrency(currentBalance)}
          </div>
        </div>

        {/* Card 2: Total Income */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-emerald-600 text-[11px] font-semibold">
            <span className="flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" /> +19%
            </span>
          </div>
          <div className="text-xs text-gray-500">Renda Total</div>
          <div className="text-xl md:text-2xl font-extrabold font-heading text-[#1E293B]">
            {formatCurrency(allocation.totalIncome)}
          </div>
        </div>

        {/* Card 3: Total Savings (15% PYF) */}
        <Link
          href="/investments"
          className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-2 hover:border-[#F9D19C] hover:shadow-sm transition-all group block"
        >
          <div className="flex justify-between items-center text-indigo-600 text-[11px] font-semibold">
            <span className="flex items-center gap-0.5">
              <PiggyBank className="w-3.5 h-3.5" /> 15% PYF
            </span>
            <span className="text-[10px] text-gray-400 group-hover:text-indigo-600 font-normal">
              Ver mais →
            </span>
          </div>
          <div className="text-xs text-gray-500">Investimento Realizado</div>
          <div className="text-xl md:text-2xl font-extrabold font-heading text-indigo-600">
            {formatCurrency(investmentStats.totalInvested)}
          </div>
          <div className="text-[10px] text-gray-400 font-medium">
            Meta: {formatCurrency(allocation.investments)}
          </div>
        </Link>

        {/* Card 4: Total Expenses */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-rose-500 text-[11px] font-semibold">
            <span className="flex items-center gap-0.5">
              <TrendingDown className="w-3.5 h-3.5" /> Gastos
            </span>
          </div>
          <div className="text-xs text-gray-500">Despesas do Mês</div>
          <div className="text-xl md:text-2xl font-extrabold font-heading text-rose-600">
            {formatCurrency(totalExpenses)}
          </div>
        </div>
      </div>

      {/* Main 2-Column Grid (Desktop Left + Right Panel) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Charts & Transactions) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Summary Bar Chart Card */}
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-gray-800">Balanço Mensal</h3>
                <span className="text-[10px] font-semibold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg">
                  Mensal
                </span>
              </div>
              <div className="h-40 flex items-end justify-between gap-2 pt-4 px-2">
                {[
                  { month: "Jan", inc: 80, exp: 40 },
                  { month: "Fev", inc: 65, exp: 50 },
                  { month: "Mar", inc: 90, exp: 35 },
                  { month: "Abr", inc: 70, exp: 60 },
                  { month: "Mai", inc: 85, exp: 45 },
                  { month: "Jun", inc: 100, exp: 30 },
                ].map((item, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <div className="w-full flex items-end justify-center gap-1 h-full">
                      <div
                        className="w-2 bg-[#F9D19C] rounded-t-sm transition-all"
                        style={{ height: `${item.inc}%` }}
                      ></div>
                      <div
                        className="w-2 bg-[#2C2C2C] rounded-t-sm transition-all"
                        style={{ height: `${item.exp}%` }}
                      ></div>
                    </div>
                    <span className="text-[10px] font-semibold text-gray-400">{item.month}</span>
                  </div>
                ))}
              </div>
            </div>

          {/* Cash Flow Donut Card */}
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-gray-800">Distribuição do Orçamento</h3>
              <Link
                href="/budget"
                className="text-[10px] font-semibold text-[#0F766E] bg-[#0F766E]/10 hover:bg-[#0F766E]/20 px-2.5 py-1 rounded-lg transition-colors"
              >
                Personalizar
              </Link>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-around gap-4 py-2">
              {/* Dynamic SVG Donut Chart */}
              <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {(() => {
                    let cumulativePercentage = 0;
                    const circumference = 2 * Math.PI * 38; // ~238.76
                    return allocation.categories.map((cat) => {
                      const strokeDasharray = `${(cat.percentage / 100) * circumference} ${circumference}`;
                      const strokeDashoffset = -((cumulativePercentage / 100) * circumference);
                      cumulativePercentage += cat.percentage;
                      return (
                        <circle
                          key={cat.id}
                          cx="50"
                          cy="50"
                          r="38"
                          fill="transparent"
                          stroke={cat.color || "#0F766E"}
                          strokeWidth="12"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          className="transition-all duration-300"
                        />
                      );
                    });
                  })()}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Total</span>
                  <span className="text-xs font-extrabold font-heading text-[#1E293B]">
                    {formatCurrency(allocation.totalIncome)}
                  </span>
                </div>
              </div>

              {/* Dynamic Categories Legend */}
              <div className="space-y-1.5 text-xs w-full sm:w-auto">
                {allocation.categories.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between gap-3 text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm select-none">{cat.icon || "💰"}</span>
                      <span className="font-semibold text-gray-800 text-[11px]">{cat.name}</span>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <span className="text-[10px] font-bold text-gray-400">{cat.percentage}%</span>
                      <span className="text-xs font-bold text-gray-700">{formatCurrency(cat.amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Latest Transactions Table (Figma Desktop Style) */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-5 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-gray-800">Últimas Transações</h3>
              <p className="text-[11px] text-gray-400">Registros em tempo real do seu desafio</p>
            </div>
            <Link
              href="/challenge"
              className="text-xs font-semibold text-[#2C2C2C] hover:underline"
            >
              Ver Todas
            </Link>
          </div>

          {expenses.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400">
              Nenhuma transação cadastrada ainda. Clique em &quot;+ Novo Gasto&quot; para registrar.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-semibold">
                    <th className="pb-3">Data</th>
                    <th className="pb-3">Descrição</th>
                    <th className="pb-3">Categoria</th>
                    <th className="pb-3 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {expenses.slice(0, 6).map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50">
                      <td className="py-3 text-gray-500 font-medium">{item.date}</td>
                      <td className="py-3 font-semibold text-gray-800">{item.description}</td>
                      <td className="py-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            item.category === "essencial"
                              ? "bg-amber-50 text-amber-700"
                              : item.category === "importante"
                              ? "bg-blue-50 text-blue-700"
                              : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          {item.category.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 text-right font-bold text-rose-600">
                        -{formatCurrency(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Right Column Panel (Figma Goals Checklist & Pay Yourself First) */}
      <div className="space-y-6">
        {/* Pay Yourself First Card */}
        <div className="bg-gradient-to-br from-[#0F766E] via-[#0D9488] to-[#047857] text-white rounded-3xl p-6 shadow-md space-y-4 relative overflow-hidden">
          <div className="space-y-1">
            <span className="text-[10px] font-bold px-2.5 py-0.5 bg-white/20 rounded-full inline-block">
              {investmentStats.isTargetReached && investmentStats.targetInvested > 0
                ? "🎉 Meta Alcançada!"
                : "🎯 Investimento Prioritário"}
            </span>
            <h2 className="text-lg font-bold font-heading pt-1">
              Para {userName} do Futuro
            </h2>
            <p className="text-xs opacity-80">
              {investmentStats.isTargetReached && investmentStats.targetInvested > 0
                ? "🎉 Parabéns! Sua meta de investimento deste mês foi alcançada!"
                : "15% retidos automaticamente antes de qualquer gasto"}
            </p>
          </div>

          <div className="pt-3 border-t border-white/20 flex justify-between items-end">
            <div>
              <div className="text-[10px] opacity-70">Meta de Investimento</div>
              <div className="text-2xl font-extrabold font-heading">
                {formatCurrency(allocation.investments)}
              </div>
            </div>
            <Link
              href="/budget"
              className="py-2 px-3 bg-white text-[#0F766E] font-bold text-xs rounded-xl hover:bg-gray-100 transition-all shadow-xs"
            >
              Gerenciar
            </Link>
          </div>
        </div>

          {/* Goals Checklist Card (Figma desktop_1.png) */}
          <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-gray-800">Checklist de Metas</h3>
              <span className="text-[10px] font-semibold text-gray-400">
                {completedGoals.length}/3 Concluídas
              </span>
            </div>

            <div className="space-y-3">
              {/* Goal 1 */}
              <button
                onClick={() => toggleGoal("goal-1")}
                className="w-full text-left flex items-start gap-3 p-3 bg-gray-50/70 hover:bg-gray-100/60 transition-colors rounded-2xl cursor-pointer"
              >
                {completedGoals.includes("goal-1") ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-300 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className={`text-xs font-bold ${completedGoals.includes("goal-1") ? "line-through text-gray-400" : "text-gray-800"}`}>
                    Investimento Liberdade (15%)
                  </div>
                  <div className="text-[10px] text-gray-500">
                    Separar R$ {allocation.investments} no dia do pagamento
                  </div>
                </div>
              </button>

              {/* Goal 2 */}
              <button
                onClick={() => toggleGoal("goal-2")}
                className="w-full text-left flex items-start gap-3 p-3 bg-gray-50/70 hover:bg-gray-100/60 transition-colors rounded-2xl cursor-pointer"
              >
                {completedGoals.includes("goal-2") ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-300 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className={`text-xs font-bold ${completedGoals.includes("goal-2") ? "line-through text-gray-400" : "text-gray-800"}`}>
                    Desafio dos 30 Dias
                  </div>
                  <div className="text-[10px] text-gray-500">
                    Registrar gastos com tag reflexiva (Essencial / Importante / Supérfluo)
                  </div>
                </div>
              </button>

              {/* Goal 3 */}
              <button
                onClick={() => toggleGoal("goal-3")}
                className="w-full text-left flex items-start gap-3 p-3 bg-gray-50/70 hover:bg-gray-100/60 transition-colors rounded-2xl cursor-pointer"
              >
                {completedGoals.includes("goal-3") ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-300 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className={`text-xs font-bold ${completedGoals.includes("goal-3") ? "line-through text-gray-400" : "text-gray-800"}`}>
                    Teto de Gastos Essenciais (55%)
                  </div>
                  <div className="text-[10px] text-gray-500">
                    Manter essenciais em até {formatCurrency(allocation.necessities)}
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
