"use client";

import { useState } from "react";
import { BudgetCategoryConfig } from "@/lib/firebase/firestore";
import { DEFAULT_BUDGET_CATEGORIES } from "@/lib/budget-engine";
import { X, Plus, Trash2, Check, AlertCircle } from "lucide-react";

interface BudgetCategoryModalProps {
  initialCategories?: BudgetCategoryConfig[];
  onSave: (categories: BudgetCategoryConfig[]) => Promise<void>;
  onClose: () => void;
}

export function BudgetCategoryModal({
  initialCategories,
  onSave,
  onClose,
}: BudgetCategoryModalProps) {
  const [categories, setCategories] = useState<BudgetCategoryConfig[]>(
    initialCategories && initialCategories.length > 0
      ? initialCategories
      : DEFAULT_BUDGET_CATEGORIES
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rawTotal = categories.reduce((sum, cat) => sum + (Number(cat.percentage) || 0), 0);
  const totalPercentage = Number(rawTotal.toFixed(2));
  const isValidTotal = totalPercentage === 100;

  function handleAddCategory() {
    const newCat: BudgetCategoryConfig = {
      id: `custom-${Date.now()}`,
      name: "",
      percentage: 0,
      icon: "💰",
      color: "#6B7280",
    };
    setCategories([...categories, newCat]);
  }

  function handleRemoveCategory(id: string) {
    if (categories.length <= 1) {
      setError("Você precisa ter ao menos uma categoria de orçamento.");
      return;
    }
    setError(null);
    setCategories(categories.filter((cat) => cat.id !== id));
  }

  function handleChangeName(id: string, name: string) {
    setCategories(
      categories.map((cat) => (cat.id === id ? { ...cat, name } : cat))
    );
  }

  function handleChangePercentage(id: string, valStr: string) {
    const val = parseFloat(valStr);
    const percentage = isNaN(val) ? 0 : val;
    setCategories(
      categories.map((cat) => (cat.id === id ? { ...cat, percentage } : cat))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidTotal) return;

    for (const cat of categories) {
      if (!cat.name.trim()) {
        setError("Por favor, preencha o nome de todas as categorias.");
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);
      await onSave(categories);
      onClose();
    } catch (err) {
      console.error("Erro ao salvar categorias do orçamento:", err);
      setError("Erro ao salvar alterações. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-5 relative border border-gray-100 animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h2 className="text-lg font-bold font-heading text-[#1E293B]">
              Personalizar Categorias e Orçamento
            </h2>
            <p className="text-xs text-gray-500">
              Ajuste os nomes e a porcentagem de cada categoria para sua realidade.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Real-time Percentage Counter Banner */}
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between transition-colors ${
            isValidTotal
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-amber-50 border-amber-200 text-amber-800"
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertCircle className={`w-5 h-5 ${isValidTotal ? "text-emerald-600" : "text-amber-600"}`} />
            <span className="text-xs font-semibold">
              {isValidTotal
                ? "Soma exata das porcentagens:"
                : "A soma das porcentagens deve ser exatamente 100%:"}
            </span>
          </div>
          <span className={`text-base font-extrabold font-heading ${isValidTotal ? "text-emerald-700" : "text-amber-700"}`}>
            {totalPercentage}% / 100%
          </span>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-xs font-semibold rounded-xl border border-red-100">
            {error}
          </div>
        )}

        {/* Categories List Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {categories.map((cat, idx) => (
              <div
                key={cat.id || idx}
                className="flex items-center gap-2.5 p-3 bg-gray-50 rounded-2xl border border-gray-100"
              >
                <span className="text-lg select-none">{cat.icon || "💰"}</span>
                <input
                  type="text"
                  value={cat.name}
                  onChange={(e) => handleChangeName(cat.id, e.target.value)}
                  placeholder="Nome da categoria"
                  className="flex-1 bg-white px-3 py-2 text-xs font-semibold text-[#1E293B] rounded-xl border border-gray-200 focus:outline-none focus:border-[#0F766E]"
                  required
                />
                <div className="flex items-center gap-1 w-24">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={cat.percentage}
                    onChange={(e) => handleChangePercentage(cat.id, e.target.value)}
                    className="w-full bg-white px-2.5 py-2 text-xs font-bold text-center text-[#1E293B] rounded-xl border border-gray-200 focus:outline-none focus:border-[#0F766E]"
                    required
                  />
                  <span className="text-xs font-bold text-gray-500">%</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveCategory(cat.id)}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  title="Remover categoria"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddCategory}
            className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Categoria</span>
          </button>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-semibold text-xs rounded-xl hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !isValidTotal}
              className="flex-1 py-3 px-4 bg-[#0F766E] text-white font-bold text-xs rounded-xl hover:bg-[#0d6861] transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span>Salvando...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Salvar Alterações</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
