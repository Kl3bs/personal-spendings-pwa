"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BarChart2, PieChart, Wallet as WalletIcon, Settings } from "lucide-react";

export function FloatingDock() {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", icon: Home, label: "Home" },
    { href: "/challenge", icon: BarChart2, label: "Desafio 30d" },
    { href: "/budget", icon: PieChart, label: "Orçamento" },
    { href: "/patrimony", icon: WalletIcon, label: "Patrimônio" },
    { href: "/settings", icon: Settings, label: "Ajustes" },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-xs w-[calc(100%-3rem)] md:hidden">
      <nav className="bg-[#F9D19C]/90 backdrop-blur-md rounded-full p-1.5 flex items-center justify-around shadow-lg shadow-black/10 border border-white/40">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 ${
                isActive
                  ? "bg-[#FFF8EA] text-[#2C2C2C] shadow-md scale-105"
                  : "text-[#2C2C2C]/70 hover:text-[#2C2C2C] hover:bg-white/30"
              }`}
              title={item.label}
            >
              <Icon className="w-5 h-5 stroke-[2.2]" />
              {isActive && (
                <span className="sr-only">{item.label} (Ativo)</span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
