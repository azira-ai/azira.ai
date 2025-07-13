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
import Profile from "@/pages/Profile";
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
        <Route path="/login" element={<Login />} />

        {/* ---------- PRIVADAS ---------- */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          }
        />
        <Route
          path="/roupas"
          element={
            <PrivateRoute>
              <Roupas />
            </PrivateRoute>
          }
        />
        <Route
          path="/roupas/novo"
          element={
            <PrivateRoute>
              <RoupasNovo />
            </PrivateRoute>
          }
        />
        <Route
          path="/roupas/:id"
          element={
            <PrivateRoute>
              <RoupaItem />
            </PrivateRoute>
          }
        />
        <Route
          path="/marketplace"
          element={
            <PrivateRoute>
              <Marketplace />
            </PrivateRoute>
          }
        />
        <Route
          path="/outfits"
          element={
            <PrivateRoute>
              <Outfits />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />

        {/* ---------- NOT FOUND ---------- */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
