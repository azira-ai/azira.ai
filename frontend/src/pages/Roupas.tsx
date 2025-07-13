// src/pages/Roupas.tsx
import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import api from "@/lib/api";

export type CategoryFilter = "all" | "tops" | "bottoms" | "shoes";

export interface Clothing {
  id: string;
  name: string;
  category: string;
  type?: string;
  img_url?: string;
}

const placeholder = "https://cdn-icons-png.flaticon.com/512/892/892458.png";
// Tipos adicionais agrupados sob "tops" e "bottoms"
const topTypes = new Set([
  "shirt",
  "jacket",
  "coat",
  "blouse",
  "sweater",
  "hoodie",
  "jersey",
]);
const bottomTypes = new Set(["pants", "shorts", "skirt", "jeans", "trousers"]);

export default function Roupas() {
  const [filter, setFilter] = useState<CategoryFilter>("all");
  const [items, setItems] = useState<Clothing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api
      .get<Clothing[]>("/items")
      .then((res) => {
        setItems(res.data);
        setError(null);
      })
      .catch((err) => {
        console.error("Erro ao carregar peças:", err);
        setItems([]);
        setError(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const filteredItems = useMemo(() => {
    if (filter === "all") return items;
    if (filter === "tops")
      return items.filter((c) => {
        const cat = c.category.toLowerCase();
        return (
          cat === "tops" ||
          cat === "top" ||
          (c.type && topTypes.has(c.type.toLowerCase()))
        );
      });
    if (filter === "bottoms")
      return items.filter((c) => {
        const cat = c.category.toLowerCase();
        return (
          cat === "bottoms" ||
          cat === "bottom" ||
          (c.type && bottomTypes.has(c.type.toLowerCase()))
        );
      });
    if (filter === "shoes")
      return items.filter((c) => {
        const cat = c.category.toLowerCase();
        return cat === "shoes" || cat === "shoe";
      });
    return items;
  }, [filter, items]);

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900">
      <Header />

      <main className="flex-1 pt-16 pb-24 px-4 max-w-md md:max-w-xl mx-auto w-full">
        <h1 className="text-xl font-extrabold mb-1 text-transparent bg-clip-text bg-gradient-to-r from-[#A02CFF] via-[#FF2DAF] to-[#FF6D00] animate-gradient-pan">
          Meu Armário
        </h1>
        <p className="text-sm text-gray-600 mb-3">
          Suas peças organizadas, você mais estiloso
        </p>

        <div className="mb-4 flex rounded-full border border-gray-300 overflow-hidden text-xs font-medium">
          {[
            { id: "all", label: "Todas" },
            { id: "tops", label: "Tops" },
            { id: "bottoms", label: "Bottoms" },
            { id: "shoes", label: "Tênis" },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setFilter(id as CategoryFilter)}
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

        {loading ? (
          <p className="text-center text-gray-500 mt-20">Carregando peças…</p>
        ) : filteredItems.length === 0 ? (
          <div className="text-center text-gray-600 mt-20 space-y-4">
            <p>Nenhuma peça cadastrada.</p>
            <Link
              to="/roupas/novo"
              className="text-purple-600 underline hover:text-purple-500"
            >
              Quer cadastrar agora?
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {filteredItems.map((item) => (
              <Link
                to={`/roupas/${item.id}`}
                key={item.id}
                className="relative bg-white border border-gray-200 rounded-xl overflow-hidden flex items-center justify-center aspect-square hover:shadow-sm transition-shadow"
              >
                <img
                  src={item.img_url || placeholder}
                  onError={(e) => (e.currentTarget.src = placeholder)}
                  alt={item.name}
                  className="h-3/4 w-3/4 object-contain"
                />
              </Link>
            ))}
          </div>
        )}
      </main>

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
