// src/pages/Outfits.tsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Sparkles } from "lucide-react";

/* ------------------------------------------------------------------ */
/* ------------------------------ DATA ------------------------------ */
/* ------------------------------------------------------------------ */
interface Item {
  id: string;
  name: string;
  image_url: string;
}

const TOPS: Item[] = [
  {
    id: "t1",
    name: "Jaqueta Jeans",
    image_url: "https://i.ibb.co/N1g26P0/jacket-denim.png",
  },
  {
    id: "t2",
    name: "Moletom Branco",
    image_url: "https://i.ibb.co/7jHn4qW/hoodie-white.png",
  },
  {
    id: "t3",
    name: "Camiseta Preta",
    image_url: "https://i.ibb.co/zH42SgB/tshirt-black.png",
  },
  {
    id: "t4",
    name: "Jaqueta Couro",
    image_url: "https://i.ibb.co/QnCgS8B/top-jacket.png",
  },
];

const BOTTOMS: Item[] = [
  {
    id: "b1",
    name: "Calça Cargo",
    image_url: "https://i.ibb.co/KzWdFm8/pants-cargo.png",
  },
  {
    id: "b2",
    name: "Calça Jeans Preta",
    image_url: "https://i.ibb.co/Vvz1f7p/jeans-black.png",
  },
  {
    id: "b3",
    name: "Shorts Cinza",
    image_url: "https://i.ibb.co/bFzP23R/shorts-grey.png",
  },
  {
    id: "b4",
    name: "Calça Flare",
    image_url: "https://i.ibb.co/GvxHs97/bottom-jeans.png",
  },
];

const SHOES: Item[] = [
  {
    id: "s1",
    name: "Tênis Vermelho",
    image_url: "https://i.ibb.co/bzkYJjZ/sneakers-red.png",
  },
  {
    id: "s2",
    name: "Bota Preta",
    image_url: "https://i.ibb.co/dG6p5B1/boots-black.png",
  },
  {
    id: "s3",
    name: "Tênis Branco",
    image_url: "https://i.ibb.co/W2gD2Sk/sneakers-white.png",
  },
  {
    id: "s4",
    name: "Tênis Preto",
    image_url: "https://i.ibb.co/3mN1p4m/shoes-black.png",
  },
];

/* ------------------------------------------------------------------ */
/* ------------------------ UTILITY: DEBOUNCE ----------------------- */
/* ------------------------------------------------------------------ */
function useDebounce(callback: (...args: any[]) => void, delay = 80) {
  const timer = useRef<number>();
  return (...args: any[]) => {
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => callback(...args), delay);
  };
}

