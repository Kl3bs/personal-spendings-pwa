"use client";

import { useState } from "react";
import { Expense } from "@/lib/firebase/firestore";
import { Check, Delete, Calendar, X, Sparkles, Pin } from "lucide-react";

interface ExpenseFormProps {
  userId: string;
  onSave: (expense: Omit<Expense, "id" | "createdAt">) => Promise<void>;
  onClose: () => void;
}

export function ExpenseForm({ userId, onSave, onClose }: ExpenseFormProps) {
  const [displayValue, setDisplayValue] = useState("0");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<"essencial" | "importante" | "superfluo">("essencial");
  const [isMonthlyBill, setIsMonthlyBill] = useState(false);
  const [saving, setSaving] = useState(false);

  function handleKeyPress(digit: string) {
    if (digit === "." && displayValue.includes(".")) return;
    if (displayValue === "0" && digit !== ".") {
      setDisplayValue(digit);
    } else {
      if (displayValue.replace(".", "").length >= 7) return; // limit size
      setDisplayValue((prev) => prev + digit);
    }
  }

  function handleDelete() {
    if (displayValue.length <= 1) {
      setDisplayValue("0");
    } else {
      setDisplayValue((prev) => prev.slice(0, -1));
    }
  }

  async function handleSubmit() {
    const val = parseFloat(displayValue);
    if (isNaN(val) || val <= 0) return;

    setSaving(true);
    try {
      await onSave({
        userId,
        amount: val,
        category,
        description: description.trim() || "Gasto sem descrição",
        date: new Date().toISOString().split("T")[0],
        isMonthlyBill,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex flex-col justify-end transition-opacity animate-in fade-in duration-200">
      <div className="bg-[#F9D19C] rounded-t-[40px] p-6 shadow-2xl flex flex-col gap-5 border-t border-white/40 max-w-md w-full mx-auto">
        {/* Handle Bar */}
        <div className="flex justify-between items-center">
          <div className="w-12 h-1.5 bg-[#2C2C2C]/20 rounded-full mx-auto -mr-6" />
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="p-2 rounded-full bg-white/40 text-[#2C2C2C] hover:bg-white/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Display Amount */}
        <div className="text-center space-y-1">
          <div className="text-3xl font-bold font-heading text-[#2C2C2C]">
            <span className="text-lg opacity-60 mr-1">R$</span>
            {displayValue}
          </div>

          {/* Description Input */}
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Adicionar descrição (ex: Almoço, Uber)..."
            className="w-full text-center text-xs bg-transparent border-b border-[#2C2C2C]/20 py-1 text-[#2C2C2C] placeholder:text-[#2C2C2C]/40 focus:outline-none focus:border-[#2C2C2C]/60"
          />

          {/* Monthly Bill Toggle */}
          <div className="flex justify-center pt-1">
            <button
              type="button"
              onClick={() => setIsMonthlyBill((prev) => !prev)}
              className={`py-1 px-3 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all border ${
                isMonthlyBill
                  ? "bg-[#2C2C2C] text-white border-transparent shadow-xs"
                  : "bg-white/50 text-[#2C2C2C]/80 border-[#2C2C2C]/20 hover:bg-white/70"
              }`}
            >
              <Pin className={`w-3.5 h-3.5 ${isMonthlyBill ? "fill-white" : ""}`} />
              <span>Conta do Mês</span>
            </button>
          </div>
        </div>

        {/* Reflexive Category Selector */}
        <div className="space-y-2">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-[#2C2C2C]/70 justify-center">
            <Sparkles className="w-3 h-3 text-[#2C2C2C]" />
            <span>Classificação Reflexiva:</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setCategory("essencial")}
              className={`py-2 px-2 rounded-2xl font-semibold transition-all border ${
                category === "essencial"
                  ? "bg-[#59C7DF] text-white border-white/40 shadow-sm"
                  : "bg-white/50 text-[#2C2C2C] border-transparent"
              }`}
            >
              🏠 Essencial
            </button>
            <button
              type="button"
              onClick={() => setCategory("importante")}
              className={`py-2 px-2 rounded-2xl font-semibold transition-all border ${
                category === "importante"
                  ? "bg-[#10B981] text-white border-white/40 shadow-sm"
                  : "bg-white/50 text-[#2C2C2C] border-transparent"
              }`}
            >
              📚 Importante
            </button>
            <button
              type="button"
              onClick={() => setCategory("superfluo")}
              className={`py-2 px-2 rounded-2xl font-semibold transition-all border ${
                category === "superfluo"
                  ? "bg-[#FDB557] text-[#2C2C2C] border-white/40 shadow-sm"
                  : "bg-white/50 text-[#2C2C2C] border-transparent"
              }`}
            >
              🎭 Supérfluo
            </button>
          </div>
        </div>

        {/* Custom Numeric Keypad (Figma BudgetNest Layout) */}
        <div className="grid grid-cols-4 gap-2.5 pt-2">
          {["1", "2", "3"].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyPress(num)}
              className="h-14 rounded-2xl bg-[#FFF8EA] text-[#2C2C2C] font-semibold text-xl shadow-xs active:scale-95 transition-all flex items-center justify-center"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={handleDelete}
            aria-label="Apagar"
            className="h-14 rounded-2xl bg-[#F5D7D7] text-[#9B3030] font-semibold shadow-xs active:scale-95 transition-all flex items-center justify-center"
          >
            <Delete className="w-5 h-5" />
          </button>

          {["4", "5", "6"].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyPress(num)}
              className="h-14 rounded-2xl bg-[#FFF8EA] text-[#2C2C2C] font-semibold text-xl shadow-xs active:scale-95 transition-all flex items-center justify-center"
            >
              {num}
            </button>
          ))}
          <div className="h-14 rounded-2xl bg-[#E5F0F2] text-[#2C2C2C] flex items-center justify-center">
            <Calendar className="w-5 h-5 opacity-70" />
          </div>

          {["7", "8", "9"].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyPress(num)}
              className="h-14 rounded-2xl bg-[#FFF8EA] text-[#2C2C2C] font-semibold text-xl shadow-xs active:scale-95 transition-all flex items-center justify-center"
            >
              {num}
            </button>
          ))}

          {/* Large Submit Button on the right grid column */}
          <button
            type="button"
            onClick={handleSubmit}
            aria-label="Salvar despesa"
            disabled={saving || parseFloat(displayValue) <= 0}
            className="row-span-2 rounded-2xl bg-white text-[#2C2C2C] font-bold shadow-md active:scale-95 transition-all flex items-center justify-center disabled:opacity-40"
          >
            <Check className="w-7 h-7 stroke-[3]" />
          </button>

          <button
            type="button"
            onClick={() => handleKeyPress(".")}
            className="h-14 rounded-2xl bg-[#DBEAF5] text-[#2C2C2C] font-semibold text-xl shadow-xs active:scale-95 transition-all flex items-center justify-center"
          >
            .
          </button>
          <button
            type="button"
            onClick={() => handleKeyPress("0")}
            className="h-14 rounded-2xl bg-[#FFF8EA] text-[#2C2C2C] font-semibold text-xl shadow-xs active:scale-95 transition-all flex items-center justify-center"
          >
            0
          </button>
          <button
            type="button"
            onClick={() => handleKeyPress("00")}
            className="h-14 rounded-2xl bg-[#FFF8EA] text-[#2C2C2C] font-semibold text-xs shadow-xs active:scale-95 transition-all flex items-center justify-center"
          >
            00
          </button>
        </div>
      </div>
    </div>
  );
}
