// src/lib/api.ts
import axios from "axios";

export const API_BASE = (import.meta.env.VITE_API_URL ?? "").trim();
export const BACKEND_ENABLED = API_BASE.length > 0;

export const api = axios.create({
  baseURL: BACKEND_ENABLED ? API_BASE : undefined,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false,
});

// Adiciona JWT apenas se o backend estiver habilitado
api.interceptors.request.use((config) => {
  if (BACKEND_ENABLED) {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});
