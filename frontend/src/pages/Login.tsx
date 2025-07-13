import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import GoogleLogo from "@/assets/icons8-google-logo-96.svg";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await login(); // OAuth do Google
      navigate("/");
    } catch {
      alert("Falha ao entrar com o Google.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-evenly items-center bg-[#181818] px-6">
      {/* --------- marca --------- */}
      <h1
        className="
          text-5xl sm:text-6xl font-extrabold uppercase text-transparent bg-clip-text
          bg-gradient-to-r from-[#A02CFF] via-[#FF2DAF] to-[#FF6D00]
          animate-gradient-pan text-center
        "
      >
        AZIRA
      </h1>

      {/* --------- slogan --------- */}
      <p className="text-white text-center max-w-md leading-relaxed">
        Transforme seus desejos e estilo em <strong>momentos memoráveis</strong>.
        <br />
        <span className="font-semibold">Experimente o que é a Azira.</span>
      </p>

      {/* --------- botão Google --------- */}
      <button
        onClick={handleLogin}
        disabled={loading}
        className={`
          w-full max-w-xs flex items-center justify-center gap-3
          ${loading ? "bg-gray-200 cursor-not-allowed" : "bg-white hover:bg-gray-100"}
          border border-gray-300 text-gray-800 font-medium
          py-3 rounded-full shadow-sm
          focus:outline-none focus:ring-2 focus:ring-[#A02CFF]
          transition-colors duration-200
        `}
      >
        {!loading && (
          <img src={GoogleLogo} alt="Logo do Google" className="w-5 h-5" />
        )}
        {loading ? "Entrando…" : "Entrar com o Google"}
      </button>

      {/* animação do gradiente */}
      <style>{`
        @keyframes gradient-pan {
          0%,100% { background-position: 0% 50%; }
          50%     { background-position: 100% 50%; }
        }
        .animate-gradient-pan {
          background-size: 200% 200%;
          animation: gradient-pan 4s linear infinite;
        }
      `}</style>
    </div>
  );
}
