import { createContext, useContext, useState, useEffect } from "react";
import { apiRequest } from "./queryClient";
import { useToast } from "../hooks/use-toast";

const AuthContext = createContext({
  isAuthenticated: false,
  user: null,
  loading: true,
  login: async () => false,
  logout: () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem("token");
    
    if (token) {
      fetchUser(token);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async (token) => {
    try {
      const res = await fetch("/api/user/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      } else {
        // Token is invalid, clear it
        localStorage.removeItem("token");
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      localStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const res = await apiRequest("POST", "/api/auth/login", { email, password });
      const data = await res.json();
      
      localStorage.setItem("token", data.token);
      setUser(data.user);
      
      toast({
        title: "Login realizado com sucesso",
        description: "Bem-vindo(a) de volta!",
        variant: "default",
      });
      
      return true;
    } catch (error) {
      toast({
        title: "Erro ao fazer login",
        description: "Email ou senha inválidos",
        variant: "destructive",
      });
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    
    toast({
      title: "Logout realizado com sucesso",
      description: "Até a próxima!",
      variant: "default",
    });
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        user,
        loading,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);