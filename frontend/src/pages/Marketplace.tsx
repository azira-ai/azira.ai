// src/pages/Marketplace.tsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";

interface Item {
  id: string;
  name: string;
  image_url: string;
  price?: string;
}

// Dados do usuário e sugestões com preço
const USER_TOPS: Item[] = [
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
];
const SUGGESTION_TOP: Item = {
  id: "sTop",
  name: "Blusa Clean XL",
  image_url: "https://i.ibb.co/XYZ123/blouse-clean.png",
  price: "R$ 199,90",
};
const USER_BOTTOMS: Item[] = [
  {
    id: "b1",
    name: "Calça Cargo",
    image_url: "https://i.ibb.co/KzWdFm8/pants-cargo.png",
  },
  {
    id: "b2",
    name: "Jeans Preta",
    image_url: "https://i.ibb.co/Vvz1f7p/jeans-black.png",
  },
  {
    id: "b3",
    name: "Shorts Cinza",
    image_url: "https://i.ibb.co/bFzP23R/shorts-grey.png",
  },
];
const SUGGESTION_BOTTOM: Item = {
  id: "sBot",
  name: "Saia Midi Floral",
  image_url: "https://i.ibb.co/ABC456/saia-floral.png",
  price: "R$ 149,90",
};
const USER_SHOES: Item[] = [
  {
    id: "sh1",
    name: "Tênis Vermelho",
    image_url: "https://i.ibb.co/bzkYJjZ/sneakers-red.png",
  },
  {
    id: "sh2",
    name: "Bota Preta",
    image_url: "https://i.ibb.co/dG6p5B1/boots-black.png",
  },
  {
    id: "sh3",
    name: "Tênis Branco",
    image_url: "https://i.ibb.co/W2gD2Sk/sneakers-white.png",
  },
];
const SUGGESTION_SHOE: Item = {
  id: "sSho",
  name: "Mocassim Marrom",
  image_url: "https://i.ibb.co/DEF789/mocassim-brown.png",
  price: "R$ 259,90",
};

// Intercala itens de usuário com sugestões
function buildMarketItems(user: Item[], suggestion: Item): Item[] {
  const out: Item[] = [];
  user.forEach((it, i) => {
    out.push(it);
    out.push({ ...suggestion, id: suggestion.id + i });
  });
  return out;
}
const MARKET_TOPS = buildMarketItems(USER_TOPS, SUGGESTION_TOP);
const MARKET_BOTTOMS = buildMarketItems(USER_BOTTOMS, SUGGESTION_BOTTOM);
const MARKET_SHOES = buildMarketItems(USER_SHOES, SUGGESTION_SHOE);

// Debounce helper
function useDebounce(fn: () => void, ms = 80) {
  const t = useRef<number>();
  return () => {
    window.clearTimeout(t.current);
    t.current = window.setTimeout(fn, ms);
  };
}

// Carousel component
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
    <div className="w-full">
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
          >
            <img
              src={it.image_url}
              alt={it.name}
              className="object-contain max-h-full drop-shadow-md rounded"
            />
            {it.id.startsWith("s") && (
              <span className="absolute top-2 left-2 bg-gradient-to-r from-[#A02CFF] via-[#FF2DAF] to-[#FF6D00] text-white text-[10px] font-semibold px-1 py-0.5 rounded">
                À venda
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Modal component
const CartModal = ({
  items,
  onClose,
  onRemove,
}: {
  items: Item[];
  onClose: () => void;
  onRemove: (id: string) => void;
}) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30">
    <div className="bg-white rounded-lg w-11/12 max-w-md p-6">
      <h2 className="text-lg font-semibold mb-4">Seu Carrinho</h2>
      <ul className="space-y-4 max-h-60 overflow-y-auto">
        {items.map((it) => (
          <li key={it.id} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img
                src={it.image_url}
                alt={it.name}
                className="w-12 h-12 object-contain rounded"
              />
              <div>
                <p className="font-medium text-gray-800">{it.name}</p>
                {it.price && (
                  <p className="text-sm text-gray-600">{it.price}</p>
                )}
              </div>
            </div>
            <button onClick={() => onRemove(it.id)} className="text-red-500">
              Remover
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-6 flex justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 rounded mr-2"
        >
          Fechar
        </button>
      </div>
    </div>
  </div>
);

export default function Marketplace() {
  const [tIdx, setT] = useState(1);
  const [bIdx, setB] = useState(2); // começa com elemento do usuário no centro para não-venda (idx 2)
  const [sIdx, setS] = useState(1); // idx 1 para sugestão no meio
  const [cartItems, setCartItems] = useState<Item[]>([]);
  const [showModal, setShowModal] = useState(false);

  const centralItems = [
    MARKET_TOPS[tIdx],
    MARKET_BOTTOMS[bIdx],
    MARKET_SHOES[sIdx],
  ];
  const selectedSuggestions = centralItems.filter((it) =>
    it.id.startsWith("s")
  );
  const centralSuggestionsExist = selectedSuggestions.length > 0;

  const handleBuy = () => {
    setCartItems(selectedSuggestions);
    setShowModal(true);
  };

  const handleRemove = (id: string) =>
    setCartItems((ci) => ci.filter((it) => it.id !== id));

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900">
      <Header />
      <main className="flex-1 pt-20 pb-28 flex flex-col items-center">
        <h1 className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-[#A02CFF] via-[#FF2DAF] to-[#FF6D00] animate-gradient-pan">
          Marketplace
        </h1>
        <p className="text-sm text-gray-600 mb-4">
          Explore itens para venda misturados aos seus
        </p>

        <ClothingCarousel items={MARKET_TOPS} idx={tIdx} setIdx={setT} />
        <ClothingCarousel items={MARKET_BOTTOMS} idx={bIdx} setIdx={setB} />
        <ClothingCarousel items={MARKET_SHOES} idx={sIdx} setIdx={setS} />

        {centralSuggestionsExist ? (
          <button
            onClick={handleBuy}
            className="mt-6 px-8 py-3 bg-gradient-to-r from-[#A02CFF] via-[#FF2DAF] to-[#FF6D00] text-white font-semibold rounded-full"
          >
            Comprar
          </button>
        ) : (
          <p className="mt-6 text-gray-600">Estas são as suas peças!</p>
        )}

        {showModal && (
          <CartModal
            items={cartItems}
            onClose={() => setShowModal(false)}
            onRemove={handleRemove}
          />
        )}
      </main>
      <BottomNav />
      {/* Global CSS for hiding scrollbars */}
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
}
