"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import {
  Investment,
  UserProfile,
  subscribeUserProfile,
  subscribeInvestments,
  addInvestment,
  updateInvestment,
  deleteInvestment,
  InvestmentCategory,
} from "@/lib/firebase/firestore";
import {
  formatCurrency,
  calculateBudgetAllocation,
  calculateInvestmentStats,
} from "@/lib/budget-engine";
import { InvestmentForm } from "@/components/investments/InvestmentForm";
import {
  PiggyBank,
  Plus,
  TrendingUp,
  Target,
  Landmark,
  ShieldCheck,
  Coins,
  MoreHorizontal,
  Edit2,
  Trash2,
  Calendar,
  CheckCircle2,
} from "lucide-react";

const CATEGORY_MAP: Record<
  InvestmentCategory,
  { label: string; icon: typeof Landmark; badgeClass: string; colorHex: string }
> = {
  renda_fixa: {
    label: "Renda Fixa",
    icon: Landmark,
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    colorHex: "#10B981",
  },
  acoes_fiis: {
    label: "Ações & FIIs",
    icon: TrendingUp,
    badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
    colorHex: "#6366F1",
  },
  reserva_emergencia: {
    label: "Reserva de Emergência",
    icon: ShieldCheck,
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    colorHex: "#F59E0B",
  },
  cripto: {
    label: "Cripto",
    icon: Coins,
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
    colorHex: "#8B5CF6",
  },
  outros: {
    label: "Outros",
    icon: MoreHorizontal,
    badgeClass: "bg-gray-50 text-gray-700 border-gray-200",
    colorHex: "#6B7280",
  },
};

