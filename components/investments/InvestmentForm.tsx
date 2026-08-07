"use client";

import { useState } from "react";
import { Investment, InvestmentCategory } from "@/lib/firebase/firestore";
import { X, Check, Landmark, TrendingUp, ShieldCheck, Coins, MoreHorizontal } from "lucide-react";

interface InvestmentFormProps {
  userId: string;
  initialData?: Investment;
  onSave: (data: Omit<Investment, "id" | "createdAt">) => Promise<void>;
  onClose: () => void;
}

const CATEGORIES: {
  id: InvestmentCategory;
  label: string;
  icon: typeof Landmark;
  color: string;
}[] = [
  { id: "renda_fixa", label: "Renda Fixa", icon: Landmark, color: "bg-emerald-500 text-white" },
  { id: "acoes_fiis", label: "Ações & FIIs", icon: TrendingUp, color: "bg-indigo-500 text-white" },
  { id: "reserva_emergencia", label: "Reserva de Emergência", icon: ShieldCheck, color: "bg-amber-500 text-white" },
  { id: "cripto", label: "Cripto", icon: Coins, color: "bg-purple-500 text-white" },
  { id: "outros", label: "Outros", icon: MoreHorizontal, color: "bg-gray-500 text-white" },
];

export function InvestmentForm({
  userId,
  initialData,
  onSave,
  onClose,
}: InvestmentFormProps) {
  const [amount, setAmount] = useState<string>(
    initialData ? String(initialData.amount) : ""
  );
  const [category, setCategory] = useState<InvestmentCategory>(
    initialData ? initialData.category : "renda_fixa"
  );
  const [description, setDescription] = useState<string>(
    initialData ? initialData.description : ""
  );
  const [date, setDate] = useState<string>(
    initialData ? initialData.date : new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const numAmount = parseFloat(amount.replace(",", "."));

    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Por favor, informe um valor válido maior que zero.");
      return;
    }

    if (!description.trim()) {
      setError("Por favor, informe o nome ou descrição do investimento.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSave({
        userId,
        amount: numAmount,
        category,
        description: description.trim(),
        date,
      });
      onClose();
    } catch (err) {
      console.error("Erro ao salvar investimento:", err);
      setError("Erro ao salvar investimento. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-6 relative border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <h2 className="text-lg font-bold font-heading text-[#1E293B]">
            {initialData?.id ? "Editar Investimento" : "Novo Aporte de Investimento"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-xs font-semibold rounded-xl border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Amount Field */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Valor do Aporte (R$)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-sm">
                R$
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-gray-50 text-base font-bold text-[#1E293B] rounded-2xl border border-gray-200 focus:outline-none focus:bg-white focus:border-[#F9D19C] transition-all"
                required
              />
            </div>
          </div>

          {/* Category Chips */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">
              Tipo / Categoria
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat.id;
                const Icon = cat.icon;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      isSelected
                        ? "border-[#F9D19C] bg-[#FFF8EA] text-[#2C2C2C] shadow-xs"
                        : "border-gray-100 bg-gray-50 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <div className={`p-1 rounded-lg ${cat.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Nome do Ativo / Descrição
            </label>
            <input
              type="text"
              placeholder="Ex: CDB Banco Inter, Tesouro Selic, IVVB11"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 text-xs font-medium text-[#1E293B] rounded-2xl border border-gray-200 focus:outline-none focus:bg-white focus:border-[#F9D19C] transition-all"
              required
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Data do Aporte
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 text-xs font-medium text-[#1E293B] rounded-2xl border border-gray-200 focus:outline-none focus:bg-white focus:border-[#F9D19C] transition-all"
              required
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-semibold text-xs rounded-xl hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 bg-[#F9D19C] text-[#2C2C2C] font-bold text-xs rounded-xl hover:bg-[#f5c37e] transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Salvando...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Salvar Investimento</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
