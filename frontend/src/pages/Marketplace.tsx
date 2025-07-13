// src/pages/Marketplace.tsx
import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Sparkles, ShoppingCart, X, Trash2, Send } from "lucide-react";
import api from "@/lib/api";
import toast, { Toaster } from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";

/* ------------------------------------------------------------------ */
/* ----------------------------- TYPES ------------------------------ */
interface Item {
  id: string;
  name: string;
  img_url: string;
  category: "top" | "bottom" | "shoes";
  for_sale: boolean;
  price: number;
  user_id: string;
  created_at: string;
}

interface OutfitResponse {
  outfit: { items: string[] };
  recommendation: string;
}

/* ------------------------------------------------------------------ */
/* ------------------------ CAROUSEL COMPONENT ---------------------- */
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
  const scrollTimeout = useRef<number | null>(null);
  const itemWidthRef = useRef(0);

  const loopedItems = useMemo(() => {
    if (items.length === 0) return [];
    const needed = Math.max(7, items.length * 3);
    const looped = [];
    for (let i = 0; i < needed; i++) {
      looped.push(items[i % items.length]);
    }
    return looped;
  }, [items]);

  const setupCarousel = useCallback(() => {
    if (wrapRef.current && items.length > 0) {
      const itemEl = wrapRef.current.querySelector("div");
      if (itemEl) {
        itemWidthRef.current = itemEl.offsetWidth;
        const startIdx = Math.floor(loopedItems.length / 2);
        const startScroll =
          startIdx * itemWidthRef.current -
          wrapRef.current.offsetWidth / 2 +
          itemWidthRef.current / 2;
        wrapRef.current.scrollLeft = startScroll;
        setCurrentIndex(startIdx % items.length);
      }
    }
  }, [items.length, loopedItems.length, setCurrentIndex]);

  useEffect(() => {
    setupCarousel();
    window.addEventListener("resize", setupCarousel);
    return () => window.removeEventListener("resize", setupCarousel);
  }, [setupCarousel]);

  const handleScroll = () => {
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = window.setTimeout(() => {
      if (wrapRef.current && itemWidthRef.current > 0) {
        const scrollLeft = wrapRef.current.scrollLeft;
        const center = scrollLeft + wrapRef.current.offsetWidth / 2;
        const newIndex = Math.round(center / itemWidthRef.current) - 1;
        if (newIndex >= 0 && newIndex < loopedItems.length) {
          setCurrentIndex(newIndex % items.length);
        }
      }
    }, 150);
  };

  if (!items.length) return null;

  return (
    <div className="w-full h-32 flex items-center">
      <div
        ref={wrapRef}
        onScroll={handleScroll}
        className="flex items-center overflow-x-scroll snap-x snap-mandatory touch-pan-x cursor-grab no-scrollbar"
        style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}
      >
        {loopedItems.map((it, index) => {
          const realIndex = index % items.length;
          const isFocused = realIndex === currentIndex;
          return (
            <div
              key={`${it.id}-${index}`}
              style={{ scrollSnapAlign: "center" }}
              className={`snap-center flex-shrink-0 flex flex-col items-center justify-center transition-all duration-200 w-1/3 sm:w-1/4 h-full p-2`}
            >
              <div
                className={`relative transition-all duration-200 ${
                  isFocused ? "scale-110 opacity-100" : "scale-75 opacity-40"
                }`}
              >
                <img
                  src={it.img_url}
                  alt={it.name}
                  draggable={false}
                  className="max-w-full max-h-24 object-contain pointer-events-none rounded-md"
                />
                {it.for_sale && isFocused && (
                  <div className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg border-2 border-white">
                    R$ {it.price.toFixed(2).replace(".", ",")}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <style>{`.no-scrollbar::-webkit-scrollbar{display:none}`}</style>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* ---------------------------- PAGE -------------------------------- */
export default function Marketplace() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Item[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState<Item[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const [topIdx, setTopIdx] = useState(0);
  const [botIdx, setBotIdx] = useState(0);
  const [shoeIdx, setShoeIdx] = useState(0);

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        const { data } = await api.get<Item[]>("/items/query/join");
        setItems(data);
      } catch (err) {
        console.error("Erro ao buscar itens:", err);
        toast.error("Não foi possível carregar os itens.");
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  const tops = useMemo(
    () => items.filter((i) => i.category === "top"),
    [items]
  );
  const bots = useMemo(
    () => items.filter((i) => i.category === "bottom"),
    [items]
  );
  const shoes = useMemo(
    () => items.filter((i) => i.category === "shoes"),
    [items]
  );

  const currentTop = tops[topIdx];
  const currentBot = bots[botIdx];
  const currentShoe = shoes[shoeIdx];

  const saleItemsInFocus = useMemo(
    () =>
      [currentTop, currentBot, currentShoe].filter(
        (item): item is Item => !!(item && item.for_sale)
      ),
    [currentTop, currentBot, currentShoe]
  );

  const addToCart = (item: Item) => {
    if (cart.find((cartItem) => cartItem.id === item.id)) {
      toast.error(`${item.name} já está no carrinho.`);
      return;
    }
    setCart((prev) => [...prev, item]);
    toast.success(`${item.name} adicionado ao carrinho!`);
  };

  const addFocusedToCart = () => {
    saleItemsInFocus.forEach((item) => addToCart(item));
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId));
    toast.success("Item removido do carrinho.");
  };

  const cartTotal = useMemo(
    () => cart.reduce((total, item) => total + item.price, 0),
    [cart]
  );

  const handleGenerateSuggestion = async () => {
    if (!aiPrompt.trim()) {
      toast.error("Por favor, descreva o que você procura.");
      return;
    }
    setIsGenerating(true);
    setAiSuggestion(null);
    try {
      const { data } = await api.post<OutfitResponse>("/outfits/", {
        event_raw: aiPrompt,
        event_json: { source: "marketplace_ai_prompt" },
        mode: "hybrid",
      });
      const suggestedItems = data.outfit.items
        .map((itemId) => items.find((item) => item.id === itemId))
        .filter((item): item is Item => !!item);

      setAiSuggestion(suggestedItems);
      toast.success("Aqui está uma sugestão para você!");
    } catch (err) {
      console.error("Erro ao gerar sugestão:", err);
      toast.error("Não foi possível gerar uma sugestão no momento.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-white text-gray-900">
      <Toaster position="top-center" />
      <Header />
      <main className="flex-1 flex flex-col pt-16 overflow-hidden">
        <section className="w-[90%] max-w-md my-2 text-center mx-auto flex-shrink-0">
          <h1 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#A02CFF] via-[#FF2DAF] to-[#FF6D00] animate-gradient-pan">
            Seu Provador Inteligente
          </h1>
          <p className="text-sm text-gray-600">
            Combine suas peças com novidades ou peça à nossa AI para criar um
            look exclusivo, baseado no seu estilo.
          </p>
        </section>
        <div className="flex-1 overflow-y-auto pb-52 flex flex-col justify-center space-y-2 pt-[189px]">
          {" "}
          {/* 5cm de distância */}
          {loading ? (
            <p className="text-gray-500 text-center py-10">Carregando...</p>
          ) : (
            <>
              <ClothingCarousel
                items={tops}
                currentIndex={topIdx}
                setCurrentIndex={setTopIdx}
              />
              <ClothingCarousel
                items={bots}
                currentIndex={botIdx}
                setCurrentIndex={setBotIdx}
              />
              <ClothingCarousel
                items={shoes}
                currentIndex={shoeIdx}
                setCurrentIndex={setShoeIdx}
              />
            </>
          )}
        </div>
        {/* Botão AI e Barra do Carrinho */}
        <div className="absolute bottom-20 left-0 right-0 px-5 z-20 flex flex-col items-center space-y-3">
          <div className="w-full max-w-md flex items-center justify-end space-x-3">
            <AnimatePresence>
              {saleItemsInFocus.length > 0 && (
                <motion.button
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  onClick={addFocusedToCart}
                  className="flex-1 px-4 py-3 rounded-full text-white font-bold bg-gradient-to-r from-[#A02CFF] via-[#FF2DAF] to-[#FF6D00] transition-opacity shadow-lg text-sm"
                >
                  Comprar em Destaque
                </motion.button>
              )}
            </AnimatePresence>
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="p-4 rounded-full text-white bg-gradient-to-r from-[#A02CFF] via-[#FF2DAF] to-[#FF6D00] shadow-lg"
            >
              <Sparkles className="w-6 h-6" />
            </button>
          </div>
          <AnimatePresence>
            {cart.length > 0 && (
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                onClick={() => setIsCartOpen(true)}
                className="w-full max-w-md bg-gray-800 text-white p-3 rounded-xl flex justify-between items-center cursor-pointer shadow-2xl"
              >
                <div className="flex items-center space-x-3">
                  <ShoppingCart size={20} />
                  <span className="font-semibold">
                    {cart.length} {cart.length > 1 ? "itens" : "item"}
                  </span>
                </div>
                <span className="font-bold">
                  R$ {cartTotal.toFixed(2).replace(".", ",")}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Modal do Personal Stylist AI */}
      <AnimatePresence>
        {isAiModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4"
            onClick={() => setIsAiModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-md rounded-2xl p-5 flex flex-col space-y-4"
            >
              <h2 className="text-lg font-bold text-center">
                Personal Stylist AI
              </h2>
              <p className="text-sm text-center text-gray-600">
                Nossa AI irá analisar seu guarda-roupa para sugerir um look
                fashion com peças novas que combinam com seu estilo. Descreva a
                ocasião ou o que você procura!
              </p>

              {aiSuggestion ? (
                <div className="space-y-2">
                  {aiSuggestion.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between bg-gray-50 p-2 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <img
                          src={item.img_url}
                          alt={item.name}
                          className="w-12 h-12 object-contain rounded-md bg-white"
                        />
                        <div>
                          <p className="text-sm font-semibold">{item.name}</p>
                          <p className="text-sm font-bold text-green-600">
                            R$ {item.price.toFixed(2).replace(".", ",")}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => addToCart(item)}
                        className="p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200"
                      >
                        <ShoppingCart size={16} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      setAiSuggestion(null);
                      setAiPrompt("");
                    }}
                    className="w-full text-sm text-gray-600 hover:underline pt-2"
                  >
                    Pedir outra sugestão
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Ex: um look para um date à noite"
                    className="w-full p-3 pr-12 border rounded-lg focus:ring-2 focus:ring-purple-400 transition bg-white text-black"
                    disabled={isGenerating}
                  />
                  <button
                    onClick={handleGenerateSuggestion}
                    disabled={isGenerating}
                    className="absolute right-1 top-1 bottom-1 px-3 bg-gray-100 rounded-lg"
                  >
                    {isGenerating ? (
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Send size={16} className="text-gray-500" />
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal do Carrinho */}
      <AnimatePresence>
        {isCartOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-end z-50"
            onClick={() => setIsCartOpen(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: "0%" }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-lg rounded-t-2xl p-5 flex flex-col"
              style={{ maxHeight: "85vh" }}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">Seu Carrinho</h2>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-1 rounded-full hover:bg-gray-100"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto -mx-5 px-5 space-y-3">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3">
                    <img
                      src={item.img_url}
                      alt={item.name}
                      className="w-16 h-16 object-contain rounded-lg bg-gray-100"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{item.name}</p>
                      <p className="font-bold text-sm">
                        R$ {item.price.toFixed(2).replace(".", ",")}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-2 rounded-full hover:bg-red-50 text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {cart.length === 0 && (
                  <p className="text-center text-gray-500 py-8">
                    Seu carrinho está vazio.
                  </p>
                )}
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between font-bold text-lg mb-4">
                  <span>Total</span>
                  <span>R$ {cartTotal.toFixed(2).replace(".", ",")}</span>
                </div>
                <button
                  disabled={cart.length === 0}
                  className="w-full px-5 py-3 rounded-full text-white font-bold bg-gradient-to-r from-[#A02CFF] via-[#FF2DAF] to-[#FF6D00] shadow-lg disabled:opacity-50"
                >
                  Finalizar Compra
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
