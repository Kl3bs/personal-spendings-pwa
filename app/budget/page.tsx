"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import {
  UserProfile,
  subscribeUserProfile,
  setUserProfile,
} from "@/lib/firebase/firestore";
import {
  formatCurrency,
  calculateCustomBudgetAllocation,
  DEFAULT_BUDGET_CATEGORIES,
  BudgetCategory,
} from "@/lib/budget-engine";
import { FloatingDock } from "@/components/ui/FloatingDock";
import { Sparkles, ShieldCheck, HeartHandshake, GraduationCap, Plus, RotateCcw, FolderPlus } from "lucide-react";

export default function BudgetPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAddingExtra, setIsAddingExtra] = useState(false);
  const [extraValue, setExtraValue] = useState("");

  // Custom categories state
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categoryPercentage, setCategoryPercentage] = useState("");

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubProfile = subscribeUserProfile(user.uid, (p) => setProfile(p));
    return () => {
      unsubProfile();
    };
  }, [user]);

  const baseIncome = profile?.baseIncome || 3500;
  const extraIncome = profile?.extraIncome || 0;
  const totalIncome = baseIncome + extraIncome;
  const categories = profile?.customCategories && profile.customCategories.length > 0
    ? profile.customCategories
    : DEFAULT_BUDGET_CATEGORIES;

  const categoryAllocations = calculateCustomBudgetAllocation(totalIncome, categories);

  // Investment amount (either from category or 15% default)
  const investmentCategory = categoryAllocations.find(
    (c) => c.category.id === "investments" || c.category.name.toLowerCase().includes("investimento")
  );
  const investmentAmount = investmentCategory ? investmentCategory.amount : totalIncome * 0.15;

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

  async function handleAddCategory() {
    const pct = parseFloat(categoryPercentage);
    if (categoryName.trim() && !isNaN(pct) && pct > 0 && user) {
      const newCat: BudgetCategory = {
        id: `custom_${Date.now()}`,
        name: categoryName.trim(),
        percentage: pct,
        description: "Categoria personalizada",
      };
      const updatedCategories = [...categories, newCat];
      await setUserProfile({ uid: user.uid, customCategories: updatedCategories });
      setCategoryName("");
      setCategoryPercentage("");
      setIsAddingCategory(false);
    }
  }

  const renderIcon = (cat: BudgetCategory) => {
    if (cat.icon === "🏠") return "🏠";
    if (cat.icon === "ShieldCheck") return <ShieldCheck className="w-4 h-4" />;
    if (cat.icon === "HeartHandshake") return <HeartHandshake className="w-4 h-4" />;
    if (cat.icon === "GraduationCap") return <GraduationCap className="w-4 h-4" />;
    if (cat.icon === "Sparkles") return <Sparkles className="w-4 h-4 text-purple-600" />;
    return <FolderPlus className="w-4 h-4 text-[#0284C7]" />;
  };

  return (
    <div className="flex flex-col min-h-screen px-4 pt-6 pb-28 bg-[#FFFCF8]">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold font-heading text-[#2C2C2C]">Orçamento & Metas</h1>
          <p className="text-xs text-[#2C2C2C]/60">Metodologia Personalizada</p>
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
            onClick={() => setIsAddingExtra(true)}
            className="flex items-center gap-1.5 bg-[#F9D19C] text-[#2C2C2C] px-3 py-1.5 rounded-2xl text-xs font-semibold shadow-xs hover:bg-[#f6c382]"
          >
            <Plus className="w-4 h-4" />
            <span>+ Renda Extra</span>
          </button>
        </div>
      </div>

      {/* Primary Highlight Card: "Para o Futuro" (Pay Yourself First) */}
      <div className="bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] text-white rounded-3xl p-6 shadow-md space-y-4 mb-6 relative overflow-hidden">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 bg-white/20 rounded-full inline-block">
              🎯 Boleto Obrigatório Nº 1
            </span>
            <h2 className="text-xl font-bold font-heading pt-1">
              Para {userName.toLowerCase() === "você" ? "o Seu" : `o ${userName}`} Futuro
            </h2>
            <p className="text-xs opacity-80">
              Seu investimento para a liberdade financeira
            </p>
          </div>
          <div className="p-3 bg-white/10 rounded-2xl">
            <Sparkles className="w-6 h-6 text-amber-300" />
          </div>
        </div>

        <div className="pt-2 border-t border-white/20 flex justify-between items-end">
          <div>
            <div className="text-[11px] opacity-70">Valor a Investir Hoje</div>
            <div className="text-3xl font-extrabold font-heading">
              {formatCurrency(investmentAmount)}
            </div>
          </div>
          <button className="py-2 px-4 bg-white text-[#7C3AED] text-xs font-bold rounded-xl shadow-xs hover:bg-gray-50 active:scale-95 transition-all">
            Pagar Primeiro
          </button>
        </div>
      </div>

      {/* Extra Income Modal */}
      {isAddingExtra && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xs w-full space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-[#2C2C2C]">Adicionar Renda Extra</h3>
            <p className="text-xs text-[#2C2C2C]/60">
              Entrou algum freela ou extra? Digite o valor para recalcular o orçamento:
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

      {/* Add Custom Category Modal */}
      {isAddingCategory && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xs w-full space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-[#2C2C2C]">Nova Categoria</h3>
            <p className="text-xs text-[#2C2C2C]/60">
              Digite o nome e a porcentagem do orçamento para esta categoria:
            </p>
            <input
              type="text"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="Ex: Assinaturas & Streaming"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-[#2C2C2C]"
            />
            <input
              type="number"
              value={categoryPercentage}
              onChange={(e) => setCategoryPercentage(e.target.value)}
              placeholder="Ex: 5 (% do orçamento)"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-[#2C2C2C]"
            />
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsAddingCategory(false)}
                className="flex-1 py-2.5 text-xs font-semibold text-gray-500 bg-gray-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddCategory}
                className="flex-1 py-2.5 text-xs font-semibold text-[#2C2C2C] bg-[#F9D19C] rounded-xl"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Budget Allocation Cards Grid */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-bold text-[#2C2C2C]">Distribuição do Orçamento</h2>
          <button
            onClick={() => setIsAddingCategory(true)}
            className="flex items-center gap-1 text-xs font-semibold text-[#7C3AED] hover:underline"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar Categoria</span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {categoryAllocations.map(({ category, amount }) => (
            <div
              key={category.id}
              className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-2"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#59C7DF]/15 text-[#0284C7] flex items-center justify-center">
                    {renderIcon(category)}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#2C2C2C]">
                      {category.name} ({category.percentage}%)
                    </div>
                    {category.description && (
                      <div className="text-[10px] text-[#2C2C2C]/50">{category.description}</div>
                    )}
                  </div>
                </div>
                <div className="text-sm font-bold text-[#2C2C2C]">
                  {formatCurrency(amount)}
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
