// src/router/routes.tsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Roupas from "@/pages/Roupas";
import RoupasNovo from "@/pages/RoupasNovo";
import RoupaItem from "@/pages/RoupaItem";
import Outfits from "@/pages/Outfits";
import Marketplace from "@/pages/Marketplace";
import Profile from "@/pages/Profile"; // página mockada
import { useAuth } from "@/contexts/AuthContext";

// Rota privada genérica
function PrivateRoute({ children }: { children: JSX.Element }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ---------- PÚBLICAS ---------- */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />

        {/* ---------- ARMÁRIO ---------- */}
        <Route path="/roupas" element={<Roupas />} />
        <Route path="/roupas/novo" element={<RoupasNovo />} />
        <Route path="/roupas/:id" element={<RoupaItem />} />

        {/* ---------- MARKETPLACE ---------- */}
        <Route path="/marketplace" element={<Marketplace />} />

        {/* ---------- OUTFITS ---------- */}
        <Route path="/outfits" element={<Outfits />} />

        {/* ---------- PROFILE MOCK ---------- */}
        <Route
          path="/profile"
          element={
            // troque para <PrivateRoute> se for tornar protegida
            <Profile />
          }
        />

        {/* ---------- NOT FOUND ---------- */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
