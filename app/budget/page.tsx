"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import {
  UserProfile,
  subscribeUserProfile,
  setUserProfile,
  addInvestment,
  subscribeInvestments,
  Investment,
  BudgetCategoryConfig,
} from "@/lib/firebase/firestore";
import {
  formatCurrency,
  calculateBudgetAllocation,
  calculateInvestmentStats,
} from "@/lib/budget-engine";
import { FloatingDock } from "@/components/ui/FloatingDock";
import { InvestmentForm } from "@/components/investments/InvestmentForm";
import { BudgetCategoryModal } from "@/components/budget/BudgetCategoryModal";
import {
  Sparkles,
  Plus,
  RotateCcw,
  CheckCircle2,
  SlidersHorizontal,
} from "lucide-react";

export default function BudgetPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [isAddingExtra, setIsAddingExtra] = useState(false);
  const [extraValue, setExtraValue] = useState("");
  const [isPayFirstOpen, setIsPayFirstOpen] = useState(false);
  const [isCustomizingModalOpen, setIsCustomizingModalOpen] = useState(false);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubProfile = subscribeUserProfile(user.uid, (p) => setProfile(p));
    const unsubInvestments = subscribeInvestments(user.uid, (data) =>
      setInvestments(data),
    );
    return () => {
      unsubProfile();
      unsubInvestments();
    };
  }, [user]);

  const baseIncome = profile?.baseIncome || 3500;
  const extraIncome = profile?.extraIncome || 0;
  const allocation = calculateBudgetAllocation(
    baseIncome,
    extraIncome,
    profile?.budgetCategories,
  );
  const stats = calculateInvestmentStats(allocation.totalIncome, investments);
  const isMetaReached = stats.isTargetReached && stats.targetInvested > 0;

  const userName =
    profile?.displayName ||
    user?.displayName ||
    (user?.email ? user.email.split("@")[0] : "Você");

  async function handleAddExtra() {
    const val = parseFloat(extraValue);
    if (!isNaN(val) && val > 0 && user) {
      const newExtra = extraIncome + val;
      await setUserProfile({ uid: user.uid, extraIncome: newExtra });
      setExtraValue("");
      setIsAddingExtra(false);
    }
  }

  async function handleResetExtra() {
    if (user) {
      await setUserProfile({ uid: user.uid, extraIncome: 0 });
    }
  }

  async function handleSaveInvestment(
    data: Omit<Investment, "id" | "createdAt">,
  ) {
    await addInvestment(data);
  }

  async function handleSaveCategories(categories: BudgetCategoryConfig[]) {
    if (user) {
      await setUserProfile({ uid: user.uid, budgetCategories: categories });
    }
  }

  return (
    <div className="flex flex-col min-h-screen px-4 pt-6 pb-28 bg-[#FFFCF8]">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold font-heading text-[#2C2C2C]">
            Orçamento & Metas
          </h1>
          <p className="text-xs text-[#2C2C2C]/60">
            Metodologia Pay Yourself First
          </p>
        </div>
        <div className="flex items-center gap-2">
          {extraIncome > 0 && (
            <button
              onClick={handleResetExtra}
              className="flex items-center gap-1 bg-red-50 text-red-600 px-2.5 py-1.5 rounded-2xl text-[11px] font-semibold border border-red-100 hover:bg-red-100 transition-colors"
              title="Zerar Renda Extra acumulada"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>+{formatCurrency(extraIncome)}</span>
            </button>
          )}
          <button
            onClick={() => setIsCustomizingModalOpen(true)}
            className="flex items-center gap-1 bg-gray-100 text-[#2C2C2C] px-2.5 py-1.5 rounded-2xl text-xs font-semibold hover:bg-gray-200 transition-colors"
            title="Personalizar Categorias e Porcentagens"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Personalizar</span>
          </button>
          <button
            onClick={() => setIsAddingExtra(true)}
            className="flex items-center gap-1.5 bg-[#F9D19C] text-[#2C2C2C] px-3 py-1.5 rounded-2xl text-xs font-semibold shadow-xs hover:bg-[#f6c382]"
          >
            <Plus className="w-4 h-4" />
            <span>Extra</span>
          </button>
        </div>
      </div>

      {/* Primary Highlight Card: "Para o Lucas do Futuro" (Pay Yourself First) */}
      <div className="bg-gradient-to-br from-[#0F766E] via-[#0D9488] to-[#047857] text-white rounded-3xl p-6 shadow-md space-y-4 mb-6 relative overflow-hidden">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 bg-white/20 rounded-full inline-block">
              🎯 Boleto Obrigatório Nº 1
            </span>
            <h2 className="text-xl font-bold font-heading pt-1">
              Para{" "}
              {userName.toLowerCase() === "você" ? "o Seu" : `o ${userName}`}{" "}
              Futuro
            </h2>
            <p className="text-xs opacity-80">
              {isMetaReached
                ? "🎉 Parabéns! Sua meta de investimento deste mês foi alcançada!"
                : "15% do seu orçamento é seu investimento de liberdade financeira"}
            </p>
          </div>
          <div className="p-3 bg-white/10 rounded-2xl">
            {isMetaReached ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-300" />
            ) : (
              <Sparkles className="w-6 h-6 text-amber-300" />
            )}
          </div>
        </div>

        <div className="pt-2 border-t border-white/20 flex justify-between items-end">
          <div>
            <div className="text-[11px] opacity-70">Valor a Investir Hoje</div>
            <div className="text-3xl font-extrabold font-heading">
              {formatCurrency(allocation.investments)}
            </div>
          </div>
          <button
            disabled={isMetaReached}
            onClick={() => setIsPayFirstOpen(true)}
            className={`py-2 px-4 text-xs font-bold rounded-xl shadow-xs transition-all ${
              isMetaReached
                ? "bg-white/20 text-white/90 border border-white/30 cursor-not-allowed"
                : "bg-white text-[#0F766E] hover:bg-gray-50 active:scale-95"
            }`}
          >
            {isMetaReached ? "Meta Alcançada! 🎉" : "Pagar Primeiro"}
          </button>
        </div>
      </div>

      {/* Pay Yourself First Investment Form Modal */}
      {isPayFirstOpen && user && (
        <InvestmentForm
          userId={user.uid}
          initialData={{
            userId: user.uid,
            amount: allocation.investments,
            category: "renda_fixa",
            description: "Aporte Mensal (Pay Yourself First)",
            date: new Date().toISOString().split("T")[0],
          }}
          onSave={handleSaveInvestment}
          onClose={() => setIsPayFirstOpen(false)}
        />
      )}

      {/* Budget Customization Modal */}
      {isCustomizingModalOpen && user && (
        <BudgetCategoryModal
          initialCategories={profile?.budgetCategories}
          onSave={handleSaveCategories}
          onClose={() => setIsCustomizingModalOpen(false)}
        />
      )}

      {/* Extra Income Modal */}
      {isAddingExtra && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xs w-full space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-[#2C2C2C]">
              Adicionar Renda Extra
            </h3>
            <p className="text-xs text-[#2C2C2C]/60">
              Entrou algum freela ou extra? Digite o valor para recalcular o
              orçamento:
            </p>
            <input
              type="number"
              value={extraValue}
              onChange={(e) => setExtraValue(e.target.value)}
              placeholder="Ex: 500"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-[#2C2C2C]"
            />
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsAddingExtra(false)}
                className="flex-1 py-2.5 text-xs font-semibold text-gray-500 bg-gray-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddExtra}
                className="flex-1 py-2.5 text-xs font-semibold text-[#2C2C2C] bg-[#F9D19C] rounded-xl"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Budget Allocation Cards Grid */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-bold text-[#2C2C2C]">
            Distribuição do Orçamento
          </h2>
          <button
            onClick={() => setIsCustomizingModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0F766E]/10 hover:bg-[#0F766E]/20 text-[#0F766E] rounded-2xl text-xs font-bold transition-all active:scale-95 border border-[#0F766E]/20 shadow-2xs"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Editar Distribuição</span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {allocation.categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-2"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-sm"
                    style={{
                      backgroundColor: `${cat.color || "#0F766E"}1A`,
                      color: cat.color || "#0F766E",
                    }}
                  >
                    {cat.icon || "💰"}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#2C2C2C]">
                      {cat.name} ({cat.percentage}%)
                    </div>
                  </div>
                </div>
                <div className="text-sm font-bold text-[#2C2C2C]">
                  {formatCurrency(cat.amount)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <FloatingDock />
    </div>
  );
}
