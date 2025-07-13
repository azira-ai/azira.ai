import React from "react";
import { Link } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Cabeçalho fixo com gradiente AZIRA
 * Gradiente: #A02CFF → #FF2DAF → #FF6D00
 * Fundo: #ffffff
 */
export function Header() {
  const { logout } = useAuth();

  return (
    <header className="fixed top-0 w-full px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-white z-10">
      <Link to="/" aria-label="Home">
        <h1
          className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#A02CFF] via-[#FF2DAF] to-[#FF6D00] animate-gradient-pan"
        >
          AZIRA
        </h1>
      </Link>
      <button onClick={logout} aria-label="Logout">
        <LogOut className="w-6 h-6 text-gray-500 hover:text-gray-900 transition" />
      </button>
    </header>
  );
}
