import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { supabase } from "@/lib/supabaseClient";
import api from "@/lib/api";

export type User = {
  id: string;
  email: string;
  nickname?: string;
  full_name?: string;
  is_iconic?: boolean;
  role?: string;
};

interface AuthContextProps {
  user: User | null;
  token: string | null;
  isIconic: boolean;
  login: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps>({} as AuthContextProps);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isIconic, setIsIconic] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Busca perfil no backend (rota /user/me) fileciteturn4file0
  const fetchMe = async () => {
    const res = await api.get<User>("/user/me");
    setUser(res.data);
    setIsIconic(Boolean(res.data.is_iconic));
    localStorage.setItem("user", JSON.stringify(res.data));
  };

  // Login Supabase + seta header e busca perfil
  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error || !data.session)
      throw new Error(error?.message || "Erro no login");
    const jwt = data.session.access_token;
    localStorage.setItem("token", jwt);
    api.defaults.headers.common["Authorization"] = `Bearer ${jwt}`;
    setToken(jwt);
    await fetchMe();
  };

  // Cadastro Supabase: trata 422 e confirma e-mail
  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      if (
        error.status === 422 &&
        error.message.includes("already registered")
      ) {
        throw new Error("Usuário já cadastrado. Tente fazer login.");
      }
      throw new Error(error.message);
    }
    // Se o Supabase já devolveu sessão, então busca perfil
    if (data.session) {
      const jwt = data.session.access_token;
      localStorage.setItem("token", jwt);
      api.defaults.headers.common["Authorization"] = `Bearer ${jwt}`;
      setToken(jwt);
      await fetchMe();
    } else {
      throw new Error(
        "Cadastro realizado! Verifique seu e-mail para confirmar."
      );
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    setToken(null);
    setUser(null);
    setIsIconic(false);
    delete api.defaults.headers.common["Authorization"];
  };

  // Inicializa token + busca perfil uma vez
  useEffect(() => {
    (async () => {
      const stored = localStorage.getItem("token");
      if (stored) {
        setToken(stored);
        api.defaults.headers.common["Authorization"] = `Bearer ${stored}`;
        try {
          await fetchMe();
        } catch {
          await logout();
        }
      }
      setInitialized(true);
    })();
  }, []);

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#181818]">
        <p className="text-white">Carregando autenticação…</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{ user, token, isIconic, login, signUp, logout, refresh: fetchMe }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
