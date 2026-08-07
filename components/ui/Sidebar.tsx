"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { subscribeUserProfile, UserProfile } from "@/lib/firebase/firestore";
import {
  Home,
  BarChart2,
  PieChart,
  Settings,
  Wallet,
  LogOut,
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubProfile = subscribeUserProfile(user.uid, (p) => setProfile(p));
    return () => unsubProfile();
  }, [user]);

  const userName =
    profile?.displayName ||
    user?.displayName ||
    (user?.email ? user.email.split("@")[0] : "Usuário");

  const navItems = [
    { href: "/dashboard", icon: Home, label: "Home" },
    { href: "/challenge", icon: BarChart2, label: "Desafio 30 Dias" },
    { href: "/budget", icon: PieChart, label: "Orçamento & Metas" },
    { href: "/patrimony", icon: Wallet, label: "Patrimônio" },
    { href: "/settings", icon: Settings, label: "Configurações" },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-[#1A1C24] border-r border-gray-100 dark:border-[#2B2E3C] min-h-screen fixed left-0 top-0 z-30 p-6 justify-between shadow-xs">
      <div className="space-y-8">
        {/* Logo */}
        <div className="flex items-center gap-3 px-2">
          <div className="p-2.5 bg-[#F9D19C] dark:bg-amber-400 rounded-2xl text-[#2C2C2C] dark:text-[#121318] shadow-xs">
            <Wallet className="w-6 h-6 stroke-[2]" />
          </div>
          <div>
            <h1 className="font-bold text-base font-heading text-[#2C2C2C] dark:text-white leading-none">
              Gastos
            </h1>
            <span className="text-[10px] text-[#2C2C2C]/50 dark:text-gray-400 font-medium">
              Conscientes PWA
            </span>
          </div>
        </div>

        {/* User Card */}
        {user && (
          <div className="bg-[#FFFCF8] dark:bg-[#20232D] p-3.5 rounded-2xl border border-gray-100 dark:border-[#2E3242] flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#F9D19C] dark:bg-amber-400 text-[#2C2C2C] dark:text-[#121318] flex items-center justify-center font-bold text-sm">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-[#2C2C2C] dark:text-gray-100 truncate">
                {userName}
              </div>
              <div className="text-[10px] text-[#2C2C2C]/50 dark:text-gray-400 truncate">
                {user.email}
              </div>
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="space-y-1.5">
          <div className="text-[10px] font-bold tracking-wider text-[#2C2C2C]/40 dark:text-gray-400 px-3 uppercase mb-2">
            Navegação
          </div>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-[#F9D19C] dark:bg-amber-400 text-[#2C2C2C] dark:text-[#121318] font-bold shadow-xs dark:shadow-amber-400/20"
                    : "text-[#2C2C2C]/70 dark:text-gray-300 hover:bg-[#FFFCF8] dark:hover:bg-[#20232D] hover:text-[#2C2C2C] dark:hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4 stroke-[2]" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Logout */}
      {user && (
        <div className="pt-4 border-t border-gray-100 dark:border-[#2B2E3C]">
          <button
            onClick={() => signOut(auth)}
            className="w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair da Conta</span>
          </button>
        </div>
      )}
    </aside>
  );
}
