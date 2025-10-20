"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  user: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication status on mount
    const authStatus = localStorage.getItem('kitchen_auth');
    const userData = localStorage.getItem('kitchen_user');

    if (authStatus === 'true' && userData) {
      setIsAuthenticated(true);
      setUser(userData);
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Mock authentication - in a real app, this would be an API call
    if (email === "admin@restaurant.com" && password === "admin123") {
      setIsAuthenticated(true);
      setUser(email);
      localStorage.setItem('kitchen_auth', 'true');
      localStorage.setItem('kitchen_user', email);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('kitchen_auth');
    localStorage.removeItem('kitchen_user');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}