/* ------------------------------------------------------------------ */
/* --------------------------- CAROUSEL ----------------------------- */
/* ------------------------------------------------------------------ */
const ClothingCarousel = ({
  items,
  currentIndex,
  setCurrentIndex,
}: {
  items: Item[];
  currentIndex: number;
  setCurrentIndex: (i: number) => void;
}) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  /* --- detect center item --- */
  const handleScroll = useCallback(() => {
    if (!wrapRef.current) return;
    const { scrollLeft, offsetWidth } = wrapRef.current;

    let best = currentIndex;
    let bestDist = Infinity;

    items.forEach((_, i) => {
      const el = itemRefs.current[i];
      if (!el) return;
      const center =
        el.offsetLeft - wrapRef.current!.offsetLeft + el.offsetWidth / 2;
      const dist = Math.abs(scrollLeft + offsetWidth / 2 - center);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });

    if (best !== currentIndex) setCurrentIndex(best);
  }, [currentIndex, items, setCurrentIndex]);

  const debouncedScroll = useDebounce(handleScroll);

  /* --- snap to current on mount / index change --- */
  useEffect(() => {
    const el = itemRefs.current[currentIndex];
    if (el && wrapRef.current) {
      const offset = el.offsetLeft - wrapRef.current.offsetLeft;
      wrapRef.current.scrollTo({
        left: offset - wrapRef.current.offsetWidth / 2 + el.offsetWidth / 2,
        behavior: "smooth",
      });
    }
  }, [currentIndex]);

  return (
    <div className="w-full">
      <div
        ref={wrapRef}
        onScroll={debouncedScroll}
        className="flex items-center h-32 overflow-x-auto snap-x snap-mandatory scrollbar-hide"
      >
        {items.map((item, i) => (
          <div
            key={item.id}
            ref={(el) => (itemRefs.current[i] = el)}
            className={`snap-center flex-shrink-0 flex items-center justify-center transition-all
              ${
                i === currentIndex
                  ? "scale-110 opacity-100"
                  : "scale-75 opacity-40"
              }
              w-1/3 sm:w-1/4 h-full`}
          >
            <img
              src={item.image_url}
              alt={item.name}
              className="max-w-full max-h-full object-contain drop-shadow-xl"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* --------------------------- OUTFITS PAGE ------------------------- */
/* ------------------------------------------------------------------ */
export default function Outfits() {
  const [topIdx, setTopIdx] = useState(1);
  const [botIdx, setBotIdx] = useState(1);
  const [shoeIdx, setShoeIdx] = useState(1);
  const [mode, setMode] = useState<"manual" | "saved">("manual");

  const saveOutfit = () => alert("Outfit salvo!");
  const genAI = () => alert("Gerar outfit via IA (mock)");

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900">
      <Header />

      {/* -------- MAIN -------- */}
      <main className="flex-1 pt-20 pb-28 flex flex-col items-center">
        <section className="w-[90%] max-w-md mx-auto">
          {/* Title */}
          <h1 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#A02CFF] via-[#FF2DAF] to-[#FF6D00] animate-gradient-pan">
            Meus Outfits
          </h1>
          <p className="text-sm text-gray-600 mb-4">
            Monte e salve combinações estilosas
          </p>

          {/* Tabs */}
          <div className="relative w-full mb-4">
            {/* moving highlight */}
            <span
              className={`absolute inset-y-0 left-0 w-1/2 rounded-full bg-white shadow transition-transform duration-300 ease-[cubic-bezier(.4,0,.2,1)]
                          ${mode === "saved" ? "translate-x-full" : ""}`}
            />
            <div className="flex rounded-full border border-gray-300 overflow-hidden text-sm font-medium">
              <button
                className={`flex-1 py-2 relative z-10 ${
                  mode === "manual"
                    ? "text-transparent bg-clip-text bg-gradient-to-r from-[#A02CFF] via-[#FF2DAF] to-[#FF6D00] animate-gradient-pan"
                    : "text-gray-500"
                }`}
                onClick={() => setMode("manual")}
              >
                Styling
              </button>
              <button
                className={`flex-1 py-2 relative z-10 ${
                  mode === "saved"
                    ? "text-transparent bg-clip-text bg-gradient-to-r from-[#A02CFF] via-[#FF2DAF] to-[#FF6D00] animate-gradient-pan"
                    : "text-gray-500"
                }`}
                onClick={() => setMode("saved")}
              >
                Outfits salvos
              </button>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="w-[90%] max-w-md flex-1 flex flex-col items-center relative">
          {mode === "manual" ? (
            <>
              <ClothingCarousel
                items={TOPS}
                currentIndex={topIdx}
                setCurrentIndex={setTopIdx}
              />
              <ClothingCarousel
                items={BOTTOMS}
                currentIndex={botIdx}
                setCurrentIndex={setBotIdx}
              />
              <ClothingCarousel
                items={SHOES}
                currentIndex={shoeIdx}
                setCurrentIndex={setShoeIdx}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              Nenhum outfit salvo ainda.
            </div>
          )}

          {/* Action buttons (bottom left / right) */}
          <button
            onClick={saveOutfit}
            aria-label="Salvar outfit"
            className="fixed bottom-24 left-5 bg-gradient-to-r from-[#A02CFF] via-[#FF2DAF] to-[#FF6D00]
                       text-white px-5 py-3 rounded-full shadow-lg animate-gradient-pan"
          >
            Salvar
          </button>

          <button
            onClick={genAI}
            aria-label="Gerar outfit por IA"
            className="fixed bottom-24 right-5 bg-gradient-to-r from-[#A02CFF] via-[#FF2DAF] to-[#FF6D00]
                       text-white p-4 rounded-full shadow-lg animate-gradient-pan"
          >
            <Sparkles className="w-6 h-6" />
          </button>
        </section>
      </main>

      <BottomNav />

      {/* -------- global utilities -------- */}
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
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
