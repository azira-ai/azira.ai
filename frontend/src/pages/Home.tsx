// src/pages/Home.tsx
import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import api from "@/lib/api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface ClothingItem {
  id: string;
  category: string;
  type?: string;
  img_url?: string;
}
interface CarouselItem {
  id: string;
  image_url: string;
}
interface OutfitResponse {
  outfit: {
    id: string;
    items: string[];
    created_at: string;
  };
  recommendation: string;
}

const presets = [
  { label: "Look Profissional", type: "professional" },
  { label: "Look Casual", type: "casual" },
  { label: "Look Festa", type: "party" },
];

function ClothingCarousel({
  items,
  running,
  onIndexChange,
}: {
  items: CarouselItem[];
  running: boolean;
  onIndexChange: (centerId: string | null) => void;
}) {
  const [index, setIndex] = useState(0);
  const len = items.length;

  useEffect(() => {
    if (!running || len < 2) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % len);
    }, 8000);
    return () => clearInterval(timer);
  }, [running, len]);

  useEffect(() => {
    onIndexChange(items[index]?.id ?? null);
  }, [index]);

  if (len === 0) return null;
  const prev = items[(index + len - 1) % len];
  const curr = items[index];
  const next = items[(index + 1) % len];
  const display = [prev, curr, next];

  return (
    <div className="w-full flex justify-center items-center space-x-4 mb-6">
      {display.map((item, idx) => {
        const isCenter = idx === 1;
        return (
          <div
            key={item.id + idx}
            className={`transition-transform duration-500 ${
              isCenter
                ? "scale-110 opacity-100"
                : "scale-90 opacity-60 filter blur-sm"
            }`}
          >
            <img
              src={item.image_url}
              alt=""
              className={`object-contain rounded-lg ${
                isCenter ? "w-28 h-28" : "w-20 h-20"
              }`}
            />
          </div>
        );
      })}
    </div>
  );
}

