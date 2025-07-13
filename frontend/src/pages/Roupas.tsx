import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";

/* ------------------- DATA ------------------- */
export type Category = "all" | "tops" | "bottoms" | "shoes";

export interface Clothing {
  id: string;
  name: string;
  category: Category;
  image_url?: string;
}

const placeholder = "https://cdn-icons-png.flaticon.com/512/892/892458.png";

export const MOCK_CLOTHES: Clothing[] = [
  { id: "1", name: "Camiseta Branca", category: "tops" },
  { id: "2", name: "Jaqueta Jeans", category: "tops" },
  { id: "3", name: "Vestido Floral", category: "tops" },
  { id: "4", name: "Calça Preta", category: "bottoms" },
  { id: "5", name: "Saia Midi", category: "bottoms" },
  { id: "6", name: "Tênis Branco", category: "shoes" },
];

/* ------------------ PAGE ------------------ */
export default function Roupas() {
  const [filter, setFilter] = useState<Category>("all");

  const clothes = useMemo(
    () =>
      filter === "all"
        ? MOCK_CLOTHES
        : MOCK_CLOTHES.filter((c) => c.category === filter),
    [filter]
  );

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900">
      <Header />

      <main className="flex-1 pt-16 pb-24 px-4 max-w-md md:max-w-xl mx-auto w-full">
        {/* titulo */}
        <h1 className="text-xl font-extrabold mb-1 text-transparent bg-clip-text bg-gradient-to-r from-[#A02CFF] via-[#FF2DAF] to-[#FF6D00] animate-gradient-pan">
          Meu Armário
        </h1>
        <p className="text-sm text-gray-600 mb-3">
          Suas peças organizadas, você mais estiloso
        </p>

        {/* filtro */}
        <div className="mb-4 flex rounded-full border border-gray-300 overflow-hidden text-xs font-medium">
          {[
            { id: "all", label: "Todas" },
            { id: "tops", label: "Tops" },
            { id: "bottoms", label: "Bottoms" },
            { id: "shoes", label: "Tênis" },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setFilter(id as Category)}
              className={`flex-1 py-2 transition-colors ${
                filter === id
                  ? "bg-white text-transparent bg-clip-text bg-gradient-to-r from-[#A02CFF] via-[#FF2DAF] to-[#FF6D00] animate-gradient-pan"
                  : "text-gray-500"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* grid */}
        {clothes.length === 0 ? (
          <p className="text-center text-gray-500 mt-20">
            Nenhuma peça cadastrada.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {clothes.map((item) => (
              <Link
                to={`/roupas/${item.id}`}
                key={item.id}
                className="relative bg-white border border-gray-200 rounded-xl overflow-hidden flex items-center justify-center aspect-square hover:shadow-sm transition-shadow"
              >
                <img
                  src={item.image_url || placeholder}
                  onError={(e) => (e.currentTarget.src = placeholder)}
                  alt={item.name}
                  className="h-3/4 w-3/4 object-contain"
                />
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* add peça */}
      <Link
        to="/roupas/novo"
        aria-label="Adicionar Peça"
        className="fixed bottom-24 right-5 md:bottom-28 md:right-8 bg-gradient-to-r from-[#A02CFF] via-[#FF2DAF] to-[#FF6D00] text-white p-4 rounded-full shadow-lg animate-gradient-pan"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4v16m8-8H4"
          />
        </svg>
      </Link>

      <BottomNav />

      {/* animação gradiente */}
      <style jsx global>{`
        @keyframes gradient-pan {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        .animate-gradient-pan {
          background-size: 200% 200%;
          animation: gradient-pan 4s linear infinite;
        }
      `}</style>
    </div>
  );
}
