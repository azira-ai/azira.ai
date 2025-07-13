// src/pages/Home.tsx
import React, { useState } from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";

interface Item {
  id: string;
  image_url: string;
}

// Presets de recomendação
const presets = [
  { label: "Look Profissional", type: "professional" },
  { label: "Look Casual", type: "casual" },
  { label: "Look Festa", type: "party" },
];

// Três itens fixos por carrossel (sempre mostra 3, foco no do meio)
const TOPS: Item[] = [
  { id: "t1", image_url: "https://i.ibb.co/N1g26P0/jacket-denim.png" },
  { id: "t2", image_url: "https://i.ibb.co/7jHn4qW/hoodie-white.png" },
  { id: "t3", image_url: "https://i.ibb.co/zH42SgB/tshirt-black.png" },
];
const BOTTOMS: Item[] = [
  { id: "b1", image_url: "https://i.ibb.co/KzWdFm8/pants-cargo.png" },
  { id: "b2", image_url: "https://i.ibb.co/Vvz1f7p/jeans-black.png" },
  { id: "b3", image_url: "https://i.ibb.co/bFzP23R/shorts-grey.png" },
];
const SHOES: Item[] = [
  { id: "s1", image_url: "https://i.ibb.co/bzkYJjZ/sneakers-red.png" },
  { id: "s2", image_url: "https://i.ibb.co/dG6p5B1/boots-black.png" },
  { id: "s3", image_url: "https://i.ibb.co/W2gD2Sk/sneakers-white.png" },
];

// Carousel estático: sempre mostra 3 itens, foco no do meio
function ClothingCarousel({ items }: { items: Item[] }) {
  const [prev, curr, next] = items;
  return (
    <div className="w-full flex justify-center items-center space-x-4 mb-6">
      {[prev, curr, next].map((item, idx) => {
        const isCenter = idx === 1;
        return (
          <div
            key={item.id}
            className={`transition-transform ${
              isCenter ? "scale-110 opacity-100" : "scale-90 opacity-50"
            }`}
          >
            <img
              src={item.image_url}
              alt=""
              className={`object-contain rounded-lg ${
                isCenter ? "w-24 h-24" : "w-16 h-16"
              }`}
            />
          </div>
        );
      })}
    </div>
  );
}

export default function Home() {
  const [chat, setChat] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const handleSend = () => {
    const presetText = selectedPreset
      ? `Look: ${selectedPreset}`
      : "Sem preset";
    alert(`${presetText}\nDescrição: ${chat}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900 relative">
      <Header />

      <main className="flex-1 pt-20 pb-24 px-4 flex flex-col items-center">
        {/* Presets de look (com scroll mas sem barra visível) */}
        <div
          className="w-full overflow-x-auto hide-scrollbar flex space-x-4 mb-6"
          style={{ msOverflowStyle: "none", scrollbarWidth: "none" }}
        >
          {presets.map((p) => {
            const isActive = p.type === selectedPreset;
            return (
              <button
                key={p.type}
                onClick={() => setSelectedPreset(p.type)}
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

        {/* Carrosséis de sugestões */}
        <ClothingCarousel items={TOPS} />
        <ClothingCarousel items={BOTTOMS} />
        <ClothingCarousel items={SHOES} />
      </main>

      {/* Chat inferior fixo */}
      <div className="fixed bottom-16 left-0 w-full px-4 bg-white z-20">
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
            className="px-4 py-3 rounded-full bg-gradient-to-r from-[#A02CFF] via-[#FF2DAF] to-[#FF6D00] text-white font-medium"
          >
            Enviar
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

// No seu CSS global (index.css ou tailwind.css):
// .hide-scrollbar::-webkit-scrollbar { display: none; }
// .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
// Agora o scroll funciona mas não aparece a barra visual. (index.css ou tailwind.css):
// .scrollbar-hide::-webkit-scrollbar { display: none; }
// .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
