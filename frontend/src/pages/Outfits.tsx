// src/pages/Outfits.tsx
import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Sparkles, Share2 } from "lucide-react";
import api from "@/lib/api";
import html2canvas from "html2canvas";
import toast, { Toaster } from "react-hot-toast";

/* ------------------------------------------------------------------ */
/* ----------------------------- TYPES ------------------------------ */
/* ------------------------------------------------------------------ */
interface Item {
  id: string;
  name: string;
  img_url: string;
  category: "top" | "bottom" | "shoes";
}

interface Outfit {
  id: string;
  user_id: string;
  items: string[];
  created_at: string;
}

/* ------------------------------------------------------------------ */
/* ------------------------ CAROUSEL COMPONENT ---------------------- */
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
    <div className="w-full mb-4 h-32 flex items-center">
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
              className={`snap-center flex-shrink-0 flex items-center justify-center transition-all duration-200 w-1/3 sm:w-1/4 h-full ${
                isFocused ? "scale-110 opacity-100" : "scale-75 opacity-40"
              }`}
            >
              <img
                src={it.img_url}
                alt={it.name}
                draggable={false}
                className="max-w-full max-h-full object-contain pointer-events-none"
              />
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
/* ------------------------------------------------------------------ */
export default function Outfits() {
  const [items, setItems] = useState<Item[]>([]);
  const [savedOutfits, setSavedOutfits] = useState<Outfit[]>([]);
  const [mode, setMode] = useState<"manual" | "saved">("manual");
  const [topIdx, setTopIdx] = useState(0);
  const [botIdx, setBotIdx] = useState(0);
  const [shoeIdx, setShoeIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [itemsRes, outfitsRes] = await Promise.all([
        api.get<Item[]>("/items"),
        api.get<Outfit[]>("/outfits/"),
      ]);
      setItems(itemsRes.data);
      setSavedOutfits(outfitsRes.data);
    } catch (error) {
      console.error("Falha ao buscar dados:", error);
      toast.error("Não foi possível carregar os dados.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

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

  const save = async () => {
    if (!tops.length || !bots.length || !shoes.length) return;
    const currentTop = tops[topIdx];
    const currentBot = bots[botIdx];
    const currentShoe = shoes[shoeIdx];

    if (!currentTop || !currentBot || !currentShoe) {
      toast.error("Selecione um item de cada categoria.");
      return;
    }

    const ids = [currentTop.id, currentBot.id, currentShoe.id];

    setSaving(true);
    const promise = api.post("/outfits/custom", { items: ids });

    toast
      .promise(promise, {
        loading: "Salvando outfit...",
        success: () => {
          fetchAllData();
          setMode("saved");
          return "Outfit salvo com sucesso!";
        },
        error: (err) =>
          err.response?.data?.detail || "Erro ao salvar o outfit.",
      })
      .finally(() => setSaving(false));
  };

  const validSavedOutfits = useMemo(() => {
    const seen = new Set<string>();
    return savedOutfits
      .map((outfit) => {
        const allItemsExist =
          outfit.items &&
          outfit.items.length > 0 &&
          outfit.items.every((itemId) =>
            items.some((item) => item.id === itemId)
          );
        if (!allItemsExist) return null;
        return outfit;
      })
      .filter((o): o is Outfit => o !== null)
      .filter((o) => {
        const key = [...o.items].sort().join("::");
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  }, [savedOutfits, items]);

  const shareOutfit = async (outfitId: string) => {
    const node = document.getElementById(`shareable-outfit-${outfitId}`);
    if (!node) {
      toast.error("Elemento do outfit não encontrado.");
      return;
    }

    // Esconde o botão de compartilhar temporariamente
    const shareButton = node.querySelector(
      ".share-button-in-card"
    ) as HTMLElement;
    if (shareButton) shareButton.style.display = "none";

    const promise = html2canvas(node, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
    })
      .then((canvas) => {
        // Mostra o botão novamente após a captura
        if (shareButton) shareButton.style.display = "block";
        return new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Falha ao converter canvas para blob."));
          }, "image/png");
        });
      })
      .then((blob) => {
        const file = new File([blob], "azira_outfit.png", {
          type: "image/png",
        });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          return navigator.share({
            files: [file],
            title: "Meu Outfit Azira",
            text: "Confira meu outfit criado com Azira AI!",
          });
        } else {
          const url = URL.createObjectURL(file);
          const link = document.createElement("a");
          link.href = url;
          link.download = "azira_outfit.png";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
      })
      .catch((err) => {
        // Garante que o botão reapareça mesmo se houver erro
        if (shareButton) shareButton.style.display = "block";
        throw err;
      });

    toast.promise(promise, {
      loading: "Gerando imagem...",
      success: "Pronto para compartilhar!",
      error: "Erro ao gerar imagem.",
    });
  };

  const AziraLogo = () => (
    <svg
      width="56"
      height="12"
      viewBox="0 0 56 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient
          id="logo-gradient"
          x1="0"
          y1="6"
          x2="56"
          y2="6"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#A02CFF" />
          <stop offset="0.5" stopColor="#FF2DAF" />
          <stop offset="1" stopColor="#FF6D00" />
        </linearGradient>
      </defs>
      <text
        fill="url(#logo-gradient )"
        fontFamily="Arial, sans-serif"
        fontSize="10"
        fontWeight="bold"
      >
        <tspan x="0" y="9">
          AZIRA AI
        </tspan>
      </text>
    </svg>
  );

  return (
    <div className="h-screen flex flex-col bg-white text-gray-900">
      <Toaster position="top-center" reverseOrder={false} />
      <Header />

      <main className="flex-1 flex flex-col pt-20 overflow-hidden">
        <section className="w-[90%] max-w-md mb-4 text-center mx-auto flex-shrink-0">
          <h1 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#A02CFF] via-[#FF2DAF] to-[#FF6D00] animate-gradient-pan">
            Meus Outfits
          </h1>
          <p className="text-sm text-gray-600">
            Monte e salve combinações estilosas
          </p>
        </section>

        <div className="w-[90%] max-w-md mb-4 mx-auto flex-shrink-0">
          <div className="relative p-1 rounded-full bg-gray-200">
            <div
              className="absolute top-1 left-1 w-[calc(50%-4px)] h-[calc(100%-8px)] rounded-full bg-white shadow-md transition-transform duration-300 ease-in-out"
              style={{
                transform: `translateX(${mode === "saved" ? "100%" : "0"})`,
              }}
            />
            <div className="relative flex rounded-full text-sm z-10">
              <button
                onClick={() => setMode("manual")}
                className={`flex-1 py-2 rounded-full transition-colors duration-300 ${
                  mode === "manual"
                    ? "text-transparent bg-clip-text bg-gradient-to-r from-[#A02CFF] via-[#FF2DAF] to-[#FF6D00] font-semibold"
                    : "text-gray-500"
                }`}
              >
                Styling
              </button>
              <button
                onClick={() => setMode("saved")}
                className={`flex-1 py-2 rounded-full transition-colors duration-300 ${
                  mode === "saved"
                    ? "text-transparent bg-clip-text bg-gradient-to-r from-[#A02CFF] via-[#FF2DAF] to-[#FF6D00] font-semibold"
                    : "text-gray-500"
                }`}
              >
                Salvos
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-28">
          {loading ? (
            <div className="py-8 text-gray-400 text-center">Carregando…</div>
          ) : mode === "manual" ? (
            <div className="pt-4">
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
            </div>
          ) : validSavedOutfits.length > 0 ? (
            <div
              className="w-[90%] max-w-md mx-auto overflow-x-scroll flex snap-x snap-mandatory touch-pan-x no-scrollbar pt-4"
              style={{
                WebkitOverflowScrolling: "touch",
                scrollbarWidth: "none",
              }}
            >
              {validSavedOutfits.map((o) => {
                const outfitItems = {
                  top: items.find(
                    (it) =>
                      it.id ===
                      o.items.find(
                        (id) =>
                          items.find((i) => i.id === id)?.category === "top"
                      )
                  ),
                  bottom: items.find(
                    (it) =>
                      it.id ===
                      o.items.find(
                        (id) =>
                          items.find((i) => i.id === id)?.category === "bottom"
                      )
                  ),
                  shoes: items.find(
                    (it) =>
                      it.id ===
                      o.items.find(
                        (id) =>
                          items.find((i) => i.id === id)?.category === "shoes"
                      )
                  ),
                };

                return (
                  <div
                    key={o.id}
                    className="snap-center flex-shrink-0 w-full flex flex-col items-center p-2"
                  >
                    <div
                      id={`shareable-outfit-${o.id}`}
                      className="relative w-full bg-white flex flex-col items-center p-6 rounded-xl shadow-lg"
                    >
                      <div className="flex flex-col items-center space-y-[-16px]">
                        {outfitItems.top && (
                          <img
                            src={outfitItems.top.img_url}
                            alt={outfitItems.top.name}
                            className="h-32 object-contain"
                          />
                        )}
                        {outfitItems.bottom && (
                          <img
                            src={outfitItems.bottom.img_url}
                            alt={outfitItems.bottom.name}
                            className="h-32 object-contain"
                          />
                        )}
                      </div>
                      {outfitItems.shoes && (
                        <img
                          src={outfitItems.shoes.img_url}
                          alt={outfitItems.shoes.name}
                          className="h-20 object-contain mt-4"
                        />
                      )}

                      {/* BOTÃO DE COMPARTILHAR DENTRO DO CARD */}
                      <button
                        onClick={() => shareOutfit(o.id)}
                        className="share-button-in-card absolute bottom-3 left-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
                      >
                        <Share2 className="w-5 h-5 text-gray-600" />
                      </button>

                      <div className="absolute bottom-3 right-4">
                        <AziraLogo />
                      </div>
                    </div>

                    <div className="flex items-center justify-center w-full mt-2">
                      <span className="text-xs text-gray-400">
                        {new Date(o.created_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-10 px-4 text-gray-400 text-center w-full">
              <p className="font-semibold">Nenhum outfit salvo ainda.</p>
              <p className="text-sm mt-1">
                Vá para a aba "Styling" para criar e salvar sua primeira
                combinação!
              </p>
            </div>
          )}
        </div>

        {mode === "manual" && !loading && (
          <div className="absolute bottom-20 left-0 right-0 flex justify-between px-5 z-20">
            <button
              onClick={save}
              disabled={saving}
              className="px-5 py-3 rounded-full text-white bg-gradient-to-r from-[#A02CFF] via-[#FF2DAF] to-[#FF6D00] transition-opacity shadow-lg"
              style={{ opacity: saving ? 0.5 : 1 }}
            >
              {saving ? "Salvando…" : "Salvar"}
            </button>
            <button
              onClick={() => nav("/")}
              className="p-4 rounded-full text-white bg-gradient-to-r from-[#A02CFF] via-[#FF2DAF] to-[#FF6D00] shadow-lg"
            >
              <Sparkles className="w-6 h-6" />
            </button>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
