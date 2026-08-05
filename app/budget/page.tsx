"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import {
  UserProfile,
  subscribeUserProfile,
  setUserProfile,
} from "@/lib/firebase/firestore";
import { formatCurrency, calculateBudgetAllocation } from "@/lib/budget-engine";
import { FloatingDock } from "@/components/ui/FloatingDock";
import { Sparkles, ShieldCheck, HeartHandshake, GraduationCap, Plus, RotateCcw } from "lucide-react";

export default function BudgetPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAddingExtra, setIsAddingExtra] = useState(false);
  const [extraValue, setExtraValue] = useState("");

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
  const allocation = calculateBudgetAllocation(baseIncome, extraIncome);
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

  return (
    <div className="flex flex-col min-h-screen px-4 pt-6 pb-28 bg-[#FFFCF8]">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold font-heading text-[#2C2C2C]">Orçamento & Metas</h1>
          <p className="text-xs text-[#2C2C2C]/60">Metodologia Pay Yourself First</p>
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

      {/* Primary Highlight Card: "Para o Lucas do Futuro" (Pay Yourself First) */}
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
              15% do seu orçamento é seu investimento de liberdade financeira
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
              {formatCurrency(allocation.investments)}
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

      {/* Budget Allocation Cards Grid */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-[#2C2C2C]">Distribuição do Orçamento</h2>

        <div className="grid grid-cols-1 gap-3">
          {/* Necessidades Básicas */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#59C7DF]/15 text-[#0284C7] flex items-center justify-center">
                  🏠
                </div>
                <div>
                  <div className="text-xs font-bold text-[#2C2C2C]">Necessidades Básicas (55%)</div>
                  <div className="text-[10px] text-[#2C2C2C]/50">Moradia, Alimentação e Contas</div>
                </div>
              </div>
              <div className="text-sm font-bold text-[#2C2C2C]">
                {formatCurrency(allocation.necessities)}
              </div>
            </div>
          </div>

          {/* Reserva de Emergência */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#10B981]/15 text-[#059669] flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#2C2C2C]">Reserva de Emergência (10%)</div>
                  <div className="text-[10px] text-[#2C2C2C]/50">Meta: 6 meses de custo de vida</div>
                </div>
              </div>
              <div className="text-sm font-bold text-[#2C2C2C]">
                {formatCurrency(allocation.emergencyFund)}
              </div>
            </div>
          </div>

          {/* Lazer */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#FDB557]/20 text-[#D97706] flex items-center justify-center">
                  <HeartHandshake className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#2C2C2C]">Lazer & Supérfluos (10%)</div>
                  <div className="text-[10px] text-[#2C2C2C]/50">Passeios, hobbies e relaxamento</div>
                </div>
              </div>
              <div className="text-sm font-bold text-[#2C2C2C]">
                {formatCurrency(allocation.leisure)}
              </div>
            </div>
          </div>

          {/* Educação */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#2C2C2C]">Educação (10%)</div>
                  <div className="text-[10px] text-[#2C2C2C]/50">Livros, cursos e evolução pessoal</div>
                </div>
              </div>
              <div className="text-sm font-bold text-[#2C2C2C]">
                {formatCurrency(allocation.education)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <FloatingDock />
    </div>
  );
}
