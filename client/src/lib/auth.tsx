import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLocation } from "wouter";

// Mock user type
interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, name: string) => Promise<void>;
  register: (email: string, name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const MOCK_USER_KEY = "nexus_app_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Check for persisted user on mount
    const storedUser = localStorage.getItem(MOCK_USER_KEY);
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem(MOCK_USER_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, name: string = "Usuário Demo") => {
    setIsLoading(true);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newUser = {
      id: "1",
      name: name,
      email: email,
      avatar: "https://github.com/shadcn.png"
    };
    
    setUser(newUser);
    localStorage.setItem(MOCK_USER_KEY, JSON.stringify(newUser));
    setIsLoading(false);
    setLocation("/");
  };

  const register = async (email: string, name: string) => {
    // For this mockup, register is same as login
    await login(email, name);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(MOCK_USER_KEY);
    setLocation("/auth");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Component helper for protected routes
export function ProtectedRoute({ component: Component, ...rest }: any) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/auth");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return <Component {...rest} />;
}
