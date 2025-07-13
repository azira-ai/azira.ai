// src/pages/Profile.tsx
import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { UploadCloud } from "lucide-react";

interface User {
  fullName: string;
  email: string;
  instagram: string;
  profilePicture: string;
  bio: string;
  dateOfBirth: Date;
  phone: string;
  gender: string;
}

const initialUser: User = {
  fullName: "João Silva",
  email: "joao.silva@example.com",
  instagram: "@joaosilva",
  profilePicture: "/avatar_placeholder.png",
  bio: "Fashion enthusiast and AI stylist tester.",
  dateOfBirth: new Date("1990-05-15"),
  phone: "+55 11 99999-9999",
  gender: "Male",
};

export default function Profile() {
  const [user, setUser] = useState<User>(initialUser);
  const [editing, setEditing] = useState(false);

  const handleChange = (field: keyof User, value: any) => {
    setUser((u) => ({ ...u, [field]: value } as User));
  };

  const handleSave = () => {
    setEditing(false);
    alert("Perfil salvo com sucesso!");
  };

  const handleCancel = () => {
    setUser(initialUser);
    setEditing(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white pt-16 pb-24">
      <Header />
      <main className="flex-1 p-4 w-[90%] max-w-xl mx-auto space-y-6">
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

        <section className="space-y-6 bg-white p-6 rounded-xl shadow">
          <div className="flex justify-center">
            <div className="relative">
              <img
                src={user.profilePicture}
                alt="Avatar"
                className="w-24 h-24 rounded-full object-cover"
              />
              {editing && (
                <label className="absolute bottom-0 right-0 bg-white p-1 rounded-full shadow cursor-pointer">
                  <UploadCloud className="w-5 h-5 text-gray-600" />
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file)
                        handleChange(
                          "profilePicture",
                          URL.createObjectURL(file)
                        );
                    }}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Campos */}
          {(
            [
              { label: "Nome Completo", field: "fullName" },
              { label: "Email", field: "email" },
              { label: "Instagram", field: "instagram" },
              { label: "Telefone", field: "phone" },
            ] as const
          ).map(({ label, field }) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {label}
              </label>
              {editing ? (
                <input
                  type={field === "email" ? "email" : "text"}
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data de Nascimento
            </label>
            {editing ? (
              <DatePicker
                selected={user.dateOfBirth}
                onChange={(date) => handleChange("dateOfBirth", date)}
                dateFormat="dd/MM/yyyy"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none bg-white text-gray-900 placeholder-gray-400"
              />
            ) : (
              <p className="w-full p-3 border border-gray-300 bg-white text-gray-900 rounded-lg">
                {user.dateOfBirth.toLocaleDateString("pt-BR")}
              </p>
            )}
          </div>

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
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            ) : (
              <p className="w-full p-3 border border-gray-300 bg-white text-gray-900 rounded-lg">
                {user.gender}
              </p>
            )}
          </div>

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
  );
}
