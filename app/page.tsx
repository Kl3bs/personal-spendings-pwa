"use client";

import Link from "next/link";
import { Wallet, ArrowRight, ShieldCheck, TrendingUp } from "lucide-react";

export default function OnboardingPage() {
  return (
    <div className="flex flex-col min-h-screen px-6 py-12 justify-between items-center text-center bg-[#FFFCF8]">
      {/* Top spacing */}
      <div className="w-full flex justify-center">
        <span className="text-xs font-semibold px-3 py-1 bg-[#F9D19C]/30 text-[#2C2C2C] rounded-full">
          Método Pay Yourself First
        </span>
      </div>

      {/* Hero Illustration */}
      <div className="my-auto flex flex-col items-center gap-8">
        <div className="relative w-48 h-48 rounded-full bg-[#F9D19C]/40 flex items-center justify-center shadow-inner border border-[#F9D19C]/60">
          <div className="w-36 h-36 rounded-full bg-[#F9D19C] flex items-center justify-center shadow-lg transform -rotate-6 transition-transform hover:rotate-0 duration-300">
            <Wallet className="w-20 h-20 text-[#2C2C2C] stroke-[1.8]" />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-white p-2.5 rounded-full shadow-md border border-gray-100">
            <TrendingUp className="w-6 h-6 text-[#6AAA55]" />
          </div>
        </div>

        {/* Copy */}
        <div className="space-y-3 max-w-xs">
          <h1 className="text-2xl font-bold font-heading text-[#2C2C2C] leading-tight">
            Economize seu dinheiro com Gastos Conscientes
          </h1>
          <p className="text-sm text-[#2C2C2C]/70 leading-relaxed font-sans">
            Pague a você mesmo primeiro. Invista no seu futuro antes de pagar
            qualquer outra conta.
          </p>
        </div>

        {/* Highlights */}
        <div className="flex items-center gap-4 text-xs font-medium text-[#2C2C2C]/80 pt-2">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-[#6AAA55]" />
            <span>Offline-First</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <span>🎯 Desafio 30 Dias</span>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="w-full max-w-xs space-y-3">
        <Link
          href="/login"
          className="w-full py-4 px-6 bg-[#F9D19C] hover:bg-[#f6c382] text-[#2C2C2C] font-semibold text-base rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          <span>Começar Agora</span>
          <ArrowRight className="w-5 h-5" />
        </Link>
        <p className="text-xs text-[#2C2C2C]/50">
          Sem complicações • 100% gratuito
        </p>
      </div>
    </div>
  );
}
