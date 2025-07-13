// src/pages/RoupaItem.tsx
import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import type { Category } from "@/pages/Roupas";
import { Pencil, Trash2, X } from "lucide-react";

const placeholder = "https://cdn-icons-png.flaticon.com/512/892/892458.png";

interface ClothingExt {
  id: string;
  name: string;
  category: Category;
  image_url?: string;
  clothe_type?: string;
  color?: string;
  style?: string;
  characteristics?: string[];
}

// MOCK aqui localmente, em vez de importar de Roupas.tsx
const MOCK_CLOTHES: ClothingExt[] = [
  { id: "1", name: "Camiseta Branca", category: "tops" },
  { id: "2", name: "Jaqueta Jeans", category: "tops" },
  { id: "3", name: "Vestido Floral", category: "tops" },
  { id: "4", name: "Calça Preta", category: "bottoms" },
  { id: "5", name: "Saia Midi", category: "bottoms" },
  { id: "6", name: "Tênis Branco", category: "shoes" },
];

/* utilitários de estilos */
const pill =
  "px-2 py-0.5 text-[10px] rounded-full border border-gray-300 bg-gray-50 mr-1 mb-1";
const gBtn =
  "flex items-center justify-center gap-1.5 py-3 text-sm font-medium w-full rounded-full bg-gradient-to-r from-[#A02CFF] via-[#FF2DAF] to-[#FF6D00] text-white animate-gradient-pan";
const sBtn =
  "flex items-center justify-center gap-1.5 py-3 text-sm font-medium w-full rounded-full border";

export default function RoupaItem() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const original = MOCK_CLOTHES.find((c) => c.id === id);
  const [item, setItem] = useState<ClothingExt>(
    original ?? { id: "", name: "", category: "tops" }
  );
  const [edit, setEdit] = useState(false);

  if (!original) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="flex-1 pt-16 flex items-center justify-center text-gray-500">
          Peça não encontrada.
        </main>
        <BottomNav />
      </div>
    );
  }

  /* ações */
  const save = () => {
    Object.assign(original, item);
    setEdit(false);
  };
  const cancel = () => {
    setItem({ ...original });
    setEdit(false);
  };
  const remove = () => {
    const idx = MOCK_CLOTHES.findIndex((c) => c.id === original.id);
    if (idx > -1) MOCK_CLOTHES.splice(idx, 1);
    navigate("/roupas");
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900">
      <Header />

      {/* considera header (64px) e bottom-nav (56px) */}
      <main className="mt-[64px] mb-[56px] px-4 h-[calc(100svh-120px)] flex flex-col justify-between">
        {/* imagem no topo, sem borda */}
        <div className="flex justify-center pt-4">
          <img
            src={item.image_url || placeholder}
            onError={(e) => {
              e.currentTarget.src = placeholder;
            }}
            alt={item.name}
            className="w-32 h-32 object-contain drop-shadow-sm"
          />
        </div>

        {/* grid 3×3 de informações */}
        <div className="mt-4 grid grid-cols-3 gap-x-4 gap-y-3 text-[15px] flex-1 overflow-y-auto">
          <Cell
            label="Nome"
            value={item.name}
            edit={edit}
            onChange={(v) => setItem({ ...item, name: v })}
          />
          <Cell
            label="Categoria"
            value={item.category}
            edit={edit}
            select
            options={[
              { v: "tops", label: "Tops" },
              { v: "bottoms", label: "Bottoms" },
              { v: "shoes", label: "Shoes" },
            ]}
            onChange={(v) => setItem({ ...item, category: v as Category })}
          />
          <Cell
            label="Tipo"
            value={item.clothe_type || ""}
            edit={edit}
            onChange={(v) => setItem({ ...item, clothe_type: v })}
          />
          <Cell
            label="Cor"
            value={item.color || ""}
            edit={edit}
            onChange={(v) => setItem({ ...item, color: v })}
          />
          <Cell
            label="Estilo"
            value={item.style || ""}
            edit={edit}
            onChange={(v) => setItem({ ...item, style: v })}
          />
          {/* vazio para completar */}
          <div />

          {/* características linha inteira */}
          <div className="col-span-3">
            <p className="text-[11px] text-gray-500 mb-0.5">Características</p>
            {edit ? (
              <textarea
                rows={2}
                className="w-full border border-gray-300 rounded-md px-2 py-1 text-[15px]"
                placeholder="separar por vírgula"
                value={(item.characteristics ?? []).join(", ")}
                onChange={(e) =>
                  setItem({
                    ...item,
                    characteristics: e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
              />
            ) : (item.characteristics ?? []).length ? (
              <div className="flex flex-wrap">
                {item.characteristics!.map((c) => (
                  <span key={c} className={pill}>
                    {c}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-[15px]">—</p>
            )}
          </div>
        </div>

        {/* botões fixos em base */}
        <div className="grid grid-cols-2 gap-3 pt-4">
          {edit ? (
            <>
              <button onClick={save} className={gBtn}>
                <Pencil className="w-4 h-4" />
                Salvar
              </button>
              <button
                onClick={cancel}
                className={`${sBtn} border-gray-300 text-gray-600`}
              >
                <X className="w-4 h-4" />
                Cancelar
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setEdit(true)} className={gBtn}>
                <Pencil className="w-4 h-4" />
                Editar
              </button>
              <button
                onClick={remove}
                className={`${sBtn} border-red-400 text-red-500`}
              >
                <Trash2 className="w-4 h-4" />
                Excluir
              </button>
            </>
          )}
        </div>
      </main>

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

function Cell({
  label,
  value,
  edit,
  onChange,
  select = false,
  options = [],
}: {
  label: string;
  value: string;
  edit: boolean;
  onChange: (v: string) => void;
  select?: boolean;
  options?: { v: string; label: string }[];
}) {
  return (
    <div>
      <p className="text-[11px] text-gray-500 mb-0.5">{label}</p>
      {edit ? (
        select ? (
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-2 py-1 text-[15px]"
          >
            {options.map((o) => (
              <option key={o.v} value={o.v}>
                {o.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-2 py-1 text-[15px]"
          />
        )
      ) : (
        <p className="truncate">{value || "—"}</p>
      )}
    </div>
  );
}
