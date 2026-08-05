"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase/config";
import { ensureUserProfile } from "@/lib/firebase/firestore";
import { ArrowLeft, Mail, Lock, LogIn, DollarSign } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [baseIncome, setBaseIncome] = useState("3500");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Auto-redirect if user is logged in
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await ensureUserProfile(user);
        router.push("/dashboard");
      }
    });
    return () => unsub();
  }, [router]);

  // Check for redirect result (fallback if popup is blocked)
  useEffect(() => {
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          await ensureUserProfile(result.user);
          router.push("/dashboard");
        }
      })
      .catch((err) => {
        if (err.code !== "auth/credential-already-in-use") {
          console.error("Redirect auth error:", err);
        }
      });
  }, [router]);

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        await ensureUserProfile(userCred.user, parseFloat(baseIncome) || 3500);
      } else {
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        await ensureUserProfile(userCred.user);
      }
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Falha na autenticação. Verifique os dados.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setError("");
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result?.user) {
        await ensureUserProfile(result.user);
        router.push("/dashboard");
      }
    } catch (err: any) {
      console.error("Google login error:", err);
      if (err.code === "auth/popup-closed-by-user") {
        setLoading(false);
        return;
      }

      // Fallback to redirect if popup fails or is blocked
      try {
        await signInWithRedirect(auth, googleProvider);
      } catch (redirectErr: any) {
        setError(redirectErr.message || err.message || "Erro ao entrar com Google.");
        setLoading(false);
      }
    }
  }

  return (
    <div className="flex flex-col min-h-screen px-6 py-8 justify-between bg-[#FFFCF8]">
      {/* Header */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm font-medium text-[#2C2C2C]/70 hover:text-[#2C2C2C]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar</span>
        </Link>
      </div>

      {/* Main Card */}
      <div className="my-auto space-y-6 max-w-xs mx-auto w-full">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold font-heading text-[#2C2C2C]">
            {isSignUp ? "Criar sua Conta" : "Bem-vindo de volta"}
          </h2>
          <p className="text-xs text-[#2C2C2C]/60">
            {isSignUp
              ? "Cadastre sua renda base e inicie o desafio"
              : "Entre para acompanhar seus gastos diários"}
          </p>
        </div>

        {error && (
          <div className="p-3 text-xs bg-red-50 text-red-600 rounded-xl border border-red-100 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#2C2C2C]">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#2C2C2C]/40" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full pl-9 pr-4 py-3 bg-white text-sm rounded-xl border border-[#2C2C2C]/10 focus:outline-none focus:border-[#F9D19C] text-[#2C2C2C]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#2C2C2C]">Senha</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#2C2C2C]/40" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-4 py-3 bg-white text-sm rounded-xl border border-[#2C2C2C]/10 focus:outline-none focus:border-[#F9D19C] text-[#2C2C2C]"
              />
            </div>
          </div>

          {isSignUp && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#2C2C2C]">Renda Base Mensal (R$)</label>
              <div className="relative">
                <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#2C2C2C]/40" />
                <input
                  type="number"
                  required
                  value={baseIncome}
                  onChange={(e) => setBaseIncome(e.target.value)}
                  placeholder="3500"
                  className="w-full pl-9 pr-4 py-3 bg-white text-sm rounded-xl border border-[#2C2C2C]/10 focus:outline-none focus:border-[#F9D19C] text-[#2C2C2C]"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 bg-[#F9D19C] hover:bg-[#f6c382] text-[#2C2C2C] font-semibold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? "Processando..." : isSignUp ? "Criar Conta" : "Entrar"}</span>
          </button>
        </form>

        <div className="relative my-4 text-center text-xs text-[#2C2C2C]/40">
          <span className="bg-[#FFFCF8] px-2 relative z-10">ou continue com</span>
          <div className="absolute inset-0 top-1/2 border-t border-[#2C2C2C]/10"></div>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-3 px-4 bg-white hover:bg-gray-50 text-[#2C2C2C] font-medium text-xs rounded-xl border border-[#2C2C2C]/10 shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{loading ? "Entrando..." : "Google"}</span>
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs font-medium text-[#2C2C2C]/70 hover:underline"
          >
            {isSignUp
              ? "Já tem uma conta? Faça Login"
              : "Não tem uma conta? Cadastre-se"}
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[10px] text-[#2C2C2C]/40">
        Gastos Conscientes PWA • Todos os direitos reservados
      </div>
    </div>
  );
}
