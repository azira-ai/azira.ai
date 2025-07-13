// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import "./styles/index.css";

import { AuthProvider } from "@/contexts/AuthContext";
import { AppRoutes } from "@/router/routes";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </React.StrictMode>
);
