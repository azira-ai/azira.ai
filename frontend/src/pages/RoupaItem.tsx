// src/pages/RoupaItem.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import api from "@/lib/api";
import { Pencil, Trash2, X } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export type Category = "all" | "tops" | "bottoms" | "shoes";

interface Item {
  id: string;
  name: string;
  category: Category;
  type?: string;
  color?: string;
  style?: string;
  characteristics?: string[];
  img_url?: string;
}

export default function RoupaItem() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState<Partial<Item>>({});

  useEffect(() => {
    if (!id) return;
    api
      .get<Item>(`/items/${id}`)
      .then((res) => {
        setItem(res.data);
        setForm(res.data);
      })
      .catch((err) => {
        console.error("Erro ao carregar peça:", err);
        setError("Peça não encontrada.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const remove = async () => {
    if (!id) return;
    try {
      await api.delete(`/items/${id}`);
      toast.success("Peça excluída com sucesso!");
      navigate("/roupas");
    } catch (err) {
      console.error(err);
      toast.error("Falha ao excluir peça.");
    }
  };

  const save = async () => {
    if (!id) return;
    try {
      await api.patch(`/items/${id}`, form);
      toast.success("Peça atualizada com sucesso!");
      setEdit(false);
      setLoading(true);
      const res = await api.get<Item>(`/items/${id}`);
      setItem(res.data);
      setForm(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar alterações.");
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-500">Carregando peça…</p>
      </div>
    );

  if (error || !item)
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="flex-1 pt-16 flex items-center justify-center text-gray-500">
          {error}
        </main>
        <BottomNav />
        <ToastContainer position="top-right" autoClose={3000} />
      </div>
    );

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900">
      <Header />
      <main className="mt-[64px] mb-[56px] pb-[56px] px-4 flex-1 overflow-y-auto">
        <ToastContainer position="top-right" autoClose={3000} />
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => navigate(-1)} className="p-2">
            <X className="w-6 h-6 text-gray-500" />
          </button>
          {!edit ? (
            <div className="flex gap-2">
              <button onClick={() => setEdit(true)} className="p-2">
                <Pencil className="w-6 h-6 text-purple-600" />
              </button>
              <button onClick={remove} className="p-2">
                <Trash2 className="w-6 h-6 text-red-500" />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={save}
                className="px-4 py-2 bg-purple-600 text-white rounded-full"
              >
                Salvar
              </button>
              <button
                onClick={() => {
                  setEdit(false);
                  setForm(item);
                }}
                className="px-4 py-2 border rounded-full"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center mb-6">
          <img
            src={item.img_url}
            alt={item.name}
            className="w-40 h-40 object-contain shadow-md rounded-lg"
          />
        </div>

        <div className="space-y-6">
          {(
            [
              { label: "Nome", key: "name" },
              { label: "Categoria", key: "category" },
              { label: "Tipo", key: "type" },
              { label: "Cor", key: "color" },
              { label: "Estilo", key: "style" },
            ] as const
          ).map(({ label, key }) => (
            <div key={key} className="flex flex-col">
              <span className="text-xs text-gray-500 mb-1 uppercase">
                {label}
              </span>
              {!edit ? (
                <span className="text-base font-medium">
                  {(item as any)[key] || "—"}
                </span>
              ) : (
                <input
                  value={(form as any)[key] || ""}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  placeholder={(item as any)[key] || ""}
                  className="w-full px-3 py-2 bg-white text-gray-900 placeholder-gray-500 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              )}
            </div>
          ))}

          <div className="flex flex-col">
            <span className="text-xs text-gray-500 mb-1 uppercase">
              Características
            </span>
            {!edit ? (
              <div className="flex flex-wrap gap-2">
                {item.characteristics?.map((c) => (
                  <span
                    key={c}
                    className="px-3 py-1 bg-gray-100 rounded-full text-sm"
                  >
                    {c}
                  </span>
                )) || <span className="text-gray-400">—</span>}
              </div>
            ) : (
              <input
                value={(form.characteristics || []).join(", ")}
                onChange={(e) =>
                  setForm({
                    ...form,
                    characteristics: e.target.value
                      .split(",")
                      .map((s) => s.trim()),
                  })
                }
                placeholder="Separe por vírgula"
                className="w-full px-3 py-2 bg-white text-gray-900 placeholder-gray-500 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            )}
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