export default function Home() {
  const [clothes, setClothes] = useState<ClothingItem[]>([]);
  const [chat, setChat] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [running, setRunning] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<OutfitResponse | null>(null);
  const [showRec, setShowRec] = useState(false);
  const [topsId, setTopsId] = useState<string | null>(null);
  const [bottomsId, setBottomsId] = useState<string | null>(null);
  const [shoesId, setShoesId] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<ClothingItem[]>("/items")
      .then((res) => setClothes(res.data))
      .catch((err) => console.error("Erro ao buscar itens:", err));
  }, []);

  function pickRandom(list: CarouselItem[]): CarouselItem[] {
    if (list.length <= 3) return list;
    return list.sort(() => Math.random() - 0.5).slice(0, 3);
  }

  const topsList = pickRandom(
    clothes
      .filter((c) => c.category?.toLowerCase().includes("top"))
      .map((c) => ({ id: c.id, image_url: c.img_url || "" }))
  );
  const bottomsList = pickRandom(
    clothes
      .filter((c) => c.category?.toLowerCase().includes("bottom"))
      .map((c) => ({ id: c.id, image_url: c.img_url || "" }))
  );
  const shoesList = pickRandom(
    clothes
      .filter((c) => c.category?.toLowerCase().includes("shoe"))
      .map((c) => ({ id: c.id, image_url: c.img_url || "" }))
  );

  const handleSend = async () => {
    if (!chat.trim()) {
      toast.error("Descreva onde você vai antes de enviar.");
      return;
    }
    const selectedItems = [topsId, bottomsId, shoesId].filter(Boolean);
    if (selectedItems.length < 3) {
      toast.error("Selecione ao menos uma peça de cada categoria.");
      return;
    }

    setRunning(false);
    setIsLoading(true);
    setSuggestion(null);
    setShowRec(false);

    try {
      const payload = {
        event_raw: `${
          selectedPreset ? `Look: ${selectedPreset}\n` : ""
        }${chat}`,
        event_json: { additionalProp1: {} },
        mode: "user_only",
      };

      const res = await api.post<OutfitResponse>("/outfits/", payload);
      setSuggestion(res.data);
      toast.success("Look gerado com sucesso!");
    } catch (err: any) {
      console.error("Erro ao gerar outfit:", err.response?.data || err);
      const detail =
        err.response?.data?.detail?.[0]?.msg || "Erro desconhecido";
      toast.error(`Falha ao gerar look: ${detail}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900 relative">
      <Header />

      <main className="flex-1 pt-20 pb-24 px-4 flex flex-col items-center overflow-hidden">
        <ToastContainer position="top-right" autoClose={3000} />

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute top-16 inset-x-0 bottom-0 bg-white bg-opacity-95 flex flex-col items-center justify-center z-10">
            {/* Animated bouncing dots */}
            <div className="flex space-x-2 mb-4">
              <div
                className="w-4 h-4 rounded-full bg-gradient-to-r from-[#A02CFF] via-[#FF2DAF] to-[#FF6D00] animate-bounce"
                style={{ animationDelay: "0s" }}
              />
              <div
                className="w-4 h-4 rounded-full bg-gradient-to-r from-[#A02CFF] via-[#FF2DAF] to-[#FF6D00] animate-bounce"
                style={{ animationDelay: "0.2s" }}
              />
              <div
                className="w-4 h-4 rounded-full bg-gradient-to-r from-[#A02CFF] via-[#FF2DAF] to-[#FF6D00] animate-bounce"
                style={{ animationDelay: "0.4s" }}
              />
            </div>
            <p className="text-xl font-semibold text-gray-800 text-center">
              Azira Stylist está montando o seu look perfeito...
            </p>
          </div>
        )}

        {/* Presets */}
        <div className="w-full overflow-x-hidden hide-scrollbar flex space-x-4 mb-6">
          {presets.map((p) => {
            const isActive = p.type === selectedPreset;
            return (
              <button
                key={p.type}
                onClick={() => setSelectedPreset(isActive ? null : p.type)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-gradient-to-r from-[#A02CFF] via-[#FF2DAF] to-[#FF6D00] text-white"
                    : "border border-gray-300 bg-white text-gray-900 hover:bg-gray-50"
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Carousels */}
        <ClothingCarousel
          items={topsList}
          running={running && !isLoading}
          onIndexChange={setTopsId}
        />
        <ClothingCarousel
          items={bottomsList}
          running={running && !isLoading}
          onIndexChange={setBottomsId}
        />
        <ClothingCarousel
          items={shoesList}
          running={running && !isLoading}
          onIndexChange={setShoesId}
        />

        {/* Chat & send */}
        <div className="w-full max-w-md mt-auto">
          <div className="flex space-x-2">
            <input
              type="text"
              value={chat}
              onChange={(e) => setChat(e.target.value)}
              placeholder="Descreva onde você vai e Azira criará o look"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none text-gray-900 bg-white"
            />
            <button
              onClick={handleSend}
              disabled={isLoading}
              className="px-4 py-3 rounded-full bg-gradient-to-r from-[#A02CFF] via-[#FF2DAF] to-[#FF6D00] text-white font-medium disabled:opacity-50"
            >
              Enviar
            </button>
          </div>
        </div>

        {/* “Ver recomendação” */}
        {suggestion && !isLoading && (
          <div className="w-full max-w-md mt-6 flex justify-center">
            <button
              onClick={() => setShowRec((show) => !show)}
              className="px-6 py-3 rounded-full bg-gradient-to-r from-[#A02CFF] via-[#FF2DAF] to-[#FF6D00] text-white font-medium"
            >
              {showRec ? "Ocultar recomendação" : "Ver recomendação"}
            </button>
          </div>
        )}

        {/* Recommendation */}
        {showRec && suggestion && (
          <div className="w-full max-w-md mt-4 space-y-4 text-center">
            <h2 className="text-lg font-semibold">Recomendação:</h2>
            <p className="text-gray-700">{suggestion.recommendation}</p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
