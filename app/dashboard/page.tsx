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
  addExpensesBatch,
} from "@/lib/firebase/firestore";
import {
  formatCurrency,
  calculateBudgetAllocation,
  calculateInvestmentStats,
  calculateNetBalance,
  calculateBalanceChartData,
} from "@/lib/budget-engine";
import {
  TrendingUp,
  TrendingDown,
  Plus,
  CheckCircle2,
  Circle,
  PiggyBank,
  Info,
  Zap,
  Pin,
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

const BatchExpenseModal = dynamic(
  () =>
    import("@/components/expenses/BatchExpenseModal").then(
      (mod) => mod.BatchExpenseModal,
    ),
  { ssr: false },
);

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [expenseFilter, setExpenseFilter] = useState<"all" | "monthly">("all");
  const [chartViewMode, setChartViewMode] = useState<"months" | "weeks">(
    "months",
  );
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

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
  const allocation = calculateBudgetAllocation(
    baseIncome,
    extraIncome,
    profile?.budgetCategories,
  );
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalMonthlyBills = expenses
    .filter((e) => e.isMonthlyBill)
    .reduce((sum, e) => sum + e.amount, 0);
  const displayedExpenses =
    expenseFilter === "monthly"
      ? expenses.filter((e) => e.isMonthlyBill)
      : expenses;
  const investmentStats = calculateInvestmentStats(
    allocation.totalIncome,
    investments,
    allocation.investments,
  );
  const currentBalance = calculateNetBalance(
    allocation.totalIncome,
    totalExpenses,
    investmentStats.totalInvested,
  );
  const chartData = calculateBalanceChartData(
    expenses,
    allocation.totalIncome,
    chartViewMode,
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
  }

  return (
    <div className="space-y-6">
      {/* Overview Title Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[#1E293B]">
            Overview
          </h1>
          <p className="text-xs text-gray-500">
            Bem-vindo de volta,{" "}
            <span className="font-semibold text-gray-700">{userName}</span>!
            Confira seu resumo financeiro.
          </p>
        </div>

        <div className="flex items-center gap-2">
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
          className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-2 hover:border-[#0F766E]/40 hover:shadow-sm transition-all group block"
        >
          <div className="flex justify-between items-center text-[#0F766E] text-[11px] font-semibold">
            <span className="flex items-center gap-0.5">
              <PiggyBank className="w-3.5 h-3.5" /> 15% PYF
            </span>
            <span className="text-[10px] text-gray-400 group-hover:text-[#0F766E] font-normal">
              Ver mais →
            </span>
          </div>
          <div className="text-xs text-gray-500">Investimento Realizado</div>
          <div className="text-xl md:text-2xl font-extrabold font-heading text-[#0F766E]">
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
              <TrendingDown className="w-3.5 h-3.5" /> Gastos Total
            </span>
          </div>
          <div className="text-xs text-gray-500">Despesas do Mês</div>
          <div className="text-xl md:text-2xl font-extrabold font-heading text-rose-600">
            {formatCurrency(totalExpenses)}
          </div>
          <div className="text-[10px] text-gray-500 font-medium flex items-center gap-1">
            <Pin className="w-3 h-3 text-[#0F766E]" />
            <span>Contas do Mês: {formatCurrency(totalMonthlyBills)}</span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Grid (Desktop Left + Right Panel) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Charts & Transactions) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Dynamic Summary Bar Chart Card */}
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs space-y-4 relative">
              <div className="flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-gray-800">
                      Balanço Financeiro
                    </h3>
                    <div className="relative group cursor-pointer">
                      <Info className="w-3.5 h-3.5 text-gray-400 hover:text-[#0F766E] transition-colors" />
                      <div className="absolute left-0 top-5 hidden group-hover:block z-30 w-56 p-3 bg-[#1E293B] text-white text-[10px] rounded-xl shadow-xl border border-gray-700 pointer-events-none animate-in fade-in zoom-in-95">
                        <div className="font-bold text-[#F9D19C] mb-1">
                          Como a Renda é calculada?
                        </div>
                        <p className="text-gray-300 leading-relaxed">
                          Renda = Renda Base + Renda Extra.
                          <br />• <strong>6 Meses</strong>: Renda Mensal Total.
                          <br />• <strong>Semanas</strong>: Orçamento semanal
                          (Renda / 4).
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-1 text-[9px] font-bold text-[#0F766E]">
                      <span className="w-2 h-2 rounded-full bg-[#0F766E] inline-block"></span>
                      Renda
                    </span>
                    <span className="flex items-center gap-1 text-[9px] font-bold text-[#1E293B]">
                      <span className="w-2 h-2 rounded-full bg-[#1E293B] inline-block"></span>
                      Gastos
                    </span>
                  </div>
                </div>

                {/* View Mode Toggle Buttons */}
                <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200/60">
                  <button
                    onClick={() => setChartViewMode("months")}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all ${
                      chartViewMode === "months"
                        ? "bg-white text-[#0F766E] shadow-2xs"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    6 Meses
                  </button>
                  <button
                    onClick={() => setChartViewMode("weeks")}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all ${
                      chartViewMode === "weeks"
                        ? "bg-white text-[#0F766E] shadow-2xs"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    Semanas
                  </button>
                </div>
              </div>

              {/* Bar Chart Area */}
              <div className="h-44 flex items-end justify-between gap-1.5 pt-6 px-1 relative">
                {chartData.map((item, idx) => (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoveredBarIndex(idx)}
                    onMouseLeave={() => setHoveredBarIndex(null)}
                    className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end relative group cursor-pointer"
                  >
                    {/* Hover Floating Tooltip */}
                    {hoveredBarIndex === idx && (
                      <div className="absolute -top-12 z-20 bg-[#1E293B] text-white text-[10px] py-1.5 px-2.5 rounded-xl shadow-lg whitespace-nowrap animate-in fade-in zoom-in-95 pointer-events-none">
                        <div className="font-bold text-[#F9D19C] mb-0.5">
                          {item.label}
                        </div>
                        <div className="flex gap-2">
                          <span className="text-emerald-300">
                            R: {formatCurrency(item.income)}
                          </span>
                          <span className="text-rose-300">
                            G: {formatCurrency(item.expenses)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Dual Bars */}
                    <div className="w-full flex items-end justify-center gap-1 h-full">
                      {/* Income/Budget Bar */}
                      <div
                        className="w-2.5 bg-[#0F766E] rounded-t-md transition-all group-hover:brightness-110 shadow-2xs"
                        style={{ height: `${item.incPercent}%` }}
                      ></div>
                      {/* Expense Bar */}
                      <div
                        className={`w-2.5 rounded-t-md transition-all group-hover:brightness-110 shadow-2xs ${
                          item.expenses > item.income
                            ? "bg-rose-500"
                            : "bg-[#1E293B]"
                        }`}
                        style={{ height: `${item.expPercent}%` }}
                      ></div>
                    </div>

                    <span className="text-[10px] font-bold text-gray-500 group-hover:text-[#0F766E] transition-colors">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cash Flow Donut Card */}
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-gray-800">
                  Distribuição do Orçamento
                </h3>
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
                  <svg
                    className="w-full h-full transform -rotate-90"
                    viewBox="0 0 100 100"
                  >
                    {(() => {
                      const circumference = 2 * Math.PI * 38; // ~238.76
                      return allocation.categories.map((cat, idx, arr) => {
                        const acc = arr
                          .slice(0, idx)
                          .reduce((sum, item) => sum + item.percentage, 0);
                        const strokeDasharray = `${(cat.percentage / 100) * circumference} ${circumference}`;
                        const strokeDashoffset = -((acc / 100) * circumference);
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
                    <span className="text-[10px] text-gray-400 font-bold uppercase">
                      Total
                    </span>
                    <span className="text-xs font-extrabold font-heading text-[#1E293B]">
                      {formatCurrency(allocation.totalIncome)}
                    </span>
                  </div>
                </div>

                {/* Dynamic Categories Legend */}
                <div className="space-y-1.5 text-xs w-full sm:w-auto">
                  {allocation.categories.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between gap-3 text-gray-600"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm select-none">
                          {cat.icon || "💰"}
                        </span>
                        <span className="font-semibold text-gray-800 text-[11px]">
                          {cat.name}
                        </span>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <span className="text-[10px] font-bold text-gray-400">
                          {cat.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Latest Transactions Table (Figma Desktop Style) */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-gray-800">
                  Últimas Transações
                </h3>
                <p className="text-[11px] text-gray-400">
                  Registros em tempo real do seu desafio
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-semibold">
                  <button
                    onClick={() => setExpenseFilter("all")}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      expenseFilter === "all"
                        ? "bg-white text-gray-800 shadow-xs font-bold"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Todas
                  </button>
                  <button
                    onClick={() => setExpenseFilter("monthly")}
                    className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                      expenseFilter === "monthly"
                        ? "bg-[#0F766E] text-white shadow-xs font-bold"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <Pin className="w-3 h-3 fill-current" />
                    <span>Contas do Mês</span>
                  </button>
                </div>

                <Link
                  href="/challenge"
                  className="text-xs font-semibold text-[#2C2C2C] hover:underline hidden sm:inline"
                >
                  Ver Todas
                </Link>
              </div>
            </div>

            {displayedExpenses.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400">
                {expenseFilter === "monthly"
                  ? "Nenhuma Conta do Mês cadastrada ainda."
                  : "Nenhuma transação cadastrada ainda. Clique em '+ Novo Gasto' para registrar."}
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
                    {displayedExpenses.slice(0, 6).map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50/50">
                        <td className="py-3 text-gray-500 font-medium">
                          {new Date(item.date).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="py-3 font-semibold text-gray-800 flex items-center gap-1.5">
                          <span>{item.description}</span>
                          {item.isMonthlyBill && (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0F766E]/10 text-[#0F766E] border border-[#0F766E]/20">
                              <Pin className="w-2.5 h-2.5 fill-current" />
                              Conta do Mês
                            </span>
                          )}
                        </td>
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
                {investmentStats.isTargetReached &&
                investmentStats.targetInvested > 0
                  ? "🎉 Meta Alcançada!"
                  : "🎯 Investimento Prioritário"}
              </span>
              <h2 className="text-lg font-bold font-heading pt-1">
                Para {userName} do Futuro
              </h2>
              <p className="text-xs opacity-80">
                {investmentStats.isTargetReached &&
                investmentStats.targetInvested > 0
                  ? "🎉 Parabéns! Sua meta de investimento deste mês foi alcançada!"
                  : "15% retidos automaticamente antes de qualquer gasto"}
              </p>
            </div>

            <div className="pt-3 border-t border-white/20 flex justify-between items-end">
              <div>
                <div className="text-[10px] opacity-70">
                  Meta de Investimento
                </div>
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
              <h3 className="text-sm font-bold text-gray-800">
                Checklist de Metas
              </h3>
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
                  <div
                    className={`text-xs font-bold ${completedGoals.includes("goal-1") ? "line-through text-gray-400" : "text-gray-800"}`}
                  >
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
                  <div
                    className={`text-xs font-bold ${completedGoals.includes("goal-2") ? "line-through text-gray-400" : "text-gray-800"}`}
                  >
                    Desafio dos 30 Dias
                  </div>
                  <div className="text-[10px] text-gray-500">
                    Registrar gastos com tag reflexiva (Essencial / Importante /
                    Supérfluo)
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
                  <div
                    className={`text-xs font-bold ${completedGoals.includes("goal-3") ? "line-through text-gray-400" : "text-gray-800"}`}
                  >
                    Teto de Gastos Essenciais (55%)
                  </div>
                  <div className="text-[10px] text-gray-500">
                    Manter essenciais em até{" "}
                    {formatCurrency(allocation.necessities)}
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
