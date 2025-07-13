// src/pages/Login.tsx
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { login, signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegister) {
        await signUp(email, password);
      } else {
        await login(email, password);
      }
      navigate("/");
    } catch (err: any) {
      alert(
        err.message ||
          (isRegister ? "Falha ao cadastrar" : "Falha ao fazer login")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-center items-center px-6
                    bg-gradient-to-br from-pink-100 via-white to-purple-100
                    animate-gradient-pan"
    >
      <h1
        className="text-5xl font-extrabold mb-4 text-transparent bg-clip-text
                     bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400
                     animate-gradient-pan"
      >
        AZIRA
      </h1>
      <p className="text-lg text-gray-700 mb-8 text-center max-w-md">
        Seu stylist personalizado: transforme seu guarda-roupa com IA.
      </p>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <input
          type="email"
          placeholder="E-mail"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 rounded-md bg-white placeholder-gray-400
                     text-gray-900 border-none focus:outline-none
                     focus:ring-2 focus:ring-purple-500"
        />
        <input
          type="password"
          placeholder="Senha"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 rounded-md bg-white placeholder-gray-400
                     text-gray-900 border-none focus:outline-none
                     focus:ring-2 focus:ring-purple-500"
        />
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 rounded-full font-medium text-white transition
                     ${
                       loading
                         ? "bg-gray-400 cursor-not-allowed"
                         : "bg-purple-600 hover:bg-purple-500"
                     }`}
        >
          {loading
            ? isRegister
              ? "Cadastrando…"
              : "Entrando…"
            : isRegister
            ? "Cadastrar"
            : "Entrar"}
        </button>
      </form>

      <p className="mt-4 text-sm text-gray-600">
        {isRegister ? "Já tem conta?" : "Não tem conta?"}{" "}
        <button
          type="button"
          onClick={() => setIsRegister(!isRegister)}
          className="text-purple-600 underline"
        >
          {isRegister ? "Faça login" : "Crie uma"}
        </button>
      </p>

      <style>{`
        @keyframes gradient-pan {
          0%,100% { background-position: 0% 50%; }
          50%     { background-position: 100% 50%; }
        }
        .animate-gradient-pan {
          background-size: 200% 200%;
          animation: gradient-pan 8s ease infinite;
        }
      `}</style>
    </div>
  );
}
