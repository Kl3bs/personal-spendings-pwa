"use client";

import { useState } from "react";
import { Expense } from "@/lib/firebase/firestore";
import { formatCurrency } from "@/lib/budget-engine";
import { X, Plus, Trash2, Check, Zap, Sparkles, Pin } from "lucide-react";

interface BatchExpenseItem {
  id: string;
  description: string;
  amount: string;
  category: "essencial" | "importante" | "superfluo";
  date: string;
  isMonthlyBill: boolean;
}

interface BatchExpenseModalProps {
  userId: string;
  onSaveBatch: (
    expenses: Array<Omit<Expense, "id" | "createdAt">>,
  ) => Promise<void>;
  onClose: () => void;
}

export function BatchExpenseModal({
  userId,
  onSaveBatch,
  onClose,
}: BatchExpenseModalProps) {
  const todayStr = new Date().toISOString().split("T")[0];

  const [items, setItems] = useState<BatchExpenseItem[]>([
    {
      id: "item-1",
      description: "",
      amount: "",
      category: "essencial",
      date: todayStr,
      isMonthlyBill: false,
    },
    {
      id: "item-2",
      description: "",
      amount: "",
      category: "essencial",
      date: todayStr,
      isMonthlyBill: false,
    },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalAmount = items.reduce((sum, item) => {
    const val = parseFloat(item.amount);
    return sum + (isNaN(val) || val <= 0 ? 0 : val);
  }, 0);

  function handleAddItem() {
    const newItem: BatchExpenseItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      description: "",
      amount: "",
      category: "essencial",
      date: todayStr,
      isMonthlyBill: false,
    };
    setItems((prev) => [...prev, newItem]);
  }

  function handleRemoveItem(id: string) {
    if (items.length <= 1) {
      setError("Mantenha ao menos uma linha de gasto.");
      return;
    }
    setError(null);
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  function handleUpdateItem(
    id: string,
    field: keyof BatchExpenseItem,
    value: string | boolean,
  ) {
    setError(null);
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Filter valid items (must have amount > 0)
    const validItems = items.filter((item) => {
      const val = parseFloat(item.amount);
      return !isNaN(val) && val > 0;
    });

    if (validItems.length === 0) {
      setError("Informe o valor de pelo menos um gasto para cadastrar.");
      return;
    }

    const payload: Array<Omit<Expense, "id" | "createdAt">> = validItems.map(
      (item) => ({
        userId,
        description: item.description.trim() || "Gasto sem descrição",
        amount: parseFloat(item.amount),
        category: item.category,
        date: item.date || todayStr,
        isMonthlyBill: !!item.isMonthlyBill,
      }),
    );

    try {
      setSaving(true);
      setError(null);
      await onSaveBatch(payload);
      onClose();
    } catch (err) {
      console.error("Erro ao salvar gastos em lote:", err);
      setError("Ocorreu um erro ao salvar o lote. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-3xl p-6 shadow-2xl space-y-5 relative border border-gray-100 animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#F9D19C]/30 text-[#2C2C2C] flex items-center justify-center">
              <Zap className="w-5 h-5 fill-[#F9D19C]" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-heading text-[#1E293B]">
                Cadastro em Lote de Gastos
              </h2>
              <p className="text-xs text-gray-500">
                Lance várias despesas rapidamente em uma única operação.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Total Summary Banner */}
        <div className="p-4 rounded-2xl bg-[#0F766E]/5 border border-[#0F766E]/20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0F766E]">
            <Sparkles className="w-4 h-4" />
            <span>Total do Lote ({items.length} itens):</span>
          </div>
          <span className="text-lg font-extrabold font-heading text-[#0F766E]">
            {formatCurrency(totalAmount)}
          </span>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-xs font-semibold rounded-xl border border-red-100">
            {error}
          </div>
        )}

        {/* Form List */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {items.map((item, idx) => (
              <div
                key={item.id}
                className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col md:flex-row items-stretch md:items-center gap-2.5"
              >
                <span className="text-xs font-bold text-gray-400 w-5 text-center self-center hidden md:inline">
                  #{idx + 1}
                </span>

                {/* Description Input */}
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) =>
                    handleUpdateItem(item.id, "description", e.target.value)
                  }
                  placeholder="Descrição do gasto (ex: Mercado, Uber)"
                  className="flex-1 bg-white px-3 py-2 text-xs font-semibold text-[#1E293B] rounded-xl border border-gray-200 focus:outline-none focus:border-[#0F766E]"
                />

                {/* Amount Input */}
                <div className="relative w-full md:w-32">
                  <span className="absolute left-2.5 top-2 text-xs font-bold text-gray-400">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.amount}
                    onChange={(e) =>
                      handleUpdateItem(item.id, "amount", e.target.value)
                    }
                    placeholder="0.00"
                    className="w-full bg-white pl-8 pr-2.5 py-2 text-xs font-bold text-[#1E293B] rounded-xl border border-gray-200 focus:outline-none focus:border-[#0F766E]"
                  />
                </div>

                {/* Category Selector */}
                <select
                  value={item.category}
                  onChange={(e) =>
                    handleUpdateItem(
                      item.id,
                      "category",
                      e.target.value as
                        | "essencial"
                        | "importante"
                        | "superfluo",
                    )
                  }
                  className="bg-white px-2.5 py-2 text-xs font-semibold text-[#1E293B] rounded-xl border border-gray-200 focus:outline-none focus:border-[#0F766E]"
                >
                  <option value="essencial">🏠 Essencial</option>
                  <option value="importante">📚 Importante</option>
                  <option value="superfluo">🎭 Supérfluo</option>
                </select>

                {/* Date Input */}
                <input
                  type="date"
                  value={item.date}
                  onChange={(e) =>
                    handleUpdateItem(item.id, "date", e.target.value)
                  }
                  className="bg-white px-2 py-2 text-xs font-semibold text-[#1E293B] rounded-xl border border-gray-200 focus:outline-none focus:border-[#0F766E]"
                />

                {/* Monthly Bill Checkbox */}
                <label className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-700 select-none cursor-pointer bg-white px-2.5 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors shrink-0 whitespace-nowrap">
                  <input
                    type="checkbox"
                    aria-label="Conta do Mês"
                    checked={item.isMonthlyBill}
                    onChange={(e) =>
                      handleUpdateItem(
                        item.id,
                        "isMonthlyBill",
                        e.target.checked,
                      )
                    }
                    className="w-3.5 h-3.5 accent-[#0F766E] rounded cursor-pointer"
                  />
                  <Pin className="w-3 h-3 text-[#0F766E] fill-[#0F766E]/20" />
                  <span>Conta</span>
                </label>

                {/* Delete Row Button */}
                <button
                  type="button"
                  onClick={() => handleRemoveItem(item.id)}
                  aria-label="Remover item"
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors self-center"
                  title="Remover gasto do lote"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Add Row Button */}
          <button
            type="button"
            onClick={handleAddItem}
            className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ Adicionar outro gasto</span>
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
              disabled={saving}
              className="flex-1 py-3 px-4 bg-[#0F766E] text-white font-bold text-xs rounded-xl hover:bg-[#0d6861] transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <span>Salvando lote...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>
                    Cadastrar {items.length} Gastos (
                    {formatCurrency(totalAmount)})
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
