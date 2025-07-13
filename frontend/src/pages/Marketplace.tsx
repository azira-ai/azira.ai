// src/pages/Marketplace.tsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Sparkles } from "lucide-react";
import api from "@/lib/api";

/* ------------------------------------------------------------------ */
/* ----------------------------- TYPES ------------------------------- */
interface Item {
  id: string;
  name: string;
  category: "top" | "bottom" | "shoes";
  img_url: string;
  price?: string;
}

/* ------------------------------------------------------------------ */
/* ----------------------- DEBOUNCE HELPER -------------------------- */
function useDebounce(fn: () => void, ms = 80) {
  const t = useRef<number>();
  return () => {
    window.clearTimeout(t.current);
    t.current = window.setTimeout(fn, ms);
  };
}

/* ------------------------------------------------------------------ */
/* ------------------------ CAROUSEL COMPONENT ---------------------- */
const ClothingCarousel = ({
  items,
  idx,
  setIdx,
}: {
  items: Item[];
  idx: number;
  setIdx: (i: number) => void;
}) => {
  const wrap = useRef<HTMLDivElement>(null);
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const onScroll = useDebounce(() => {
    if (!wrap.current) return;
    const { scrollLeft, offsetWidth } = wrap.current;
    let best = idx,
      dist = Infinity;
    items.forEach((_, i) => {
      const el = refs.current[i];
      if (!el) return;
      const center =
        el.offsetLeft - wrap.current!.offsetLeft + el.offsetWidth / 2;
      const d = Math.abs(scrollLeft + offsetWidth / 2 - center);
      if (d < dist) {
        dist = d;
        best = i;
      }
    });
    if (best !== idx) setIdx(best);
  });

  useEffect(() => {
    const el = refs.current[idx];
    if (el && wrap.current) {
      const offset = el.offsetLeft - wrap.current.offsetLeft;
      wrap.current.scrollTo({
        left: offset - wrap.current.offsetWidth / 2 + el.offsetWidth / 2,
        behavior: "smooth",
      });
    }
  }, [idx]);

  return (
    <div className="w-full mb-4">
      <div
        ref={wrap}
        onScroll={onScroll}
        className="flex items-center h-32 overflow-x-auto snap-x snap-mandatory scrollbar-hide"
        style={{ msOverflowStyle: "none", scrollbarWidth: "none" }}
      >
        {items.map((it, i) => (
          <div
            key={it.id}
            ref={(r) => (refs.current[i] = r)}
            className={`snap-center flex-shrink-0 flex items-center justify-center ${
              i === idx ? "scale-110 opacity-100" : "scale-75 opacity-40"
            } w-1/3 sm:w-1/4 h-full relative transition-all`}
            onClick={() => setIdx(i)}
          >
            <img
              src={it.img_url}
              alt={it.name}
              className="object-contain max-h-full drop-shadow-md rounded"
            />
            {it.price && (
              <span className="absolute bottom-2 right-2 bg-white text-xs font-bold px-1 py-0.5 rounded">
                {it.price}
              </span>
            )}
          </div>
        ))}
      </div>
      <style jsx global>{`
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
};

/* ------------------------------------------------------------------ */
/* ---------------------------- PAGE -------------------------------- */
export default function Marketplace() {
  const [items, setItems] = useState<Item[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);

  // index states for manual scrolling
  const [topIdx, setTopIdx] = useState(0);
  const [botIdx, setBotIdx] = useState(0);
  const [shoeIdx, setShoeIdx] = useState(0);

  // AI suggestion per category
  const [suggestions, setSuggestions] = useState<{
    top?: Item;
    bottom?: Item;
    shoes?: Item;
  }>({});
  const [generating, setGenerating] = useState(false);

  // helper: interleave a suggestion into user's items
  const buildMarketItems = (user: Item[], suggestion?: Item) => {
    if (!suggestion) return user;
    const out: Item[] = [];
    user.forEach((it, i) => {
      out.push(it);
      // insert the same suggestion after each user item so it always appears in scroll
      out.push({ ...suggestion, id: suggestion.id + "-" + i });
    });
    return out;
  };

  // fetch all your items on mount
  useEffect(() => {
    (async () => {
      setLoadingItems(true);
      try {
        const resp = await api.get<Item[]>("/items");
        setItems(resp.data);
      } catch (err) {
        console.error("Erro ao buscar itens:", err);
      } finally {
        setLoadingItems(false);
      }
    })();
  }, []);

  // split by category
  const tops = items.filter((i) => i.category === "top");
  const bots = items.filter((i) => i.category === "bottom");
  const shoes = items.filter((i) => i.category === "shoes");

  // AI-generate recommendation
  const generateRecommendation = async () => {
    setGenerating(true);
    try {
      const { data } = await api.post<{
        outfit: { items: string[] };
        recommendation: string;
      }>("/outfits/", {
        event_raw: "string",
        event_json: { additionalProp1: {} },
        mode: "hybrid",
      });
      // find each item in your catalog
      const [topId, botId, shoeId] = data.outfit.items;
      setSuggestions({
        top: items.find((i) => i.id === topId),
        bottom: items.find((i) => i.id === botId),
        shoes: items.find((i) => i.id === shoeId),
      });
    } catch (err) {
      console.error("Erro ao gerar suggestion:", err);
      alert("Não foi possível gerar a recomendação AI.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900">
      <Header />
      <main className="flex-1 pt-20 pb-28 flex flex-col items-center">
        <h1 className="text-xl font-extrabold mb-2">
          Marketplace Real & AI-powered
        </h1>
        {loadingItems ? (
          <p className="text-gray-500">Carregando seus itens…</p>
        ) : (
          <>
            {/* TOPS */}
            <ClothingCarousel
              items={buildMarketItems(tops, suggestions.top)}
              idx={topIdx}
              setIdx={setTopIdx}
            />
            {/* BOTTOMS */}
            <ClothingCarousel
              items={buildMarketItems(bots, suggestions.bottom)}
              idx={botIdx}
              setIdx={setBotIdx}
            />
            {/* SHOES */}
            <ClothingCarousel
              items={buildMarketItems(shoes, suggestions.shoes)}
              idx={shoeIdx}
              setIdx={setShoeIdx}
            />
          </>
        )}

        {/* AI generate button */}
        <button
          onClick={generateRecommendation}
          disabled={generating || loadingItems}
          className="fixed bottom-24 right-5 p-4 rounded-full text-white shadow-lg bg-gradient-to-r from-[#A02CFF] via-[#FF2DAF] to-[#FF6D00] flex items-center justify-center"
        >
          {generating ? "…" : <Sparkles className="w-6 h-6" />}
        </button>
      </main>
      <BottomNav />
    </div>
  );
}
