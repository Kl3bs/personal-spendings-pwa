"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import {
  Wallet,
  Contribution,
  calculateWalletBalances,
  calculateMonthlyPatrimonyEvolution,
  calculatePatrimonySummary,
} from "@/lib/patrimony-engine";
import {
  addWallet,
  subscribeWallets,
  deleteWallet,
  addContribution,
  subscribeContributions,
} from "@/lib/firebase/firestore";
import { formatCurrency } from "@/lib/budget-engine";
import { FloatingDock } from "@/components/ui/FloatingDock";
import { Plus, Wallet as WalletIcon, Trash2, PiggyBank, TrendingUp, Calendar } from "lucide-react";

export default function PatrimonyPage() {
  const [user, setUser] = useState<User | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [isAddingWallet, setIsAddingWallet] = useState(false);
  const [walletName, setWalletName] = useState("");

  // Contribution state
  const [isAddingContribution, setIsAddingContribution] = useState(false);
  const [selectedWalletId, setSelectedWalletId] = useState("");
  const [contributionAmount, setContributionAmount] = useState("");
  const [contributionDate, setContributionDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [contributionNote, setContributionNote] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubW = subscribeWallets(user.uid, setWallets);
    const unsubC = subscribeContributions(user.uid, setContributions);
    return () => {
      unsubW();
      unsubC();
    };
  }, [user]);

  const walletBalances = calculateWalletBalances(wallets, contributions);
  const totalPatrimony = walletBalances.reduce((sum, w) => sum + w.balance, 0);
  const evolutionPoints = calculateMonthlyPatrimonyEvolution(contributions);
  const maxAccumulated = Math.max(...evolutionPoints.map((p) => p.accumulated), 1);
  const summary = calculatePatrimonySummary(contributions);

  async function handleCreateWallet() {
    if (walletName.trim() && user) {
      await addWallet({
        userId: user.uid,
        name: walletName.trim(),
      });
      setWalletName("");
      setIsAddingWallet(false);
    }
  }

  async function handleDeleteWallet(id: string) {
    await deleteWallet(id);
  }

  async function handleAddContribution() {
    const amount = parseFloat(contributionAmount);
    if (!isNaN(amount) && amount > 0 && selectedWalletId && user) {
      const note = contributionNote.trim();
      await addContribution({
        userId: user.uid,
        walletId: selectedWalletId,
        amount,
        date: contributionDate,
        ...(note ? { note } : {}),
      });
      setContributionAmount("");
      setContributionNote("");
      setIsAddingContribution(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen px-4 pt-6 pb-28 bg-[#FFFCF8]">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold font-heading text-[#2C2C2C]">Patrimônio & Wallets</h1>
          <p className="text-xs text-[#2C2C2C]/60">Monitore o crescimento dos seus investimentos</p>
        </div>
        <div className="flex items-center gap-2">
          {wallets.length > 0 && (
            <button
              onClick={() => {
                setSelectedWalletId(wallets[0].id);
                setIsAddingContribution(true);
              }}
              className="flex items-center gap-1.5 bg-[#10B981] text-white px-3 py-1.5 rounded-2xl text-xs font-semibold shadow-xs hover:bg-[#059669] transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>+ Novo Aporte</span>
            </button>
          )}
          <button
            onClick={() => setIsAddingWallet(true)}
            className="flex items-center gap-1.5 bg-[#F9D19C] text-[#2C2C2C] px-3 py-1.5 rounded-2xl text-xs font-semibold shadow-xs hover:bg-[#f6c382]"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Wallet</span>
          </button>
        </div>
      </div>

      {/* Hero Summary Card */}
      <div className="bg-gradient-to-br from-[#10B981] to-[#047857] text-white rounded-3xl p-6 shadow-md space-y-3 mb-6 relative overflow-hidden">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 bg-white/20 rounded-full inline-flex items-center gap-1">
              💰 Patrimônio Consolidado
              {summary.monthlyGrowthPercentage !== 0 && (
                <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                  {summary.monthlyGrowthPercentage > 0 ? `+${summary.monthlyGrowthPercentage}%` : `${summary.monthlyGrowthPercentage}%`} este mês
                </span>
              )}
            </span>
            <div className="text-3xl font-extrabold font-heading pt-1">
              {formatCurrency(totalPatrimony)}
            </div>
          </div>
          <div className="p-3 bg-white/10 rounded-2xl">
            <PiggyBank className="w-6 h-6 text-emerald-200" />
          </div>
        </div>
        <p className="text-xs opacity-85 flex justify-between items-center pt-1 border-t border-white/15">
          <span>
            {wallets.length} wallet{wallets.length !== 1 ? "s" : ""} · {contributions.length} aporte{contributions.length !== 1 ? "s" : ""}
          </span>
          {summary.currentMonthDeposits > 0 && (
            <span className="font-semibold text-emerald-100">
              +{formatCurrency(summary.currentMonthDeposits)} no mês atual
            </span>
          )}
        </p>
      </div>

      {/* Add Contribution Modal */}
      {isAddingContribution && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xs w-full space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-[#2C2C2C]">Registrar Aporte</h3>
            <p className="text-xs text-[#2C2C2C]/60">
              Selecione a wallet, informe a data e o valor depositado:
            </p>
            <select
              value={selectedWalletId}
              onChange={(e) => setSelectedWalletId(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold text-[#2C2C2C]"
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={contributionAmount}
              onChange={(e) => setContributionAmount(e.target.value)}
              placeholder="Valor em R$ (Ex: 500)"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-[#2C2C2C]"
            />
            <input
              type="date"
              value={contributionDate}
              onChange={(e) => setContributionDate(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-[#2C2C2C]"
            />
            <input
              type="text"
              value={contributionNote}
              onChange={(e) => setContributionNote(e.target.value)}
              placeholder="Nota / Descrição (opcional)"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-[#2C2C2C]"
            />
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsAddingContribution(false)}
                className="flex-1 py-2.5 text-xs font-semibold text-gray-500 bg-gray-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddContribution}
                className="flex-1 py-2.5 text-xs font-semibold text-white bg-[#10B981] rounded-xl hover:bg-[#059669]"
              >
                Registrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Wallet Modal */}
      {isAddingWallet && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xs w-full space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-[#2C2C2C]">Nova Wallet / Carteira</h3>
            <p className="text-xs text-[#2C2C2C]/60">
              Digite um nome para a sua wallet (ex: Reserva de Emergência, CDB Nubank, Tesouro Direto):
            </p>
            <input
              type="text"
              value={walletName}
              onChange={(e) => setWalletName(e.target.value)}
              placeholder="Ex: Reserva de Emergência"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-[#2C2C2C]"
            />
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsAddingWallet(false)}
                className="flex-1 py-2.5 text-xs font-semibold text-gray-500 bg-gray-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateWallet}
                className="flex-1 py-2.5 text-xs font-semibold text-[#2C2C2C] bg-[#F9D19C] rounded-xl"
              >
                Criar Wallet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Evolution Chart Card */}
      {evolutionPoints.length > 0 && (
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs space-y-4 mb-6">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-[#2C2C2C] flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Evolução Patrimonial (Mês a Mês)</span>
            </h2>
          </div>

          <div className="h-36 flex items-end justify-between gap-2 pt-4 px-2 border-b border-gray-100 pb-2">
            {evolutionPoints.map((pt) => {
              const heightPct = Math.max(10, Math.round((pt.accumulated / maxAccumulated) * 100));
              return (
                <div key={pt.monthKey} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                  <div className="text-[9px] font-bold text-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity">
                    {formatCurrency(pt.accumulated)}
                  </div>
                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full max-w-[28px] bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-xl transition-all shadow-xs"
                    title={`${pt.label}: ${formatCurrency(pt.accumulated)} (Aporte: ${formatCurrency(pt.monthlyDeposit)})`}
                  />
                  <span className="text-[10px] text-gray-500 font-medium">{pt.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Wallets Grid */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-[#2C2C2C]">Minhas Wallets</h2>

        {wallets.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl text-center space-y-2 border border-gray-100 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-[#10B981]/15 text-[#059669] flex items-center justify-center mx-auto">
              <WalletIcon className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-[#2C2C2C]">Nenhuma wallet criada ainda</h3>
            <p className="text-xs text-[#2C2C2C]/60 max-w-xs mx-auto">
              Crie sua primeira wallet para começar a organizar seus investimentos e poupança!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {walletBalances.map(({ wallet, balance }) => (
              <div
                key={wallet.id}
                className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex justify-between items-center"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <WalletIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#2C2C2C]">{wallet.name}</div>
                    <div className="text-[11px] text-gray-500">Saldo atual</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-sm font-extrabold text-[#2C2C2C]">
                    {formatCurrency(balance)}
                  </div>
                  <button
                    onClick={() => handleDeleteWallet(wallet.id)}
                    className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                    title="Excluir Wallet"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <FloatingDock />
    </div>
  );
}
