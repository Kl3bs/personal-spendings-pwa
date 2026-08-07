"use client";

import { useTheme } from "@/lib/theme-provider";
import { Sun, Moon, Monitor } from "lucide-react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  return (
    <button
      onClick={cycleTheme}
      aria-label="Alternar tema"
      title={`Tema atual: ${theme === "light" ? "Claro" : theme === "dark" ? "Escuro" : "Sistema"}`}
      className={`p-2 rounded-xl text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center ${className}`}
    >
      {theme === "light" && <Sun className="w-5 h-5 text-amber-500" />}
      {theme === "dark" && <Moon className="w-5 h-5 text-indigo-400" />}
      {theme === "system" && <Monitor className="w-5 h-5 text-gray-500 dark:text-gray-400" />}
    </button>
  );
}
