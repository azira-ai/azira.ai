// src/pages/Profile.tsx
import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { UploadCloud } from "lucide-react";
import api from "@/lib/api";
import avatarPlaceholder from "@/assets/avatar_placeholder.png";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface User {
  id: string;
  full_name: string;
  instagram: string;
  profile_picture: string;
  bio: string;
  date_of_birth: Date;
  phone: string;
  gender: string;
}

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const { data } = await api.get("/profiles/me");
      setUser({
        id: data.id,
        full_name: data.full_name ?? "",
        instagram: data.instagram ?? "",
        profile_picture: data.profile_picture ?? "",
        bio: data.bio ?? "",
        date_of_birth: data.date_of_birth
          ? new Date(data.date_of_birth)
          : new Date(),
        phone: data.phone ?? "",
        gender: data.gender ?? "",
      });
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível carregar o perfil.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof User, value: any) => {
    if (!user) return;
    setUser({ ...user, [field]: value });
  };

  const handleSave = async () => {
    if (!user) return;
    try {
      const payload: any = {
        full_name: user.full_name,
        instagram: user.instagram,
        bio: user.bio,
        date_of_birth: user.date_of_birth.toISOString().split("T")[0],
        phone: user.phone,
      };
      if (user.profile_picture) payload.profile_picture = user.profile_picture;
      if (user.gender) payload.gender = user.gender;

      const { data: updated } = await api.put("/profiles/me", payload);

      setUser({
        id: updated.id,
        full_name: updated.full_name,
        instagram: updated.instagram,
        profile_picture: updated.profile_picture ?? "",
        bio: updated.bio,
        date_of_birth: new Date(updated.date_of_birth),
        phone: updated.phone,
        gender: updated.gender ?? "",
      });
      setEditing(false);
      toast.success("Perfil atualizado com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível salvar o perfil.");
    }
  };

  const handleCancel = () => {
    setEditing(false);
    fetchProfile();
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <span className="animate-pulse text-lg text-gray-600">
          Carregando perfil...
        </span>
      </div>
    );
  }
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <span className="text-lg text-red-500">
          Perfil não encontrado. Tente novamente mais tarde.
        </span>
      </div>
    );
  }

  const avatarSrc =
    user.profile_picture.trim() !== ""
      ? user.profile_picture
      : avatarPlaceholder;

  return (
    <>
      <Header />
      <ToastContainer position="top-right" />
      <div className="min-h-screen flex flex-col bg-white pt-16 pb-24">
        <main className="flex-1 p-4 w-[90%] max-w-xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="text-sm text-[#A02CFF] font-medium"
              >
                Editar
              </button>
            )}
          </div>

          {/* Profile Card */}
          <section className="space-y-6 bg-white p-6 rounded-xl shadow">
            {/* Avatar */}
            <div className="flex justify-center">
              <div className="relative">
                <img
                  src={avatarSrc}
                  alt="Avatar"
                  className="w-24 h-24 rounded-full object-cover border bg-white"
                />
                {editing && (
                  <label className="absolute bottom-0 right-0 bg-white p-1 rounded-full shadow cursor-pointer">
                    <UploadCloud className="w-5 h-5 text-gray-600" />
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const formData = new FormData();
                        formData.append("file", file);
                        try {
                          const { data } = await api.post(
                            "/profiles/me/avatar",
                            formData,
                            {
                              headers: {
                                "Content-Type": "multipart/form-data",
                              },
                            }
                          );
                          handleChange("profile_picture", data.url);
                          toast.success("Avatar enviado com sucesso!");
                        } catch {
                          toast.error("Falha no upload da imagem.");
                        }
                      }}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Text Fields */}
            {[
              { label: "Nome Completo", field: "full_name" as const },
              { label: "Instagram", field: "instagram" as const },
              { label: "Telefone", field: "phone" as const },
            ].map(({ label, field }) => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {label}
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={user[field] as string}
                    onChange={(e) => handleChange(field, e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none bg-white text-gray-900 placeholder-gray-400"
                  />
                ) : (
                  <p className="w-full p-3 border border-gray-300 bg-white text-gray-900 rounded-lg">
                    {user[field] as string}
                  </p>
                )}
              </div>
            ))}

            {/* Date of birth */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data de Nascimento
              </label>
              {editing ? (
                <DatePicker
                  selected={user.date_of_birth}
                  onChange={(d) => handleChange("date_of_birth", d as Date)}
                  dateFormat="dd/MM/yyyy"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none bg-white text-gray-900 placeholder-gray-400"
                />
              ) : (
                <p className="w-full p-3 border border-gray-300 bg-white text-gray-900 rounded-lg">
                  {user.date_of_birth.toLocaleDateString("pt-BR")}
                </p>
              )}
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gênero
              </label>
              {editing ? (
                <select
                  value={user.gender}
                  onChange={(e) => handleChange("gender", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none bg-white text-gray-900 placeholder-gray-400"
                >
                  <option value="">Selecione...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              ) : (
                <p className="w-full p-3 border border-gray-300 bg-white text-gray-900 rounded-lg">
                  {user.gender || "—"}
                </p>
              )}
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bio
              </label>
              {editing ? (
                <textarea
                  rows={3}
                  value={user.bio}
                  onChange={(e) => handleChange("bio", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none bg-white text-gray-900 placeholder-gray-400"
                />
              ) : (
                <p className="w-full p-3 border border-gray-300 bg-white text-gray-900 rounded-lg">
                  {user.bio}
                </p>
              )}
            </div>

            {/* Actions */}
            {editing && (
              <div className="flex justify-end space-x-4">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-200 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-gradient-to-r from-[#A02CFF] via-[#FF2DAF] to-[#FF6D00] text-white rounded-lg"
                >
                  Salvar
                </button>
              </div>
            )}
          </section>
        </main>
        <BottomNav />
      </div>
    </>
  );
}
