import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { api } from "@/lib/api";
import { loginWithGoogle } from "@/firebase";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  User as FirebaseUser,
} from "firebase/auth";

export type User = {
  id: string;
  email: string;
  nickname: string;
  full_name: string;
  is_iconic: boolean;
  role: string;
};

interface AuthContextProps {
  user: User | null;
  token: string | null;
  isIconic: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps>({} as AuthContextProps);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const auth = getAuth();

  /** ← carrega do localStorage para evitar fetch inicial */
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("user");
    return stored ? (JSON.parse(stored) as User) : null;
  });

  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("token")
  );
  const [isIconic, setIsIconic] = useState(() => Boolean(user?.is_iconic));
  const [initialized, setInitialized] = useState(false);

  /** pega /api/users/me e atualiza cache */
  const fetchMe = async () => {
    const res = await api.get<User>("/api/users/me");
    setUser(res.data);
    setIsIconic(Boolean(res.data.is_iconic));
    localStorage.setItem("user", JSON.stringify(res.data));
  };

  /** público – pode ser usado onde precisar de dados frescos */
  const refresh = async () => {
    try {
      if (token) await fetchMe();
    } catch (e) {
      console.error("Falha ao atualizar usuário", e);
    }
  };

  const exchangeAndStoreToken = async (idToken: string) => {
    const { data } = await api.post<{ access_token: string }>(
      "/api/auth/login/firebase",
      { idToken }
    );
    const jwt = data.access_token;
    localStorage.setItem("token", jwt);
    sessionStorage.setItem("firebase-authenticated", "true");
    setToken(jwt);
    api.defaults.headers.common["Authorization"] = `Bearer ${jwt}`;
    /** fazemos UM fetch agora para popular user e cache */
    await fetchMe();
  };

  const login = async () => {
    const idToken = await loginWithGoogle();
    if (idToken) await exchangeAndStoreToken(idToken);
  };

  const logout = async () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("firebase-authenticated");
    setToken(null);
    setUser(null);
    setIsIconic(false);
    delete api.defaults.headers.common["Authorization"];
    await signOut(auth);
  };

  /** ----- Inicialização sem pingar backend ----- */
  useEffect(() => {
    const prevAuth = sessionStorage.getItem("firebase-authenticated");
    if (prevAuth && token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      /* NÃO chama fetchMe agora: dados já em cache (ou serão buscados via refresh) */
      setInitialized(true);
    } else {
      /* Primeiro acesso ou token ausente → esperar Firebase */
      const unsubscribe = onAuthStateChanged(
        auth,
        async (fbUser: FirebaseUser | null) => {
          if (fbUser) {
            try {
              const idToken = await fbUser.getIdToken();
              await exchangeAndStoreToken(idToken);
            } catch {
              await logout();
            }
          }
          setInitialized(true);
        }
      );
      return unsubscribe;
    }
  }, [token]);

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#181818]">
        <p className="text-white">Carregando autenticação…</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{ user, token, isIconic, login, logout, refresh }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
