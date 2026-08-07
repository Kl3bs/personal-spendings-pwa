"use client";

import { useState, useEffect } from "react";
import { signOut, onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import {
  UserProfile,
  subscribeUserProfile,
  setUserProfile,
} from "@/lib/firebase/firestore";
import { useRouter } from "next/navigation";
import { FloatingDock } from "@/components/ui/FloatingDock";
import { formatCurrency } from "@/lib/budget-engine";
import { useTheme, Theme } from "@/lib/theme-provider";
import {
  Bell,
  Sun,
  Calendar,
  Lock,
  Download,
  Trash2,
  ChevronRight,
  LogOut,
  Settings,
  User as UserIcon,
  DollarSign,
  Edit2,
  Check,
  X,
} from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const { setTheme: setActiveTheme } = useTheme();

  // Edit states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [incomeInput, setIncomeInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubProfile = subscribeUserProfile(user.uid, (p) => {
      setProfile(p);
      if (p) {
        setNameInput(p.displayName || "");
        setIncomeInput(p.baseIncome ? p.baseIncome.toString() : "3500");
      }
    });
    return () => unsubProfile();
  }, [user]);

  async function handleSaveProfile() {
    if (!user) return;
    setSaving(true);
    try {
      await setUserProfile({
        uid: user.uid,
        displayName: nameInput.trim() || user.email?.split("@")[0] || "Usuário",
        baseIncome: parseFloat(incomeInput) || 3500,
      });
      setIsEditingProfile(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleNotifications() {
    if (!user) return;
    await setUserProfile({
      uid: user.uid,
      notificationsEnabled: !(profile?.notificationsEnabled ?? false),
    });
  }

  async function handleToggleAuth() {
    if (!user) return;
    await setUserProfile({
      uid: user.uid,
      authEnabled: !(profile?.authEnabled ?? true),
    });
  }

  async function handleCycleStartOfWeek() {
    if (!user) return;
    const current = profile?.startOfWeek || "Sunday";
    const next = current === "Sunday" ? "Monday" : "Sunday";
    await setUserProfile({
      uid: user.uid,
      startOfWeek: next,
    });
  }

  async function handleCycleTheme() {
    const current = profile?.theme || "System";
    const next = current === "System" ? "Light" : current === "Light" ? "Dark" : "System";
    
    // Updates theme context immediately
    setActiveTheme(next.toLowerCase() as Theme);

    if (user) {
      await setUserProfile({
        uid: user.uid,
        theme: next,
      });
    }
  }

  async function handleLogout() {
    await signOut(auth);
    router.push("/");
  }

  const notificationsEnabled = profile?.notificationsEnabled ?? false;
  const authEnabled = profile?.authEnabled ?? true;
  const startOfWeek = profile?.startOfWeek || "Sunday";
  const theme = profile?.theme || "System";
  const userName =
    profile?.displayName ||
    user?.displayName ||
    (user?.email ? user.email.split("@")[0] : "Usuário");
  const baseIncome = profile?.baseIncome || 3500;

  return (
    <div className="flex flex-col min-h-screen px-4 pt-6 pb-28 bg-[#FFFCF8] dark:bg-[#121318] text-[#2C2C2C] dark:text-[#F3F4F6] transition-colors duration-200">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-[#F9D19C]/30 dark:bg-amber-500/20 rounded-2xl">
            <Settings className="w-5 h-5 text-[#2C2C2C] dark:text-amber-300" />
          </div>
          <h1 className="text-xl font-bold font-heading text-[#2C2C2C] dark:text-white">Configurações</h1>
        </div>
        <button
          className="relative p-2.5 bg-white dark:bg-[#1A1C24] rounded-2xl border border-gray-100 dark:border-[#2B2E3C] shadow-xs text-[#2C2C2C] dark:text-gray-200"
          title="Notificações"
        >
          <Bell className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-6">
        {/* PROFILE CARD */}
        <div className="bg-white dark:bg-[#1A1C24] rounded-3xl border border-gray-100 dark:border-[#2B2E3C] p-5 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <div className="text-[11px] font-bold tracking-wider text-[#2C2C2C]/50 dark:text-gray-400 uppercase">
              Perfil do Usuário
            </div>
            {!isEditingProfile && (
              <button
                onClick={() => setIsEditingProfile(true)}
                className="text-xs font-semibold text-[#7C3AED] dark:text-purple-400 hover:underline flex items-center gap-1"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Editar</span>
              </button>
            )}
          </div>

          {!isEditingProfile ? (
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#F9D19C] text-[#2C2C2C] font-bold text-lg flex items-center justify-center shadow-xs shrink-0">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="space-y-0.5 overflow-hidden">
                <h3 className="text-sm font-bold text-[#2C2C2C] dark:text-white truncate">{userName}</h3>
                <p className="text-xs text-[#2C2C2C]/50 dark:text-gray-400 truncate">{user?.email}</p>
                <div className="text-xs font-semibold text-[#10B981] dark:text-emerald-400 pt-1">
                  Renda Base: <span className="font-extrabold">{formatCurrency(baseIncome)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Nome de Exibição</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-[#232631] border border-gray-200 dark:border-[#323646] rounded-xl text-xs font-semibold text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#F9D19C]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Renda Base Mensal (R$)</label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                  <input
                    type="number"
                    value={incomeInput}
                    onChange={(e) => setIncomeInput(e.target.value)}
                    placeholder="3500"
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-[#232631] border border-gray-200 dark:border-[#323646] rounded-xl text-xs font-semibold text-gray-800 dark:text-gray-100 focus:outline-none focus:border-[#F9D19C]"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="flex-1 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-[#232631] rounded-xl flex items-center justify-center gap-1"
                >
                  <X className="w-4 h-4" />
                  <span>Cancelar</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex-1 py-2 text-xs font-semibold text-[#2C2C2C] bg-[#F9D19C] rounded-xl flex items-center justify-center gap-1 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{saving ? "Salvando..." : "Salvar"}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* GENERAL Section */}
        <div className="space-y-2">
          <div className="text-[11px] font-bold tracking-wider text-[#2C2C2C]/50 dark:text-gray-400 px-1 uppercase">
            Geral
          </div>
          <div className="bg-white dark:bg-[#1A1C24] rounded-3xl border border-gray-100 dark:border-[#2B2E3C] divide-y divide-gray-50 dark:divide-[#2B2E3C] overflow-hidden shadow-xs">
            <button
              onClick={handleCycleTheme}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-[#232631]/50 text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#59C7DF]/20 text-[#0284C7] dark:text-cyan-400 rounded-xl">
                  <Sun className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-[#2C2C2C] dark:text-white">Aparência</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-[#2C2C2C]/50 dark:text-gray-400">
                <span>{theme}</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>

            <button
              onClick={handleCycleStartOfWeek}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-[#232631]/50 text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#FDB557]/20 text-[#D97706] dark:text-amber-400 rounded-xl">
                  <Calendar className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-[#2C2C2C] dark:text-white">Início da Semana</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-[#2C2C2C]/50 dark:text-gray-400">
                <span>{startOfWeek === "Sunday" ? "Domingo" : "Segunda-feira"}</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>

            <div className="p-4 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-[#232631]/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-pink-100 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 rounded-xl">
                  <Bell className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-[#2C2C2C] dark:text-white">Notificações</span>
              </div>
              <button
                onClick={handleToggleNotifications}
                className={`w-10 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                  notificationsEnabled ? "bg-[#6AAA55]" : "bg-gray-200 dark:bg-[#323646]"
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    notificationsEnabled ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="p-4 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-[#232631]/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#10B981]/20 text-[#059669] dark:text-emerald-400 rounded-xl">
                  <Lock className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-[#2C2C2C] dark:text-white">Autenticação</span>
              </div>
              <button
                onClick={handleToggleAuth}
                className={`w-10 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                  authEnabled ? "bg-[#6AAA55]" : "bg-gray-200 dark:bg-[#323646]"
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    authEnabled ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* DATA Section */}
        <div className="space-y-2">
          <div className="text-[11px] font-bold tracking-wider text-[#2C2C2C]/50 dark:text-gray-400 px-1 uppercase">
            Dados
          </div>
          <div className="bg-white dark:bg-[#1A1C24] rounded-3xl border border-gray-100 dark:border-[#2B2E3C] divide-y divide-gray-50 dark:divide-[#2B2E3C] overflow-hidden shadow-xs">
            <div className="p-4 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-[#232631]/50 cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-xl">
                  <Download className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-[#2C2C2C] dark:text-white">Exportar Dados</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#2C2C2C]/30 dark:text-gray-600" />
            </div>

            <div className="p-4 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-[#232631]/50 cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl">
                  <Trash2 className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-[#9B3030] dark:text-red-400">Apagar Dados</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#2C2C2C]/30 dark:text-gray-600" />
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full py-3.5 px-4 bg-white dark:bg-[#1A1C24] rounded-2xl border border-red-100 dark:border-red-900/30 text-xs font-bold text-red-600 dark:text-red-400 shadow-xs flex items-center justify-center gap-2 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sair da Conta</span>
        </button>
      </div>

      <FloatingDock />
    </div>
  );
}
