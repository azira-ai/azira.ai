// src/pages/Outfits.tsx
import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  UIEvent,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Sparkles } from "lucide-react";
import api from "@/lib/api";

/* ------------------------------------------------------------------ */
/* ----------------------------- TYPES ------------------------------ */
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
  const obsRef = useRef<IntersectionObserver>();
  const [itemW, setItemW] = useState(0);
  const lockRef = useRef(false);

  /* lista tripla para loop infinito */
  const loop = useMemo(() => [...items, ...items, ...items], [items]);

  /* mede largura do slide */
  const measure = () => {
    const w =
      (wrapRef.current?.children[0] as HTMLElement)?.offsetWidth || itemW || 1;
    if (w !== itemW) setItemW(w);
  };

  /* centraliza na segunda cópia */
  const center = useCallback(() => {
    if (!wrapRef.current || !itemW || !items.length) return;
    wrapRef.current.scrollLeft = items.length * itemW;
  }, [items.length, itemW]);

  /* IntersectionObserver → foco no centro */
  useEffect(() => {
    if (!wrapRef.current) return;
    obsRef.current?.disconnect();
    obsRef.current = new IntersectionObserver(
      (entries) => {
        const mid =
          wrapRef.current!.scrollLeft + wrapRef.current!.clientWidth / 2;
        let best = { dist: Infinity, idx: 0 };
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const el = e.target as HTMLElement;
          const idx = Number(el.dataset.real);
          const cx = el.offsetLeft + el.offsetWidth / 2;
          const d = Math.abs(cx - mid);
          if (d < best.dist) best = { dist: d, idx };
        });
        setCurrentIndex(best.idx);
      },
      { root: wrapRef.current, threshold: 0.5 }
    );
    Array.from(wrapRef.current.children).forEach((el) =>
      obsRef.current!.observe(el)
    );
    return () => obsRef.current?.disconnect();
  }, [loop, setCurrentIndex]);

  useEffect(() => center(), [center, itemW]);
  useEffect(() => {
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  /* reposiciona quando sai 90 % da cópia central */
  const onScroll = (_e: UIEvent) => {
    const el = wrapRef.current;
    if (!el || !itemW || !items.length || lockRef.current) return;
    const span = items.length * itemW;
    if (el.scrollLeft < span * 0.1 || el.scrollLeft > span * 1.9) {
      lockRef.current = true;
      el.scrollLeft += el.scrollLeft < span ? span : -span;
      requestAnimationFrame(() => (lockRef.current = false));
    }
  };

  if (!items.length) return null;

  return (
    <div className="w-full mb-4">
      <div
        ref={wrapRef}
        onScroll={onScroll}
        className="flex h-32 overflow-x-scroll snap-x snap-mandatory touch-pan-x cursor-grab no-scrollbar"
        style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}
      >
        {loop.map((it, i) => {
          const real = i % items.length;
          const focus = real === currentIndex;
          return (
            <div
              key={`${it.id}-${i}`}
              data-real={real}
              style={{ scrollSnapStop: "always" }}
              className={`snap-center flex-shrink-0 flex items-center justify-center transition-all duration-200 ${
                focus ? "scale-110 opacity-100" : "scale-75 opacity-40"
              } w-1/3 sm:w-1/4 h-full`}
              onClick={() => setCurrentIndex(real)}
            >
              <img
                src={it.img_url}
                alt={it.name}
                onLoad={measure}
                draggable={false}
                className="max-w-full max-h-full object-contain pointer-events-none drop-shadow-xl"
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
export default function Outfits() {
  const [items, setItems] = useState<Item[]>([]);
  const [saved, setSaved] = useState<Outfit[]>([]);
  const [mode, setMode] = useState<"manual" | "saved">("manual");
  const [topIdx, setTopIdx] = useState(0);
  const [botIdx, setBotIdx] = useState(0);
  const [shoeIdx, setShoeIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  const fix = (arr: Item[], i: number) =>
    arr.length ? ((i % arr.length) + arr.length) % arr.length : 0;

  /* ------------------- fetch itens/outfits ------------------- */
  useEffect(() => {
    (async () => {
      setLoading(true);
      const [it, out] = await Promise.all([
        api.get<Item[]>("/items"),
        api.get<Outfit[]>("/outfits/"),
      ]);
      setItems(it.data);
      setSaved(out.data);
      setLoading(false);
    })();
  }, []);

  const tops = items.filter((i) => i.category === "top");
  const bots = items.filter((i) => i.category === "bottom");
  const shoes = items.filter((i) => i.category === "shoes");

  /* -------------------------- salvar -------------------------- */
  const save = async () => {
    if (!tops.length || !bots.length || !shoes.length) return;

    const ids = [
      tops[fix(tops, topIdx)].id,
      bots[fix(bots, botIdx)].id,
      shoes[fix(shoes, shoeIdx)].id,
    ];

    setSaving(true);
    try {
      /* corpo completo exigido pelo schema OutfitCreate */
      await api.post("/outfits/", {
        event_raw: "Manual outfit",
        event_json: { source: "manual" },
        items: ids,
      });

      setSaved((await api.get<Outfit[]>("/outfits/")).data);
      alert("Outfit salvo!");
    } catch (err: any) {
      console.error("Falha ao salvar:", err.response?.data || err);
      alert(
        err.response?.data?.detail ??
          "Erro ao salvar outfit. Verifique se os itens são válidos."
      );
    } finally {
      setSaving(false);
    }
  };

  /* --------------------------- UI --------------------------- */
  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900">
      <Header />

      <main className="flex-1 pt-20 pb-28 flex flex-col items-center">
        {/* título */}
        <section className="w-[90%] max-w-md mb-4">
          <h1 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#A02CFF] via-[#FF2DAF] to-[#FF6D00] animate-gradient-pan">
            Meus Outfits
          </h1>
          <p className="text-sm text-gray-600">
            Monte e salve combinações estilosas
          </p>
        </section>

        {/* tabs */}
        <div className="relative w-[90%] max-w-md mb-4">
          <span
            className={`absolute inset-y-0 left-0 w-1/2 rounded-full bg-white shadow transition-transform duration-300 ${
              mode === "saved" ? "translate-x-full" : ""
            }`}
          />
          <div className="flex rounded-full border border-gray-300 text-sm">
            <button
              onClick={() => setMode("manual")}
              className={`flex-1 py-2 z-10 ${
                mode === "manual"
                  ? "text-transparent bg-clip-text bg-gradient-to-r from-[#A02CFF] via-[#FF2DAF] to-[#FF6D00]"
                  : "text-gray-500"
              }`}
            >
              Styling
            </button>
            <button
              onClick={() => setMode("saved")}
              className={`flex-1 py-2 z-10 ${
                mode === "saved"
                  ? "text-transparent bg-clip-text bg-gradient-to-r from-[#A02CFF] via-[#FF2DAF] to-[#FF6D00]"
                  : "text-gray-500"
              }`}
            >
              Salvos
            </button>
          </div>
        </div>

        {/* conteúdo */}
        {loading ? (
          <div className="py-8 text-gray-400">Carregando…</div>
        ) : mode === "manual" ? (
          <>
            <ClothingCarousel
              items={tops}
              currentIndex={fix(tops, topIdx)}
              setCurrentIndex={setTopIdx}
            />
            <ClothingCarousel
              items={bots}
              currentIndex={fix(bots, botIdx)}
              setCurrentIndex={setBotIdx}
            />
            <ClothingCarousel
              items={shoes}
              currentIndex={fix(shoes, shoeIdx)}
              setCurrentIndex={setShoeIdx}
            />

            {/* botão salvar */}
            <button
              onClick={save}
              disabled={saving}
              className="fixed bottom-24 left-5 px-5 py-3 rounded-full text-white shadow-lg bg-gradient-to-r from-[#A02CFF] via-[#FF2DAF] to-[#FF6D00]"
              style={{ opacity: saving ? 0.5 : 1 }}
            >
              {saving ? "Salvando…" : "Salvar"}
            </button>

            {/* botão IA → home */}
            <button
              onClick={() => nav("/")}
              className="fixed bottom-24 right-5 p-4 rounded-full text-white shadow-lg bg-gradient-to-r from-[#A02CFF] via-[#FF2DAF] to-[#FF6D00]"
            >
              <Sparkles className="w-6 h-6" />
            </button>
          </>
        ) : saved.length ? (
          <div className="w-full grid gap-4 pb-12">
            {saved.map((o) => (
              <div key={o.id} className="flex bg-gray-100 p-3 rounded-xl">
                {o.items.map((id) => {
                  const it = items.find((x) => x.id === id);
                  return it ? (
                    <img
                      key={id}
                      src={it.img_url}
                      alt={it.name}
                      className="w-20 h-20 object-contain rounded-md"
                    />
                  ) : null;
                })}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-gray-400">Nenhum outfit salvo.</div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