export default function InvestmentsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<
    Investment | undefined
  >(undefined);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
    const unsubInvestments = subscribeInvestments(user.uid, (data) => {
      setInvestments(data);
    });
    return () => {
      unsubProfile();
      unsubInvestments();
    };
  }, [user]);

  const baseIncome = profile?.baseIncome || 3500;
  const extraIncome = profile?.extraIncome || 0;
  const allocation = calculateBudgetAllocation(baseIncome, extraIncome);
  const stats = calculateInvestmentStats(allocation.totalIncome, investments);

  async function handleSaveInvestment(
    data: Omit<Investment, "id" | "createdAt">,
  ) {
    if (!user) return;
    if (editingInvestment?.id) {
      await updateInvestment(editingInvestment.id, data);
    } else {
      await addInvestment(data);
    }
  }

  async function handleDeleteInvestment(id: string) {
    try {
      setDeletingId(id);
      await deleteInvestment(id);
    } catch (err) {
      console.error("Erro ao excluir investimento:", err);
    } finally {
      setDeletingId(null);
    }
  }

  function openCreateForm() {
    setEditingInvestment(undefined);
    setIsFormOpen(true);
  }

  function openEditForm(inv: Investment) {
    setEditingInvestment(inv);
    setIsFormOpen(true);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[#1E293B] flex items-center gap-2.5">
            <PiggyBank className="w-7 h-7 text-indigo-600" />
            <span>Painel de Investimentos</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Gerencie seus aportes e acompanhe sua meta de 15% (*Pay Yourself
            First*).
          </p>
        </div>

        <button
          onClick={openCreateForm}
          className="py-2.5 px-4 bg-[#F9D19C] text-[#2C2C2C] font-bold text-xs rounded-xl hover:bg-[#f5c37e] shadow-xs flex items-center justify-center gap-2 transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Novo Aporte</span>
        </button>
      </div>

      {/* Overview Cards (Bento Grid) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Total Investido (Mês) */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-1.5">
          <div className="flex justify-between items-center text-indigo-600 text-[11px] font-semibold">
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Total Aportado
            </span>
          </div>
          <div className="text-xs text-gray-500">Investido no Mês</div>
          <div className="text-xl md:text-2xl font-extrabold font-heading text-indigo-600">
            {formatCurrency(stats.totalInvested)}
          </div>
        </div>

        {/* Card 2: Meta 15% PYF */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-1.5">
          <div className="flex justify-between items-center text-amber-600 text-[11px] font-semibold">
            <span className="flex items-center gap-1">
              <Target className="w-3.5 h-3.5" /> Meta (15% PYF)
            </span>
          </div>
          <div className="text-xs text-gray-500">Objetivo Mensal</div>
          <div className="text-xl md:text-2xl font-extrabold font-heading text-[#1E293B]">
            {formatCurrency(stats.targetInvested)}
          </div>
        </div>

        {/* Card 3: % Atingido */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-1.5">
          <div className="flex justify-between items-center text-emerald-600 text-[11px] font-semibold">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Progresso
            </span>
          </div>
          <div className="text-xs text-gray-500">% da Meta Alcancada</div>
          <div className="text-xl md:text-2xl font-extrabold font-heading text-emerald-600">
            {stats.targetProgressPercent}%
          </div>
        </div>

        {/* Card 4: Total Aportes Registrados */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-1.5">
          <div className="flex justify-between items-center text-blue-600 text-[11px] font-semibold">
            <span className="flex items-center gap-1">
              <PiggyBank className="w-3.5 h-3.5" /> Qtd. Aportes
            </span>
          </div>
          <div className="text-xs text-gray-500">Lançamentos Totais</div>
          <div className="text-xl md:text-2xl font-extrabold font-heading text-[#1E293B]">
            {investments.length}
          </div>
        </div>
      </div>

      {/* Pay Yourself First Progress Banner */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-5 rounded-3xl shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[11px] uppercase tracking-wider font-bold text-indigo-300">
              Método Pay Yourself First (15%)
            </span>
            <h3 className="text-lg font-bold font-heading mt-0.5">
              {stats.isTargetReached
                ? "🎉 Parabéns! Meta de investimentos atingida!"
                : `Faltam ${formatCurrency(Math.max(0, stats.targetInvested - stats.totalInvested))} para atingir a meta`}
            </h3>
          </div>
          <div className="text-right shrink-0">
            <span className="text-2xl font-extrabold font-heading text-[#F9D19C]">
              {stats.targetProgressPercent}%
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden p-0.5">
          <div
            className="bg-[#F9D19C] h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, stats.targetProgressPercent)}%` }}
          />
        </div>
      </div>

      {/* Category Breakdown Bar Chart */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-4">
        <h2 className="text-sm font-bold font-heading text-[#1E293B]">
          Distribuição por Categoria de Ativo
        </h2>

        {stats.totalInvested > 0 ? (
          <div className="space-y-4">
            {/* Visual Bar */}
            <div className="w-full h-4 rounded-full overflow-hidden flex bg-gray-100">
              {(Object.keys(CATEGORY_MAP) as InvestmentCategory[]).map(
                (catKey) => {
                  const catData = stats.byCategory[catKey];
                  if (!catData || catData.percentage <= 0) return null;
                  const config = CATEGORY_MAP[catKey];

                  return (
                    <div
                      key={catKey}
                      style={{
                        width: `${catData.percentage}%`,
                        backgroundColor: config.colorHex,
                      }}
                      title={`${config.label}: ${formatCurrency(catData.amount)} (${catData.percentage}%)`}
                      className="h-full first:rounded-l-full last:rounded-r-full transition-all"
                    />
                  );
                },
              )}
            </div>

            {/* Legend List */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-2">
              {(Object.keys(CATEGORY_MAP) as InvestmentCategory[]).map(
                (catKey) => {
                  const catData = stats.byCategory[catKey];
                  const config = CATEGORY_MAP[catKey];

                  return (
                    <div
                      key={catKey}
                      className="p-3 bg-gray-50 rounded-2xl border border-gray-100 space-y-1"
                    >
                      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: config.colorHex }}
                        />
                        <span className="truncate">{config.label}</span>
                      </div>
                      <div className="text-xs font-extrabold text-[#1E293B]">
                        {formatCurrency(catData?.amount || 0)}
                      </div>
                      <div className="text-[10px] text-gray-400 font-semibold">
                        {catData?.percentage || 0}% do total
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-gray-400">
            Nenhum aporte registrado neste mês para calcular a distribuição.
          </div>
        )}
      </div>

      {/* Investment History List / Table */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold font-heading text-[#1E293B]">
            Histórico de Aportes
          </h2>
          <span className="text-xs text-gray-400 font-medium">
            {investments.length} registro(s)
          </span>
        </div>

        {investments.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {investments.map((inv) => {
              const config = CATEGORY_MAP[inv.category] || CATEGORY_MAP.outros;
              const Icon = config.icon;
              const isDeleting = deletingId === inv.id;

              return (
                <div
                  key={inv.id}
                  className="py-3.5 flex items-center justify-between gap-4 hover:bg-gray-50/60 px-2 rounded-2xl transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`p-2.5 rounded-2xl border ${config.badgeClass}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#1E293B] truncate">
                        {inv.description}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                        <span className="font-semibold">{config.label}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {inv.date}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="text-xs font-extrabold font-heading text-emerald-600">
                        + {formatCurrency(inv.amount)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditForm(inv)}
                        title="Editar"
                        className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => inv.id && handleDeleteInvestment(inv.id)}
                        disabled={isDeleting}
                        title="Excluir"
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-40"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 space-y-3">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center mx-auto">
              <PiggyBank className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-700">
                Nenhum investimento cadastrado ainda
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Clique no botão abaixo para adicionar seu primeiro aporte do
                mês.
              </p>
            </div>
            <button
              onClick={openCreateForm}
              className="py-2 px-4 bg-[#F9D19C] text-[#2C2C2C] font-bold text-xs rounded-xl hover:bg-[#f5c37e] transition-all inline-flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Primeiro Aporte</span>
            </button>
          </div>
        )}
      </div>

      {/* Investment Form Modal */}
      {isFormOpen && user && (
        <InvestmentForm
          userId={user.uid}
          initialData={editingInvestment}
          onSave={handleSaveInvestment}
          onClose={() => setIsFormOpen(false)}
        />
      )}
    </div>
  );
}
