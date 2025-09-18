import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthService, AuthUser } from '@/lib/auth';
import { LocalStorage } from '@/lib/storage';
import type { LoginUser } from '@shared/schema';

interface AuthContextType {
  user: AuthUser | null;
  login: (credentials: LoginUser) => Promise<void>;
  quickLogin: (roleType: 'admin' | 'manager' | 'staff') => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        // Check for existing session
        const currentUser = AuthService.getCurrentUser();
        console.log('currentUser == ', currentUser)
        setUser(currentUser);
      } catch (err) {
        console.error("Init failed:", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);


  const login = async (credentials: LoginUser) => {
    try {
      const authUser = await AuthService.login(credentials); // ✅ wait for backend
      setUser(authUser);
    } catch (error) {
      throw error;
    }
  };

  const quickLogin = async (roleType: 'admin' | 'manager' | 'staff') => {
    try {
      const authUser = await AuthService.quickLogin(roleType); // ✅ await
      setUser(authUser);
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData: any) => {
    try {
      const authUser = await AuthService.register(userData); // ✅ await
      setUser(authUser);
    } catch (error) {
      throw error;
    }
  };
  const logout = () => {
    AuthService.logout();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    login,
    quickLogin,
    register,
    logout,
    isAuthenticated: !!user,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
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
