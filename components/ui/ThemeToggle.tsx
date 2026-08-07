"use client";

import { useTheme } from "@/lib/theme-provider";
import { Sun, Moon } from "lucide-react";
import { auth } from "@/lib/firebase/config";
import { setUserProfile } from "@/lib/firebase/firestore";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, resolvedTheme, setTheme } = useTheme();

  const cycleTheme = async () => {
    const nextTheme = resolvedTheme === "light" ? "dark" : "light";
    setTheme(nextTheme);

    const currentUser = auth.currentUser;
    if (currentUser) {
      const formattedTheme = nextTheme === "dark" ? "Dark" : "Light";
      try {
        await setUserProfile({
          uid: currentUser.uid,
          theme: formattedTheme,
        });
      } catch (err) {
        console.error("Erro ao salvar tema no perfil:", err);
      }
    }
  };

  return (
    <button
      onClick={cycleTheme}
      aria-label="Alternar tema"
      title={`Tema atual: ${theme === "light" ? "Claro" : theme === "dark" ? "Escuro" : "Sistema"}`}
      className={`p-2 rounded-xl text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center ${className}`}
    >
      {resolvedTheme === "light" ? (
        <Sun className="w-5 h-5 text-amber-500" />
      ) : (
        <Moon className="w-5 h-5 text-indigo-400" />
      )}
    </button>
  );
}
