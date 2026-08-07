"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { subscribeUserProfile, UserProfile } from "@/lib/firebase/firestore";
import { FloatingDock } from "./FloatingDock";
import { ThemeToggle } from "./ThemeToggle";
import { useTheme } from "@/lib/theme-provider";
import {
  Home,
  BarChart2,
  PieChart,
  PiggyBank,
  Settings,
  Wallet,
  LogOut,
  Search,
  HelpCircle,
  Mail,
  Bell,
  Power,
} from "lucide-react";
import Link from "next/link";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { setTheme } = useTheme();

  const isPublicRoute = pathname === "/" || pathname === "/login";

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        if (!isPublicRoute) router.push("/login");
        setLoading(false);
      }
    });
    return () => unsubAuth();
  }, [pathname, isPublicRoute, router]);

  useEffect(() => {
    if (!user) return;
    const unsubProfile = subscribeUserProfile(user.uid, (p) => {
      setProfile(p);
      const storedLocal = localStorage.getItem("theme-preference");
      if (p?.theme && !storedLocal) {
        const themeVal = p.theme.toLowerCase();
        if (themeVal === "light" || themeVal === "dark" || themeVal === "system") {
          setTheme(themeVal as "light" | "dark" | "system");
        }
      }
      setLoading(false);
    });
    return () => unsubProfile();
  }, [user, setTheme]);

  // Public pages (Onboarding & Login) -> Render full screen without sidebar/dock/header
  if (isPublicRoute) {
    return (
      <main className="min-h-screen max-w-md w-full mx-auto relative overflow-x-hidden">
        {children}
      </main>
    );
  }

  // Loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFCF8] dark:bg-[#0F172A] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#F9D19C] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-semibold text-[#2C2C2C]/60 dark:text-[#F8FAFC]/60">
            Carregando...
          </span>
        </div>
      </div>
    );
  }

  // If unauthenticated and on protected route, return empty (redirecting to /login)
  if (!user) {
    return null;
  }

  const userName =
    profile?.displayName ||
    user?.displayName ||
    (user?.email ? user.email.split("@")[0] : "Usuário");

  const navItems = [
    { href: "/dashboard", icon: Home, label: "Overview" },
    { href: "/investments", icon: PiggyBank, label: "Investimentos" },
    { href: "/budget", icon: PieChart, label: "Budgets" },
    { href: "/challenge", icon: BarChart2, label: "Goals" },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0F172A] text-[#2C2C2C] dark:text-[#F8FAFC] flex flex-col font-sans transition-colors duration-200">
      {/* Top Navbar Header (Mobile Bar) */}
      <header className="flex md:hidden items-center justify-between px-4 py-3 bg-white dark:bg-[#1E293B] border-b border-gray-100 dark:border-slate-800 sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#4285F4] rounded-xl flex items-center justify-center text-white font-bold shadow-xs">
            <Wallet className="w-4 h-4 stroke-[2.5]" />
          </div>
          <span className="font-bold font-heading text-base text-[#1E293B] dark:text-white">
            BudgetNest
          </span>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="w-7 h-7 rounded-full bg-[#F9D19C] text-[#2C2C2C] font-bold text-xs flex items-center justify-center border border-white dark:border-slate-800 shadow-xs">
            {userName.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      {/* Top Navbar Header (Desktop) */}
      <header className="hidden md:flex items-center justify-between px-8 py-4 bg-white dark:bg-[#1E293B] border-b border-gray-100 dark:border-slate-800 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#4285F4] rounded-2xl flex items-center justify-center text-white font-bold shadow-xs">
            <Wallet className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="font-bold font-heading text-xl text-[#1E293B] dark:text-white">
            BudgetNest
          </span>
        </div>

        <div className="flex items-center gap-5">
          <ThemeToggle />
          <button className="p-2 text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-white rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
            <HelpCircle className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-white rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
            <Mail className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-white rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          <div className="h-6 w-px bg-gray-200 dark:bg-slate-700"></div>

          {/* User Profile */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#F9D19C] text-[#2C2C2C] font-bold text-sm flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-xs">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-gray-800 dark:text-slate-200 leading-tight">
                {userName}
              </div>
              <div className="text-[10px] text-gray-400 dark:text-slate-400 truncate max-w-[120px]">
                {user.email}
              </div>
            </div>
            <button
              onClick={() => signOut(auth)}
              title="Sair"
              className="p-1.5 text-gray-400 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors ml-1"
            >
              <Power className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 relative">
        {/* Left Sidebar (Desktop) */}
        <aside className="hidden md:flex flex-col w-60 bg-white dark:bg-[#1E293B] border-r border-gray-100 dark:border-slate-800 p-5 shrink-0 justify-between min-h-[calc(100vh-65px)]">
          <div className="space-y-6">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-slate-800/80 text-xs rounded-xl border border-gray-100 dark:border-slate-700 text-gray-800 dark:text-slate-200 focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-[#F9D19C] transition-all"
              />
            </div>

            {/* Main Menu */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold tracking-wider text-gray-400 dark:text-slate-400 uppercase px-3 mb-2">
                Main Menu
              </div>
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-[#F9D19C] text-[#2C2C2C] shadow-xs"
                        : "text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    <Icon className="w-4 h-4 stroke-[2]" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* General */}
            <div className="space-y-1 pt-4 border-t border-gray-100 dark:border-slate-800">
              <div className="text-[10px] font-bold tracking-wider text-gray-400 dark:text-slate-400 uppercase px-3 mb-2">
                General
              </div>
              <Link
                href="/settings"
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  pathname === "/settings"
                    ? "bg-[#F9D19C] text-[#2C2C2C]"
                    : "text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </Link>
              <button
                onClick={() => signOut(auth)}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-gray-600 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 transition-all text-left"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          </div>

          {/* Sidebar Footer Info */}
          <div className="p-3 bg-[#FFFCF8] dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-700 text-[10px] text-gray-500 dark:text-slate-400 text-center">
            <span className="font-semibold text-gray-700 dark:text-slate-300">
              Gastos Conscientes
            </span>
            <br />
            Método Pay Yourself First
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-md mx-auto md:max-w-none md:mx-0 p-4 md:p-8 pb-24 md:pb-8 overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* Floating Pill Dock (Mobile Only) */}
      <FloatingDock />
    </div>
  );
}
