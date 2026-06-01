import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as MockUser } from '../data/mockData';
import { supabase } from '../data/supabaseService';

// Reusing MockUser interface for backwards compatibility with the UI, 
// but we will populate it from Supabase auth and user_roles table.
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'founder' | 'public';
  startupId?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isSessionValid: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => {},
  logout: async () => {},
  isLoading: true,
  isSessionValid: async () => false
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Initial session fetch
    const initSession = async () => {
      if (!supabase) {
        setIsLoading(false);
        return; // Fallback se não tiver Supabase configurado
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await loadUserProfile(session.user);
      } else {
        setIsLoading(false);
      }
    };

    initSession();

    // 2. Listen for auth changes
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        console.log(`[AuthContext] Evento de Auth disparado: ${event}`, session?.user?.id);
        if (event === 'SIGNED_IN' && session?.user) {
          console.log("[AuthContext] Iniciando loadUserProfile...");
          setTimeout(() => {
            loadUserProfile(session.user).then(() => {
              console.log("[AuthContext] loadUserProfile finalizado!");
            });
          }, 0);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsLoading(false);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          setTimeout(() => loadUserProfile(session.user), 0);
        } else if (event === 'INITIAL_SESSION' && session?.user) {
          setTimeout(() => loadUserProfile(session.user), 0);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const loadUserProfile = async (authUser: any) => {
    try {
      if (!supabase) return;

      // Busca a role e a startup do usuário na tabela user_roles
      const { data, error } = await supabase
        .from('user_roles')
        .select('role, startup_id')
        .eq('id', authUser.id)
        .single();

      // PGRST116: No rows found (not an error, user may be public)
      if (error && error.code !== 'PGRST116') {
        console.error("Erro ao carregar perfil do usuário", error);
        // If we get a 401, the session is invalid
        if (error.status === 401) {
          console.warn("Session expired, signing out");
          setUser(null);
          setIsLoading(false);
          return;
        }
      }

      setUser({
        id: authUser.id,
        name: authUser.user_metadata?.full_name || authUser.email.split('@')[0],
        email: authUser.email,
        role: data?.role || 'public',
        startupId: data?.startup_id || undefined
      });
    } catch (e) {
      console.error("Error loading user profile:", e);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password?: string) => {
    if (!supabase) {
      throw new Error("Supabase não está configurado. Verifique as variáveis de ambiente.");
    }
    
    if (!password) {
      throw new Error("Senha obrigatória");
    }

    console.log("[AuthContext] Chamando supabase.auth.signInWithPassword...");
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    console.log("[AuthContext] Resposta do Supabase:", { data, error });

    if (error) {
      throw error;
    }
  };

  const logout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
  };

  const isSessionValid = async (): Promise<boolean> => {
    if (!supabase) return false;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return !!session?.user;
    } catch {
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, isSessionValid }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
